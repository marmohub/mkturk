var DOCSIZE = {task: [], images: []}

//================== CREATE FIRESTORE DOCS ====================//
async function saveBehaviorDatatoFirestore(TASK,ENV,CANVAS){
	// Get a new write batch
	var batch = db.batch();
	
	var taskRef = db.collection(FIRESTORECOLLECTION.DATA).doc(ENV.FirestoreDocRoot + '_task')

	var imagesRef = db.collection(FIRESTORECOLLECTION.DATA).doc(ENV.FirestoreDocRoot + '_images')
	batch.set(imagesRef,{Doctype: "images",
								Agent: ENV.Subject,
								ResearcherID: ENV.ResearcherID,
								CurrentDate: ENV.CurrentDate,
								CurrentDateValue: ENV.CurrentDate.valueOf(),
								Docname: ENV.FirestoreDocRoot + '_images',
								Taskdoc: ENV.FirestoreDocRoot + '_task',
								Imagesdoc: ENV.FirestoreDocRoot + '_images'}) //link docs
	if (FLAGS.scene3d == 0){
		//image meta & trial data for each image
		batch.update(imagesRef,IMAGES.Sample) //per image meta for sample bags
		batch.update(imagesRef,IMAGES.Test) //per image meta for test bags
	}
	else if (FLAGS.scene3d == 1){
		//scene meta
		batch.update(imagesRef, { "SampleScenes": IMAGES.Sample, "TestScenes": IMAGES.Test })
		batch.update(imagesRef,IMAGEMETA)
	}
	
	//task meta & trial data
	batch.set(taskRef,{Doctype: "task",
								Agent: ENV.Subject,
								CurrentDateValue: ENV.CurrentDate.valueOf(),
								Docname: ENV.FirestoreDocRoot + '_task',
								Imagesdoc: ENV.FirestoreDocRoot + '_images',
								Taskdoc: ENV.FirestoreDocRoot + '_task'}) //link docs
	batch.update(taskRef,ENV) // write all ENV metadata once
	batch.update(taskRef,TASK) // write all TASK metadata once
	batch.update(taskRef,CANVAS) // write all CANVAS metadata once

	// Commit the batch
	batch.commit().then(function () {
	    console.log("FIRESTORE: task & image docs batch created");
	    FLAGS.createnewfirestore = 0;

// 	    getFirestoreDocSize(FIRESTORECOLLECTION.DATA,imagesRef,"scenes")
	})
	.catch(function(error) {
		console.error("FIRESTORE: !Error creating database task or image doc: ", error);
	});
}
//================== CREATE FIRESTORE DOCS (end) ====================//


function pingFirestore(){
	if (FLAGS.firestorelastsavedtrial != CURRTRIAL.num && 
		typeof(firestoreTimer) != "undefined"){
		updateEventDataonFirestore(EVENTS)
	} //if timer expired & new data added
	else {
		firestoreTimer = setTimeout(function(){
			clearTimeout(firestoreTimer)
			pingFirestore()
		},10000)
	} //else check again in 10 seconds
}

//================== UPDATE FIRESTORE WITH EVENT DATA ====================//
async function updateEventDataonFirestore(EVENTS){
	// Get a new write batch
	var batch = db.batch();

	var taskRef = db.collection(FIRESTORECOLLECTION.DATA).doc(ENV.FirestoreDocRoot + '_task')
	batch.update(taskRef,EVENTS.trialseries)
	
	if (FLAGS.scene3d == 0){
		var imagesRef = db.collection(FIRESTORECOLLECTION.DATA).doc(ENV.FirestoreDocRoot + '_images')
		batch.update(imagesRef,EVENTS.imageseries)		
	}
	
	// Commit the batch
	var currtrial = CURRTRIAL.num
	await batch.commit().then(function () {
		FLAGS.firestorelastsavedtrial = currtrial
	    console.log("FIRESTORE: Trial " + FLAGS.firestorelastsavedtrial + "--Batch updated database task & image docs");

	    delete firestoreTimer //to start a new timer
		pingFirestore()
	})
	.catch(function(error) {
		console.error("FIRESTORE: !Trial" + FLAGS.firestorelastsavedtrial + "--Error updating database task or image doc: ", error);

		delete firestoreTimer //to start a new timer
		pingFirestore()
	});
}
//================== UPDATE FIRESTORE WITH EVENT DATA (end) ====================//


async function loadAgentRFIDfromFirestore(subject,species){
	if (species != "marmoset"){
		ENV.AgentRFID = "XX"	
	}
	else {
		try{
			var docRef = db.collection("marmosets").doc(subject)
			var doc = await db.collection("marmosets").doc(subject).get()

			if (doc.exists == false){
				ENV.AgentRFID = "XX"	
				console.log('MISSING AGENT: no biographical document in firestore database for this agent')				
			}
			else {
				ENV.AgentRFID = doc.data().rfid
			}
		}
		catch(error){
			ENV.AgentRFID = "XX"	
			console.log('no subject document in firestore database for this agent')
		}
	}
}

async function queryRFIDTagonFirestore(tag){
	var query = await db.collection(FIRESTORECOLLECTION.AGENTS).where("rfid","==",tag)
	var querySnapshot = query.get()
	.then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
			ENV.Subject = doc.data().name
			console.log('AUTO-FOUND AGENT ' + ENV.Subject)
			QuickLoad.load = 1
			waitforClick.next(1)
        }); //forEach
	}) //.then
} //FUNCTION queryRFIDTagonFirestore

async function queryDeviceonFirestore(deviceName){
	var query = await db.collection(FIRESTORECOLLECTION.DEVICES).where("model","==",deviceName.toLowerCase())
	var querySnapshot = await query.get()
	return new Promise(
		function(resolve, reject){
			try {
				if (querySnapshot.size==0){
					resolve({screenSizeInches: [-1], screenPhysicalPixels: [-1], screenRatio: -1, ppi: -1})
				}
				querySnapshot.forEach(function(doc){
					if (typeof(doc.data().screenRatio) == "undefined"){
						//do nothing
						resolve({screenSizeInches: [-1], screenPhysicalPixels: [-1], screenRatio: -1, ppi: -1})
					} //END if no matching device
					else {
						resolve({screenSizeInches: doc.data().screenSizeInches, screenPhysicalPixels: doc.data().screenPhysicalPixels, screenRatio: doc.data().screenRatio, ppi: doc.data().ppi})
					} //END else matching device
				})		
			} //try
			catch (error){
				console.log(error)
			} //catch
		}
	) //Promise
} //FUNCTION queryDeviceonFirestore


async function saveEyeCalibrationtoFirestore(xparams,yparams,calibtype,ntrain,trainmse,ntest,testmse){	
	db.collection(FIRESTORECOLLECTION.CALIBRATION)
	.doc(ENV.Subject)
	.set({ Doctype: "calibration",
			//General
			Agent: ENV.Subject,
			ResearcherID: ENV.ResearcherID,
			ResearcherDisplayName: ENV.ResearcherDisplayName,
			CurrentDate: ENV.CurrentDate,
			CurrentDateValue: ENV.CurrentDate.valueOf(),
			Taskdoc: ENV.FirestoreDocRoot + '_task',
			//Calib specific
			CalibXTransform: xparams,
			CalibYTransform: yparams,
			CalibType: calibtype,
			NCalibPointsTrain: ntrain,
			NCalibPointsTest: ntest,
			CalibTrainMSE: trainmse,
			CalibTestMSE: testmse
		}) //link docs
	.then(function () {
	    console.log("FIRESTORE: eye calibration doc created");
	})
	.catch(function(error) {
		console.error("FIRESTORE: !Error creating eye calibration doc: ", error);
	});
} //FUNCTION saveEyeCalibrationtoFirestore

async function loadEyeCalibrationfromFirestore(subject){
	var doc = await db.collection(FIRESTORECOLLECTION.CALIBRATION).doc(subject).get()
	return new Promise(
		function(resolve, reject){
			try{
				if (doc.exists == false){
					console.log('MISSING CALIBRATION FOR AGENT: will use default')
				}
				else {
					ENV.Eye.CalibXTransform = doc.data().CalibXTransform
					ENV.Eye.CalibYTransform = doc.data().CalibYTransform
					ENV.Eye.CalibType = doc.data().CalibType

					//Start calib doc snapshot listener
					db.collection(FIRESTORECOLLECTION.CALIBRATION).doc(ENV.Subject).onSnapshot(
					function(doc){
						if (FLAGS.savedata == 0){
							//manual changes to calibration on the fly during practice
							ENV.Eye.CalibXTransform = doc.data().CalibXTransform
							ENV.Eye.CalibYTransform = doc.data().CalibYTransform
							ENV.Eye.CalibType = doc.data().CalibType
							console.log("Calib data changed on firestore");
						}
						else if (FLAGS.savedata == 1){
							// do not allow changes to the calibration during data collection
						}
					});
				}//ELSE doc exists
				resolve(1)
			}//TRY
			catch(error){
				console.log('Error getting eye calibration doc for this agent')
			}//CATCH
		}) //Promise
}//FUNCTION loadEyeCalibrationfromFirestore


function getFirestoreDocSize(collectionName,docRef,doctype){
    docRef.get().then(function(doc){
        if (doc.exists){
            console.log("FIRESTORE: Document found " + doc.id)
            docSize = calcFirestoreDocSize(collectionName,doc.id,doc.data())
            console.log("FIRESTORE: Document size : " + docSize + " bytes")
            DOCSIZE[doctype][CURRTRIAL.num-1] = docSize
            if (docSize > 200000){
            	console.log("Firestore " + doc.id + " is LARGE!  " + docSize + " bytes")
            }
        }
    })
} //get the firestore doc


//from: https://stackoverflow.com/questions/49473148/calculating-size-of-google-firestore-documents
function calcFirestoreDocSize(collectionName, docId, docObject) {
    let docNameSize = encodedLength(collectionName) + 1 + 16
    let docIdType = typeof(docId)
    if(docIdType === 'string') {
        docNameSize += encodedLength(docId) + 1
    } else {
        docNameSize += 8
    }  
    let docSize = docNameSize + calcObjSize(docObject)

    return  docSize
}
function encodedLength(str) {
    var len = str.length;
    for (let i = str.length - 1; i >= 0; i--) {
        var code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) {
            len++;
        } else if (code > 0x7ff && code <= 0xffff) {
            len += 2;
        } if (code >= 0xDC00 && code <= 0xDFFF) {
            i--;
        }
    }
    return len;
}

function calcObjSize(obj) {
    let key;
    let size = 0;
    let type = typeof obj;

    if(!obj) {
        return 1
    } else if(type === 'number') {
        return 8
    } else if(type === 'string') {
        return encodedLength(obj) + 1
    } else if(type === 'boolean') {
        return 1
    } else if (obj instanceof Date) {
        return 8
    } else if(obj instanceof Array) {
        for(let i = 0; i < obj.length; i++) {
            size += calcObjSize(obj[i])
        }
        return size
    } else if(type === 'object') {

        for(key of Object.keys(obj)) {
            size += encodedLength(key) + 1 
            size += calcObjSize(obj[key])
        }
        return size += 32
    }
}

function savetofirestore(docref,data){
	docref.set(data).then(function () {
	    console.log("FIRESTORE: wrote to firestore");
	})
	.catch(function(error) {
		console.error("FIRESTORE: !Error creating database meta/trialseries docs: ", error);
	});
}