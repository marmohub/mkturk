class TrialQueue { 

constructor(samplingStrategy, ImageBagsSample, ImageBagsTest){

	// Properties
	this.samplingStrategy = samplingStrategy; 
	this.ImageBagsSample = ImageBagsSample; 
	this.ImageBagsTest = ImageBagsTest; 

	// Queues
	this.sampleq = {}
	this.sampleq.filename = []; 
	this.sampleq.index = [];
	this.samplebucket = [];


	this.testq = {}
	this.testq.filenames = []; 
	this.testq.indices = []; 
	this.testq.correctIndex = [];

	this.currentbag = -1;

	// ImageBuffer
	this.IB = new ImageBuffer(); 

	// Settings 
	this.max_queue_size = 5200; // Max number of trials (and their images) to have prepared from now; to improve browser performance
	this.num_in_queue = 0; // Tracking variable
}

async build(trial_cushion_size){
	// Call after construction
	var funcreturn = await loadImageBagPathsParallelFirebase(this.ImageBagsSample); 
	this.samplebag_labels = funcreturn[1];
	this.samplebag_paths = funcreturn[0]; 

	this.samplebag_block_indices = new Array(this.samplebag_labels.length)
	for (var i = 0; i<=this.samplebag_labels.length-1; i++){
		this.samplebag_block_indices[i] = i;
	}

	var funcreturn = await loadImageBagPathsParallelFirebase(this.ImageBagsTest); 
	this.testbag_labels = funcreturn[1];
	this.testbag_paths = funcreturn[0];

	for (var i=0; i<=this.samplebag_block_indices.length-1; i++){
		this.samplebucket.push(i)
	}

	// array of zeros
	this.ntrials_per_bag = new Array(Math.max(...this.samplebag_labels)+1)
	this.ntrials_per_bag.fill(0,0,this.ntrials_per_bag.length)

	console.log('this.build() will generate ' + trial_cushion_size + ' trials')
	await this.generate_trials(trial_cushion_size); 
}

async generate_trials(n_trials){
	// Performance critical: sometimes called by this.get_next_trial() (when TQ is empty), which is called during each mkturk trial

	// Adds trials to queue and downloads their images 

	n_trials = Math.min(this.max_queue_size - this.num_in_queue, n_trials);
	if (this.max_queue_size <= this.num_in_queue){
		n_trials=0
	}
	if(n_trials == 0){
		console.log('TQ.generate_trials(): Queue is full or no trials were requested')
		return 
	}

	var image_requests = []; 

	// console.log('TQ.generate_trials() will generate '+n_trials+' trials')

	for (var i = 0; i < n_trials; i++){
		if (TASK.NTrialsPerBagBlock <= 0){
			// do nothing
		} //use all bags in block
		else if (TASK.NTrialsPerBagBlock > 0){
			if (this.currentbag < 0 || this.ntrials_per_bag[this.currentbag] == TASK.NTrialsPerBagBlock){
				
				// Increment bag
				if (this.currentbag < 0){
					this.currentbag = 0; //initialize with first bag
				}
				else{
					this.ntrials_per_bag[this.currentbag] = 0; //reset trials
					this.currentbag = this.currentbag + 1; //go to next bag

					if (this.currentbag >= this.ntrials_per_bag.length){
						this.currentbag = 0; //go back to first bag
					}
				}

				// make new bag
				this.samplebag_block_indices = []
				for (var j = 0; j <= this.samplebag_labels.length-1; j++){
					if (this.samplebag_labels[j] == this.currentbag){
						this.samplebag_block_indices.push(j)
					}
				} //for j images in bag
			} // if ntrials_per_bag exceeded
		} // if sample all bags vs blocks

		// Draw one (1) sample image from samplebag
		var sample_index = this.selectSampleImage(this.samplebag_block_indices, this.samplingStrategy)
		var sample_label = this.samplebag_labels[sample_index]; 
		var sample_filename = this.samplebag_paths[sample_index]; 

		this.ntrials_per_bag[sample_label] = this.ntrials_per_bag[sample_label] + 1
		
		image_requests.push(sample_filename)

		// Select appropriate test images (correct one and distractors) 
		var funcreturn = this.selectTestImages(sample_label, this.testbag_labels) 
		var test_filenames = []
		if (TASK.TestON <= 0){
			var test_indices = funcreturn[0] 
			for (var j = 0; j < test_indices.length; j++){
				test_filenames.push(this.testbag_paths[test_indices[j]])
			}
		} // m2s or sr2
		else if (TASK.TestON > 0) {
			var test_indices = funcreturn[0][0]
			test_filenames.push(this.testbag_paths[test_indices])
		} //Same-Different Task = one side of the Match-to-Sample
		var correctIndex = funcreturn[1] 

		image_requests.push(... test_filenames)

		// Add to queue 
		this.sampleq.filename.push(sample_filename)
		this.sampleq.index.push(sample_index)

		this.testq.filenames.push(test_filenames)
		this.testq.indices.push(test_indices)
		this.testq.correctIndex.push(correctIndex)

		this.num_in_queue++;
	}
	// Download images to support these trials to download queue
	// console.log("TQ.generate_trials() will request", image_requests.length)
	await this.IB.cache_these_images(image_requests); 
}


async get_next_trial(){
	// Shift out first element of Trial queue and return it
	// along with its sample/test images 

	if (this.sampleq.filename.length == 0){
		// console.log("Reached end of trial queue... generating one more in this.get_next_trial")
		await this.generate_trials(1); 
	}

	var sample_filename = this.sampleq.filename.shift(); 
	var sample_index = this.sampleq.index.shift(); 

	var test_filenames = this.testq.filenames.shift(); 
	var test_indices = this.testq.indices.shift(); 
	var test_correctIndex = this.testq.correctIndex.shift();


	// If the past NStickyResponse trials has been on one side, then make this upcoming trial's correct answer be at another location. 
	if (FLAGS.stickyresponse >= TASK.NStickyResponse &&
		TASK.NStickyResponse > 0 && 
		test_correctIndex == TRIAL.Response[CURRTRIAL.num-1])
	{
		console.log('Moving correct response to nonstick location')
		var sticky_grid_location = TRIAL.Response[CURRTRIAL.num-1]; 
		if (sticky_grid_location == undefined){
			console.log('Something strange has happened in the stickyresponse logic')
		}

		var candidate_nonstick_locations = []
		for (var i = 0; i < test_indices.length; i++){
			if (i == sticky_grid_location)
				{continue}
			else if (i != sticky_grid_location){
				candidate_nonstick_locations.push(i)
			}
			else{throw 'Error occurred in sticky response logic'}
		}
		
		// Switch correct_label into correct_label_nonstick_location
		var correct_label_nonstick_location =candidate_nonstick_locations[Math.floor((candidate_nonstick_locations.length)*Math.random())];

		var tempfilename = test_filenames[correct_label_nonstick_location]
		test_filenames[correct_label_nonstick_location] = test_filenames[sticky_grid_location]
		test_filenames[sticky_grid_location] = tempfilename

		var tempindex = test_indices[correct_label_nonstick_location]
		test_indices[correct_label_nonstick_location] = test_indices[sticky_grid_location]
		test_indices[sticky_grid_location] = tempindex

		test_correctIndex = correct_label_nonstick_location
	}

	// Get image from imagebag
	var sample_image = await this.IB.get_by_name(sample_filename); 
	var sample_reward = -1
	if (typeof(ImageRewardList[sample_filename]) != "undefined"){
		sample_reward = ImageRewardList[sample_filename]		
	}
	
	var test_images = []
	for (var i = 0; i < test_filenames.length; i++){
		test_images.push(await this.IB.get_by_name(test_filenames[i]))
	}

	// console.log('sample- get_next_trial()  image:', sample_index, '. name:', sample_filename); 
	// console.log('test- get_next_trial() images:', test_indices, '. name:', test_filenames); 
	// console.log('correct- get_next_trial()', test_correctIndex)
	this.num_in_queue--;

	return [sample_image, sample_index, test_images, test_indices, test_correctIndex, sample_reward]
}//FUNCTION get_next_trial

selectSampleImage(samplebag_indices, SamplingStrategy){

//global bucket
if (this.samplebucket.length == 0){
	for (var i=0; i<=samplebag_indices.length-1; i++){
		this.samplebucket.push(i)
	}
}//Need to make a new bucket


	// Vanilla random uniform sampling with replacement: 
	var sample_image_index = NaN
	if(SamplingStrategy == 'uniform_with_replacement'){
		sample_image_index = this.samplebucket[Math.floor((this.samplebucket.length)*Math.random())];
	}
	else if (SamplingStrategy == 'uniform_without_replacement'){
		var randind = Math.floor((this.samplebucket.length)*Math.random())
		sample_image_index = this.samplebucket[randind]
		this.samplebucket.splice(randind,1)
	}
	else if (SamplingStrategy == 'sequential'){
		sample_image_index = this.samplebucket[0] //take next image
		this.samplebucket.splice(0,1)
	}
	else {
		throw SamplingStrategy + " not implemented in selectSampleImage."
	}

	return sample_image_index
}//FUNCTION selectSampleImage

selectTestImages(correct_label, testbag_labels){
	
	// Input arguments: 
	// 	correct_label: int. It is one element of testbag_labels corresponding to the rewarded group. 
	//	testbag_labels: array of ints, of length equal to the number of images ( == testbag.length). 

	// Globals: TASK.ObjectGridIndex; TASK.TestGridIndex; TASK.NStickyResponse; 

	// Outputs: 
	//	[0]: testIndices: array of ints, of length TASK.TestGridIndex.length. The elements are indexes of testbag_labels. The order corresponds to TestGridIndex. 
	//	[1]: correctSelection: int. It indexes testIndices / TestGridIndex to convey the correct element. 


	var testIndices = []; 
	var correctSelection = NaN;

	// If SR is on, 
	if (TASK.ObjectGridIndex.length == TASK.ImageBagsTest.length){ // Is this a robust SR check?
		// For each object, 
		for (var i = 0; i<TASK.ObjectGridIndex.length; i++){
			
			// Get pool of the object's test images: 
			var object_test_indices = getAllInstancesIndexes(testbag_labels, i)

			// Get one (1) random sample of the object's test images: 
			var test_image_index = object_test_indices[Math.floor((object_test_indices.length)*Math.random())]; 

			// Get grid index where the object should be placed: 
			var object_grid_index = TASK.ObjectGridIndex[i] 

			// Determine which location that grid index corresponds to in testIndices: 
			var order_idx = TASK.TestGridIndex.indexOf(object_grid_index)

			// Place the selected test image in the appropriate location in testIndices. 
			testIndices[order_idx] = test_image_index

			// If this is the correct object, set the current testIndices location as being the correctSelection. 
			if(i == correct_label){
				correctSelection = order_idx; 
			}
		}
	} //IF

	else{ 
		// Otherwise, for match-to-sample (where effectors are shuffled)

		// Get all unique labels 
		var labelspace = []
		for (var i = 0; i < testbag_labels.length; i++){
			if(labelspace.indexOf(testbag_labels[i]) == -1 && 
				testbag_labels[i] != correct_label){
				labelspace.push(testbag_labels[i])
			}
		}

		// Randomly select n-1 labels to serve as distractors 
		var distractors = []
		labelspace = shuffle(labelspace)
		for (var i=0; i <= TASK.TestGridIndex.length-2; i++){
			distractors[i] = labelspace[i]
		}

		// Add distractors and correct label to testpool, and then shuffle. 
		var testpool = []
		testpool.push(... distractors)
		testpool.push(correct_label)
		testpool = shuffle(testpool)	

		// For each label in the testpool, add a random testimage index of it to testIndices. 
		for (var i = 0; i<testpool.length; i++){
			var label = testpool[i]
			object_test_indices = getAllInstancesIndexes(testbag_labels, label); 
			test_image_index = object_test_indices[Math.floor((object_test_indices.length)*Math.random())]; 
			testIndices[i] = test_image_index
			if(label == correct_label){
				correctSelection = i
			}
		}
	} //ELSE

	return [testIndices, correctSelection]
}//FUNCTION selectTestImages

} //class TrialQueue
