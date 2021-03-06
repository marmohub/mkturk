//================== INITIALIZE GLOBALS ==================//
// In the interest of code readability and spaghetti-minimization, the use of globals should be kept to a minimum, and instead explicit passage of variables into and out of functions is encouraged.
// For certain things, globals make sense and may even be required, like event listeners and async processes.

//================ TASK,TRIAL,ENV (SAVED) ================//
// TASK <-- Read from Subject Parameter file
// ENV <-- TASK drives creation of ENV
// TASK,TRIAL,ENV --> Saved to Behavioral Data file
var TASK = {}; // Global that encapsulates state of the current task, read from Subject's Params file
var TRIAL = resetTRIAL() // Global that contains data variables that are incremented every trial, and are dumped to disk for scientific purposes.
var ENV = {}; // Task specific variables that are slaves to TASK settings, but still desired to be recorded. Hence, they should not appear in the TASK-based params file, but should be logged on their own. 
var IMAGES = {
	Sample: {}, Test: {}, 
	object: {sample:{}, test: {}},
	imagepaths: {Ordered_Samplebag_Filenames: {}, Ordered_Testbag_Filenames: {}},
}

var OBJECTS = {}
var CAMERAS = {}
var LIGHTS = {}

var ImageRewardList = {}
var QuickLoad = { load: 0, agent: '', connectusb: 0}

ENV.ResearcherDisplayName = ''
ENV.ResearcherEmail = ''
ENV.ResearcherID = ''
ENV.USBDeviceType = ''
ENV.USBDeviceName = ''
ENV.Subject = ''
ENV.AgentRFID = "XX"
ENV.CurrentDate = new Date;
ENV.ImageHeightPixels = NaN; 
ENV.ImageWidthPixels = NaN;
ENV.CanvasRatio = 1
ENV.DevicePixelRatio = 1
ENV.ThreeJSRenderRatio = 4
ENV.FixationRadius = 0
ENV.FixationColor = ''
ENV.ChoiceRadius = 0
ENV.ChoiceColor = 'white'
ENV.XGridCenter = []
ENV.YGridCenter = []
ENV.RewardDuration = NaN
ENV.ParamFileName = ''
ENV.ParamFileRev = ''
ENV.ParamFileDate = '' //stores complete path to subject parameter file
ENV.DataFileName = '' //stores complete path to behavioral data file
ENV.FirestoreDocRoot = ''
ENV.CurrentAutomatorStageName = ''
ENV.MinPercentCriterion = -1
ENV.MinTrialsCriterion = -1

ENV.WebBluetoothAvailable = 0
ENV.WebUSBAvailable = 0
ENV.BatteryAPIAvailable = 0
ENV.OffscreenCanvasAvailable = 0


ENV.UserAgent = window.navigator.userAgent
ENV.DeviceType = ''
ENV.DeviceBrand = ''
ENV.DeviceName = ''
ENV.DeviceScreenWidth = ''
ENV.DeviceScreenHeight = ''
ENV.DeviceGPU = ''
ENV.DeviceBrowserName = ''
ENV.DeviceBrowserVersion = ''
ENV.DeviceOSName = ''
ENV.DeviceOSCodename = ''
ENV.DeviceOSVersion = ''
ENV.DeviceTouchscreen = ''

ENV.ScreenRatio = -1
ENV.ScreenSizePixels = [-1,-1]
ENV.ScreenSizeInches = [-1,-1,-1]
ENV.ViewportPixels = [-1,-1]

ENV.ViewportPPI = -1
ENV.PhysicalPPI = -1

ENV.Task = ""

ENV.FixationScale = -1
ENV.SampleScale = -1
ENV.TestScale = -1
ENV.ChoiceScale = -1


//================ EYE GLOBALS ================//
ENV.Eye = {}

//Eye states
ENV.Eye.EventType = 'eyestart'
ENV.Eye.timeOfLastGlanceInBB = -1
ENV.Eye.BlinkGracePeriod = 200

//Calibration
ENV.Eye.calibration = 0;
ENV.Eye.CalibXTransform = []
ENV.Eye.CalibYTransform = []
ENV.Eye.CalibType = 'default'
ENV.Eye.NCalibPointsTrain = 0
ENV.Eye.NCalibPointsTest = 0
ENV.Eye.CalibTrainMSE = []
ENV.Eye.CalibTestMSE = []

//================ OTHER GLOBALS (NOT SAVED) ================//
var FLAGS = {} // Global that keeps track of the task's requests to the Dropbox/server/disk/whatever; buffering requests; etc.
// The scientist does not care about tracking this variable into the behavioral files. 
FLAGS.consecutivehits = 0;
FLAGS.need2loadImagesTrialQueue = 1; 
FLAGS.need2loadScenes = 1;
FLAGS.scene3d = 0;
FLAGS.need2loadParameters = 1; 
FLAGS.savedata = 0; 
FLAGS.stage = 0; 
FLAGS.imagesPresent = 0;
FLAGS.stickyresponse = 0;

FLAGS.waitingforTouches = 0
FLAGS.touchduration = -1;
FLAGS.punishOutsideTouch = 0
FLAGS.acquiredTouch = 0
FLAGS.touchGeneratorCreated = 0
FLAGS.runPump = 0
FLAGS.firestorecreatedoc = 0
FLAGS.firestorelastsavedtrial = 0
FLAGS.firestoretimeron = 0
FLAGS.stressTest = 0
FLAGS.RFIDGeneratorCreated = 0

var CANVAS = {}; 
var CANVAS = {
	names: ["blank","sample","test","touchfix","eyefix","reward","photoreward","punish","choice"],
	front: "blank",
	sequenceblank: ["blank","blank"], 
	tsequenceblank: [0,50], 
	sequencepre: ["touchfix"],
	tsequencepre: [0],
	sequence: ["blank","sample","blank","test"], // blank, sample, blank, test
	tsequence: NaN, 
	sequencepost: ["blank","reward","blank"], // blank, reward
	tsequencepost: [0,50,100],
	headsupfraction: NaN,
	offsetleft: 0,
	offsettop: 0,
}

var OFFSCREENCANVAS = null
var VISIBLECANVAS = document.getElementById("canvasvisible")
var VISIBLECANVASWEBGL = document.getElementById("canvasvisiblewebgl")
var EYETRACKERCANVAS = document.getElementById("canvaseyetracker")


var frame = {
	current: 0,
	shown: [],
}

// States of the current trial, entered into running trialhistory
var CURRTRIAL = {}
CURRTRIAL.num = 0;
CURRTRIAL.starttime = NaN; 
CURRTRIAL.fixationgridindex = NaN; 
CURRTRIAL.fixationxyt = [];
CURRTRIAL.allfixationxyt = [];
CURRTRIAL.sampleindex = NaN;
CURRTRIAL.sampleimage = [];
CURRTRIAL.testindices = NaN;
CURRTRIAL.testimages = [];
CURRTRIAL.responsexyt = []; 
CURRTRIAL.response = []; 
CURRTRIAL.correctitem = NaN;
CURRTRIAL.correct = [];
CURRTRIAL.nreward = NaN;
CURRTRIAL.fixationtouchevent = ""
CURRTRIAL.responsetouchevent = ""
CURRTRIAL.lastTrialCompleted = new Date
CURRTRIAL.lastFirebaseSave = new Date
CURRTRIAL.tsequenceactual = []
CURRTRIAL.tsequencedesired = []
CURRTRIAL.xyt = [];

CURRTRIAL.sampleobjectty = []
CURRTRIAL.sampleobjecttz = []
CURRTRIAL.sampleobjectrxy = []
CURRTRIAL.sampleobjectrxz = []
CURRTRIAL.sampleobjectryz = []
CURRTRIAL.sampleobjectscale = []

CURRTRIAL.testobjectty = []
CURRTRIAL.testobjecttz = []
CURRTRIAL.testobjectrxy = []
CURRTRIAL.testobjectrxz = []
CURRTRIAL.testobjectryz = []
CURRTRIAL.testobjectscale = []

CURRTRIAL.sample_scenebag_label = NaN
CURRTRIAL.sample_scenebag_index = NaN
CURRTRIAL.test_scenebag_labels = NaN
CURRTRIAL.test_scenebag_indices = NaN

var EVENTS = {}
EVENTS.reset = function(){
	this.trialnum = CURRTRIAL.num;
	this.trialseries = {};
	this.timeseries = {};
	this.imageseries = {};
	this.trialseries.Sample = {}
	this.trialseries.Test = {}
	this.trialseries.CorrectItem = {}
	this.trialseries.FixationGridIndex = {}
	this.trialseries.StartTime = {}
	this.trialseries.FixationTouchEvent = {}
	this.trialseries.FixationXYT = {}
	this.trialseries.Response = {}
	this.trialseries.TSequenceDesired = {}
	this.trialseries.TSequenceActual = {}
	this.trialseries.ResponseTouchEvent = {}
	this.trialseries.ResponseXYT = {}
	this.trialseries.Response = {}
	this.trialseries.NReward = {}
	this.trialseries.BatteryLDT = {}	
	this.trialseries.BLEBatteryLT = {}
	this.timeseries.RFIDTag = {}
	this.timeseries.Weight = {}
	this.timeseries.EyeData = {}

	this.imageseries.SampleObjectTy = {}
	this.imageseries.SampleObjectTz = {}
	this.imageseries.SampleObjectRxy = {}
	this.imageseries.SampleObjectRxz = {}
	this.imageseries.SampleObjectRyz = {}
	this.imageseries.SampleObjectScale = {}
	this.imageseries.TestObjectTy = {}
	this.imageseries.TestObjectTz = {}
	this.imageseries.TestObjectRxy = {}
	this.imageseries.TestObjectRxz = {}
	this.imageseries.TestObjectRyz = {}
	this.imageseries.TestObjectScale = {}
}
EVENTS.reset()


var trialhistory = {}
trialhistory.trainingstage = []
trialhistory.starttime = []
trialhistory.response = []
trialhistory.correct = []


var sounds = {
	serial: [0,1,2,3,4],
	buffer: [],
}
var boundingBoxesFixation={}; //where the fixation touch targets are on the canvas
var boundingBoxesChoice={}; //where the choice touch targets are on the canvas
var waitforClick; //variable to hold generator
var waitforEvent; //variable to hold generator
var touchTimer; //variable to hold timer
var xcanvascenter=[];
var ycanvascenter=[];
var curridx = null;
var datafiles=[];
var displayoutofboundsstr=""
var imageloadingtimestr="Loaded: "

//================ UPDATE VARIABLE FUNCTIONS ================//
function resetTRIAL(){
	var TRIAL = {}
	TRIAL.StartTime = []
	TRIAL.FixationGridIndex = []
	TRIAL.FixationXYT=[]
	TRIAL.AllFixationXYT=[]
	TRIAL.Sample = []
	TRIAL.Test = []
	TRIAL.ResponseXYT = []
	TRIAL.Response = []
	TRIAL.CorrectItem = []
	TRIAL.FixationTouchEvent = []
	TRIAL.ResponseTouchEvent = []
	TRIAL.NReward = []
	TRIAL.AutomatorStage = []
	TRIAL.TSequenceDesired = []
	TRIAL.TSequenceActual = []
	TRIAL.RFIDTag = []
	TRIAL.RFIDTime = []
	TRIAL.RFIDTrial = []
	TRIAL.NRFID = 0
	TRIAL.Weight = []
	TRIAL.WeightTime = []
	TRIAL.WeightTrial = []
	TRIAL.NWeights = 0
	TRIAL.BatteryLDT = []	
	if (typeof(navigator.getBattery) == "function"){
			navigator.getBattery().then(function(batteryobj){
			TRIAL.BatteryLDT.push([batteryobj.level, batteryobj.dischargingTime, Date.now() - ENV.CurrentDate.valueOf()]);
			logEVENTS("BatteryLDT",TRIAL.BatteryLDT[TRIAL.BatteryLDT.length-1],"trialseries")
		}) // starting battery level
	}

	if (typeof(FLAGS) != "undefined" && FLAGS.scene3d == 0){
		TRIAL.SampleObjectTy = []
		TRIAL.SampleObjectTz = []
		TRIAL.SampleObjectRxy = []
		TRIAL.SampleObjectRxz = []
		TRIAL.SampleObjectRyz = []
		TRIAL.SampleObjectScale = []

		TRIAL.TestObjectTy = []
		TRIAL.TestObjectTz = []
		TRIAL.TestObjectRxy = []
		TRIAL.TestObjectRxz = []
		TRIAL.TestObjectRyz = []
		TRIAL.TestObjectScale = []		
	}

	return TRIAL
}

function updateTRIAL(){
	TRIAL.StartTime[CURRTRIAL.num] = CURRTRIAL.starttime
	TRIAL.FixationGridIndex[CURRTRIAL.num] = CURRTRIAL.fixationgridindex
	TRIAL.FixationXYT[CURRTRIAL.num] = CURRTRIAL.fixationxyt
	TRIAL.AllFixationXYT[CURRTRIAL.num] = CURRTRIAL.allfixationxyt	
	TRIAL.Sample[CURRTRIAL.num] = CURRTRIAL.sampleindex 
	TRIAL.Test[CURRTRIAL.num] = CURRTRIAL.testindices 
	TRIAL.ResponseXYT[CURRTRIAL.num] = CURRTRIAL.responsexyt
	TRIAL.Response[CURRTRIAL.num] = CURRTRIAL.response
	TRIAL.FixationTouchEvent[CURRTRIAL.num] = CURRTRIAL.fixationtouchevent
	TRIAL.ResponseTouchEvent[CURRTRIAL.num] = CURRTRIAL.responsetouchevent
	TRIAL.CorrectItem[CURRTRIAL.num] = CURRTRIAL.correctitem
	TRIAL.NReward[CURRTRIAL.num] = CURRTRIAL.nreward
	TRIAL.AutomatorStage[CURRTRIAL.num] = TASK.CurrentAutomatorStage; 
	TRIAL.TSequenceDesired[CURRTRIAL.num] = CURRTRIAL.tsequencedesired
	TRIAL.TSequenceActual[CURRTRIAL.num] = CURRTRIAL.tsequenceactual

	if (FLAGS.scene3d == 0){
		TRIAL.SampleObjectTy[CURRTRIAL.num] = CURRTRIAL.sampleobjectty
		TRIAL.SampleObjectTz[CURRTRIAL.num] = CURRTRIAL.sampleobjecttz
		TRIAL.SampleObjectRxy[CURRTRIAL.num] = CURRTRIAL.sampleobjectrxy
		TRIAL.SampleObjectRxz[CURRTRIAL.num] = CURRTRIAL.sampleobjectrxz
		TRIAL.SampleObjectRyz[CURRTRIAL.num] = CURRTRIAL.sampleobjectryz
		TRIAL.SampleObjectScale[CURRTRIAL.num] = CURRTRIAL.sampleobjectscale

		TRIAL.TestObjectTy[CURRTRIAL.num] = CURRTRIAL.testobjectty
		TRIAL.TestObjectTz[CURRTRIAL.num] = CURRTRIAL.testobjecttz
		TRIAL.TestObjectRxy[CURRTRIAL.num] = CURRTRIAL.testobjectrxy
		TRIAL.TestObjectRxz[CURRTRIAL.num] = CURRTRIAL.testobjectrxz
		TRIAL.TestObjectRyz[CURRTRIAL.num] = CURRTRIAL.testobjectryz
		TRIAL.TestObjectScale[CURRTRIAL.num] = CURRTRIAL.testobjectscale
	}
}

function updateTrialHistory(){
	var current_stage = stageHash(TASK); 
	trialhistory.trainingstage.push(current_stage);
	trialhistory.starttime.push(CURRTRIAL.starttime)
	trialhistory.response.push(CURRTRIAL.response)
	trialhistory.correct.push(CURRTRIAL.correct)
}

function logEVENTS(eventname,eventval,eventtype){
	//log events for a trial
	if (eventtype == 'trialseries' || eventtype == 'imageseries'){
		
		//index by trial
		var indevent = EVENTS.trialnum
		if (eventname == 'BatteryLDT'){
			var indevent = TRIAL.BatteryLDT.length-1
		}
		if (eventname == 'BLEBatteryLT'){
			var indevent = blescale.tbattery.length-1
		}

		if (FLAGS.savedata == 0){
			indevent = 0 //store most recent trial in first position until start saving data
		}
// 		EVENTS[eventtype][eventname][indevent.toString()] = eventval

		if (typeof(eventval) == "number" ||
			typeof(eventval) == "string" || 
			eventval.length == 1){
			if (!Array.isArray(EVENTS[eventtype][eventname])){
				EVENTS[eventtype][eventname] = []; //initialize to array
			} //if initialized as object, convert to array
			EVENTS[eventtype][eventname][indevent] = eventval
		}
		else if (typeof(eventval) == "object" ||
				eventval.length > 1){
			for (var i=0; i<=eventval.length-1; i++){
				if (typeof(EVENTS[eventtype][eventname][i.toString()]) == "undefined"){
					EVENTS[eventtype][eventname][i.toString()]={}; //initialize array
					EVENTS[eventtype][eventname][i.toString()] = []
				} //if not initialized
				EVENTS[eventtype][eventname][i.toString()][indevent] = eventval[i]
			}
		}
	}
	else if (eventtype == 'timeseries'){
		//running index
		var indevent = Object.keys(EVENTS[eventtype][eventname]).length
		if (FLAGS.savedata == 0){
			indevent = 0 //store most recent timepoint in first position until start saving data
		}
		var trialtime = [EVENTS.trialnum, Date.now() - ENV.CurrentDate.valueOf()]
		EVENTS[eventtype][eventname][indevent.toString()] = trialtime.concat(eventval)
	}
}

function purgeTrackingVariables(){
	// Purges heresies committed in the test period 
	TRIAL = resetTRIAL()

	ENV.CurrentDate = new Date;
	var datestr = ENV.CurrentDate.toISOString();
	ENV.DataFileName = DATA_SAVEPATH + ENV.Subject + "/" + datestr.slice(0,datestr.indexOf(".")) + "_" + ENV.Subject + ".txt";
	ENV.FirestoreDocRoot = datestr.slice(0,datestr.indexOf(".")) + "_" + ENV.Subject

	if(FLAGS.waitingforTouches > 0 || FLAGS.purge == 1){
		// purge requested by user at beginning of trial during fixation (most likely) 
		console.log('setting to 0')
		CURRTRIAL.num = 0
		EVENTS.trialnum = 0
	}
	else{
		console.log('setting to -1')
		// purge requested by automator at end of trial
		CURRTRIAL.num = -1;
	}
	
	FLAGS.sampleblockcount = 0; 
	FLAGS.consecutivehits = 0; 

	return 
}