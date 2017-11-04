(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["AudioFeeder"] = factory();
	else
		root["AudioFeeder"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	(function() {

		var BufferQueue = __webpack_require__(1),
			WebAudioBackend = __webpack_require__(2),
			FlashBackend = __webpack_require__(4);


		/**
		 * Audio sample buffer format passed to {@link AudioFeeder#bufferData} and its backends.
		 *
		 * Buffers are arrays containing one Float32Array of sample data
		 * per channel. Channel counts must match the expected value, and
		 * all channels within a buffer must have the same length in samples.
		 *
		 * Since input data may be stored for a while before being taken
		 * back out, be sure that your Float32Arrays for channel data are
		 * standalone, not backed on an ArrayBuffer that might change!
		 *
		 * @typedef {SampleBuffer} SampleBuffer
		 * @todo consider replacing this with AudioBuffer-like wrapper object
		 */

		/**
		 * Object dictionary format used to pass options into {@link AudioFeeder} and its backends.
		 *
		 * @typedef {Object} AudioFeederOptions
		 * @property {string} base - (optional) base URL to find additional resources in,
		 *                           such as the Flash audio output shim
		 * @property {AudioContext} audioContext - (optional) Web Audio API AudioContext
		 *                          instance to use inplace of creating a default one
		 */

		/**
		 * Object dictionary format returned from {@link AudioFeeder#getPlaybackState} and friends.
		 *
		 * @typedef {Object} PlaybackState
		 * @property {number} playbackPosition - total seconds so far of audio data that have played
		 * @property {number} samplesQueued - number of samples at target rate that are queued up for playback
		 * @property {number} dropped - number of underrun events, when we had to play silence due to data starvation
		 * @property {number} delayedTime - total seconds so far of silent time during playback due to data starvation
		 * @todo drop 'dropped' in favor of delayedTime
		 * @todo replace sampledQueued with a time unit?
		 */

		/**
		 * Object that we can throw audio data into and have it drain out.
		 * @class
		 * @param {AudioFeederOptions} options - dictionary of config settings
		 *
		 * @classdesc
		 * Object that we can throw audio data into and have it drain out.
		 */
		function AudioFeeder(options) {
			this._options = options || {};
			this._backend = null; // AudioBackend instance, after init...
		};

		/**
		 * Sample rate in Hz, as requested by the caller in {@link AudioFeeder#init}.
		 *
		 * If the backend's actual sample rate differs from this requested rate,
		 * input data will be resampled automatically.
		 *
		 * @type {number}
		 * @readonly
		 * @see AudioFeeder#targetRate
		 */
		AudioFeeder.prototype.rate = 0;

		/**
		 * Actual output sample rate in Hz, as provided by the backend.
		 * This may differ from the rate requested, in which case input data
		 * will be resampled automatically.
		 *
		 * @type {number}
		 * @readonly
		 * @see AudioFeeder#rate
		 */
		AudioFeeder.prototype.targetRate = 0;

		/**
		 * Number of output channels, as requested by the caller in {@link AudioFeeder#init}.
		 *
		 * If the backend's actual channel count differs from this requested count,
		 * input data will be resampled automatically.
		 *
		 * Warning: currently more than 2 channels may result in additional channels
		 * being cropped out, as downmixing has not yet been implemented.
		 *
		 * @type {number}
		 * @readonly
		 */
		AudioFeeder.prototype.channels = 0;

		/**
		 * Size of output buffers in samples, as a hint for latency/scheduling
		 * @type {number}
		 * @readonly
		 */
		AudioFeeder.prototype.bufferSize = 0;

		/**
		 * Duration of the minimum buffer size, in seconds.
		 * If the amount of buffered data falls below this,
		 * caller will receive a synchronous 'starved' event
		 * with a last chance to buffer more data.
		 *
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty(AudioFeeder.prototype, 'bufferDuration', {
			get: function getBufferDuration() {
				if (this.targetRate) {
					return this.bufferSize / this.targetRate;
				} else {
					return 0;
				}
			}
		});

		/**
		 * Duration of remaining data at which a 'bufferlow' event will be
		 * triggered, in seconds.
		 *
		 * This defaults to twice bufferDuration, but can be overridden.
		 *
		 * @type {number}
		 */
		Object.defineProperty(AudioFeeder.prototype, 'bufferThreshold', {
			get: function getBufferThreshold() {
				if (this._backend) {
					return this._backend.bufferThreshold / this.targetRate;
				} else {
					return 0;
				}
			},
			set: function setBufferThreshold(val) {
				if (this._backend) {
					this._backend.bufferThreshold = Math.round(val * this.targetRate);
				} else {
					throw 'Invalid state: AudioFeeder cannot set bufferThreshold before init';
				}
			}
		});

		/**
		 * Current playback position, in seconds.
		 * This compensates for drops and underruns, and is suitable for a/v sync.
		 *
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty(AudioFeeder.prototype, 'playbackPosition', {
			get: function getPlaybackPosition() {
				if (this._backend) {
					var playbackState = this.getPlaybackState();
					return playbackState.playbackPosition;
				} else {
					return 0;
				}
			}
		});

		/**
		 * Duration of remaining queued data, in seconds.
		 *
		 * @type {number}
		 */
		Object.defineProperty(AudioFeeder.prototype, 'durationBuffered', {
			get: function getDurationBuffered() {
				if (this._backend) {
					var playbackState = this.getPlaybackState();
					return playbackState.samplesQueued / this.targetRate;
				} else {
					return 0;
				}
			}
		});

		/**
		 * Is the feeder currently set to mute output?
		 * When muted, this overrides the volume property.
		 *
		 * @type {boolean}
		 */
		Object.defineProperty(AudioFeeder.prototype, 'muted', {
	 		get: function getMuted() {
				if (this._backend) {
					return this._backend.muted;
				} else {
					throw 'Invalid state: cannot get mute before init';
				}
	 		},
	 		set: function setMuted(val) {
				if (this._backend) {
					this._backend.muted = val;
				} else {
					throw 'Invalid state: cannot set mute before init';
				}
	 		}
	 	});

		/**
		 * @deprecated in favor of muted and volume properties
		 */
		AudioFeeder.prototype.mute = function() {
			this.muted = true;
		};

		/**
		* @deprecated in favor of muted and volume properties
		 */
		AudioFeeder.prototype.unmute = function() {
			this.muted = false;
		};

		/**
		 * Volume multiplier, defaults to 1.0.
		 * @name volume
		 * @type {number}
		 */
		Object.defineProperty(AudioFeeder.prototype, 'volume', {
			get: function getVolume() {
				if (this._backend) {
					return this._backend.volume;
				} else {
					throw 'Invalid state: cannot get volume before init';
				}
			},
			set: function setVolume(val) {
				if (this._backend) {
					this._backend.volume = val;
				} else {
					throw 'Invalid state: cannot set volume before init';
				}
			}
		});

		/**
		 * Start setting up for output with the given channel count and sample rate.
		 * Audio data you provide will be resampled if necessary to whatever the
		 * backend actually supports.
		 *
		 * @param {number} numChannels - requested number of channels (output may differ)
		 * @param {number} sampleRate - requested sample rate in Hz (output may differ)
		 *
		 * @todo merge into constructor?
		 */
		AudioFeeder.prototype.init = function(numChannels, sampleRate) {
			this.channels = numChannels;
			this.rate = sampleRate;

			if (WebAudioBackend.isSupported()) {
				this._backend = new WebAudioBackend(numChannels, sampleRate, this._options);
			} else if (FlashBackend.isSupported()) {
				this._backend = new FlashBackend(numChannels, sampleRate, this._options);
			} else {
				throw 'No supported backend';
			}

			this.targetRate = this._backend.rate;
			this.bufferSize = this._backend.bufferSize;

			// Pass through the starved event
			this._backend.onstarved = (function() {
				if (this.onstarved) {
					this.onstarved();
				}
			}).bind(this);
			this._backend.onbufferlow = (function() {
				if (this.onbufferlow) {
					this.onbufferlow();
				}
			}).bind(this);
		};

		/**
		 * Resample a buffer from the input rate/channel count to the output.
		 *
		 * This is horribly naive and wrong.
		 * Replace me with a better algo!
		 *
		 * @param {SampleBuffer} sampleData - input data in requested sample rate / channel count
		 * @returns {SampleBuffer} output data in backend's sample rate/channel count
		 */
		AudioFeeder.prototype._resample = function(sampleData) {
			var rate = this.rate,
				channels = this.channels,
				targetRate = this._backend.rate,
				targetChannels = this._backend.channels;

			if (rate == targetRate && channels == targetChannels) {
				return sampleData;
			} else {
				var newSamples = [];
				for (var channel = 0; channel < targetChannels; channel++) {
					var inputChannel = channel;
					if (channel >= channels) {
						// Flash forces output to stereo; if input is mono, dupe the first channel
						inputChannel = 0;
					}
					var input = sampleData[inputChannel],
						output = new Float32Array(Math.round(input.length * targetRate / rate));
					for (var i = 0; i < output.length; i++) {
						output[i] = input[(i * rate / targetRate) | 0];
					}
					newSamples.push(output);
				}
				return newSamples;
			}
		};

		/**
		 * Queue up some audio data for playback.
		 *
		 * @param {SampleBuffer} sampleData - input data to queue up for playback
		 *
		 * @todo throw if data invalid or uneven
		 */
		AudioFeeder.prototype.bufferData = function(sampleData) {
			if (this._backend) {
				var samples = this._resample(sampleData);
				this._backend.appendBuffer(samples);
			} else {
				throw 'Invalid state: AudioFeeder cannot bufferData before init';
			}
		};

		/**
		 * Get an object with information about the current playback state.
		 *
		 * @return {PlaybackState} - info about current playback state
		 */
		AudioFeeder.prototype.getPlaybackState = function() {
			if (this._backend) {
				return this._backend.getPlaybackState();
			} else {
				throw 'Invalid state: AudioFeeder cannot getPlaybackState before init';
			}
		};

		/**
		 * Checks if audio system is ready and calls the callback when ready
		 * to begin playback.
		 *
		 * This will wait for the Flash shim to load on IE 10/11; waiting
		 * is not required when using native Web Audio but you should use
		 * this callback to support older browsers.
		 *
		 * @param {function} callback - called when ready
		 */
		AudioFeeder.prototype.waitUntilReady = function(callback) {
			if (this._backend) {
				this._backend.waitUntilReady(callback);
			} else {
				throw 'Invalid state: AudioFeeder cannot waitUntilReady before init';
			}
		};

		/**
		 * Start/continue playback as soon as possible.
		 *
		 * You should buffer some audio ahead of time to avoid immediately
		 * running into starvation.
		 */
		AudioFeeder.prototype.start = function() {
			if (this._backend) {
				this._backend.start();
			} else {
				throw 'Invalid state: AudioFeeder cannot start before init';
			}
		};

		/**
		 * Stop/pause playback as soon as possible.
		 *
		 * Audio that has been buffered but not yet sent to the device will
		 * remain buffered, and can be continued with another call to start().
		 */
		AudioFeeder.prototype.stop = function() {
			if (this._backend) {
				this._backend.stop();
			} else {
				throw 'Invalid state: AudioFeeder cannot stop before init';
			}
		};

		/**
		 * Flush any queued data out of the system.
		 */
		AudioFeeder.prototype.flush = function() {
			if (this._backend) {
				this._backend.flush();
			} else {
				throw 'Invalid state: AudioFeeder cannot flush before init';
			}
		}

		/**
		 * Close out the audio channel. The AudioFeeder instance will no
		 * longer be usable after closing.
		 *
		 * @todo close out the AudioContext if no longer needed
		 * @todo make the instance respond more consistently once closed
		 */
		AudioFeeder.prototype.close = function() {
			if (this._backend) {
				this._backend.close();
				this._backend = null;
			}
		};

		/**
		 * Synchronous callback when we find we're out of buffered data.
		 *
		 * @type {function}
		 */
		AudioFeeder.prototype.onstarved = null;

		/**
		 * Asynchronous callback when we're running low on buffered data.
		 *
		 * @type {function}
		 */
		AudioFeeder.prototype.onbufferlow = null;

		/**
		 * Is the AudioFeeder class supported in this browser?
		 *
		 * Note that it's still possible to be supported but not work, for instance
		 * if there are no audio output devices but the APIs are available.
		 *
		 * @returns {boolean} - true if Web Audio API is available
		 */
		AudioFeeder.isSupported = function() {
			return !!Float32Array && (WebAudioBackend.isSupported() || FlashBackend.isSupported());
		};

		/**
		 * Force initialization of the default Web Audio API context, if applicable.
		 *
		 * Some browsers (such as mobile Safari) disable audio output unless
		 * first triggered from a UI event handler; call this method as a hint
		 * that you will be starting up an AudioFeeder soon but won't have data
		 * for it until a later callback.
		 *
		 * @returns {AudioContext|null} - initialized AudioContext instance, if applicable
		 */
		AudioFeeder.initSharedAudioContext = function() {
			if (WebAudioBackend.isSupported()) {
				return WebAudioBackend.initSharedAudioContext();
			} else {
				return null;
			}
		};

		module.exports = AudioFeeder;

	})();


/***/ },
/* 1 */
/***/ function(module, exports) {

	/**
	 * @file Abstraction around a queue of audio buffers.
	 *
	 * @author Brion Vibber <brion@pobox.com>
	 * @copyright (c) 2013-2016 Brion Vibber
	 * @license MIT
	 */

	/**
	 * Constructor for BufferQueue class.
	 * @class
	 * @param {number} numChannels - channel count to validate against
	 * @param {number} bufferSize - desired size of pre-chunked output buffers, in samples
	 *
	 * @classdesc
	 * Abstraction around a queue of audio buffers.
	 *
	 * Stuff input buffers of any length in via {@link BufferQueue#appendBuffer},
	 * check how much is queued with {@link BufferQueue#sampleCount}, and pull out
	 * data in fixed-size chunks from the start with {@link BufferQueue#shift}.
	 */
	function BufferQueue(numChannels, bufferSize) {
	  if (numChannels < 1 || numChannels !== Math.round(numChannels)) {
	    throw 'Invalid channel count for BufferQueue';
	  }
	  this.channels = numChannels;
	  this.bufferSize = bufferSize;
	  this.flush();
	}

	/**
	 * Flush any data out of the queue, resetting to empty state.
	 */
	BufferQueue.prototype.flush = function() {
	  this._buffers = [];
	  this._pendingBuffer = this.createBuffer(this.bufferSize);
	  this._pendingPos = 0;
	};

	/**
	 * Count how many samples are queued up
	 *
	 * @returns {number} - total count in samples
	 */
	BufferQueue.prototype.sampleCount = function() {
	  var count = 0;
	  this._buffers.forEach(function(buffer) {
	    count += buffer[0].length;
	  });
	  return count;
	};

	/**
	 * Create an empty audio sample buffer with space for the given count of samples.
	 *
	 * @param {number} sampleCount - number of samples to reserve in the buffer
	 * @returns {SampleBuffer} - empty buffer
	 */
	BufferQueue.prototype.createBuffer = function(sampleCount) {
	  var output = [];
	  for (var i = 0; i < this.channels; i++) {
	    output[i] = new Float32Array(sampleCount);
	  }
	  return output;
	};

	/**
	 * Validate a buffer for correct object layout
	 *
	 * @param {SampleBuffer} buffer - an audio buffer to check
	 * @returns {boolean} - true if input buffer is valid
	 */
	BufferQueue.prototype.validate = function(buffer) {
	  if (buffer.length !== this.channels) {
	    return false;
	  }

	  var sampleCount;
	  for (var i = 0; i < buffer.length; i++) {
	    var channelData = buffer[i];
	    if (!(channelData instanceof Float32Array)) {
	      return false;
	    }
	    if (i == 0) {
	      sampleCount = channelData.length;
	    } else if (channelData.length !== sampleCount) {
	      return false;
	    }
	  }

	  return true;
	};

	/**
	 * Append a buffer of input data to the queue...
	 *
	 * @param {SampleBuffer} sampleData - an audio buffer to append
	 * @throws exception on invalid input
	 */
	BufferQueue.prototype.appendBuffer = function(sampleData) {
	  if (!this.validate(sampleData)) {
	    throw "Invalid audio buffer passed to BufferQueue.appendBuffer";
	  }

	  var firstChannel = sampleData[0],
	    sampleCount = firstChannel.length;

	  // @todo this seems hella inefficient
	  for (var i = 0; i < sampleCount; i++) {
	    for (var channel = 0; channel < this.channels; channel++) {
	      this._pendingBuffer[channel][this._pendingPos] = sampleData[channel][i];
	    }
	    if (++this._pendingPos == this.bufferSize) {
	      this._buffers.push(this._pendingBuffer);
	      this._pendingPos = 0;
	      this._pendingBuffer = this.createBuffer(this.bufferSize);
	    }
	  }

	};

	/**
	 * Unshift the given sample buffer onto the beginning of the buffer queue.
	 *
	 * @param {SampleBuffer} sampleData - an audio buffer to prepend
	 * @throws exception on invalid input
	 *
	 * @todo this is currently pretty inefficient as it rechunks all the buffers.
	 */
	BufferQueue.prototype.prependBuffer = function(sampleData) {
	  if (!this.validate(sampleData)) {
	    throw "Invalid audio buffer passed to BufferQueue.prependBuffer";
	  }

	  // Since everything is pre-chunked in the queue, we're going to have
	  // to pull everything out and re-append it.
	  var buffers = this._buffers.slice(0)
	  buffers.push(this.trimBuffer(this._pendingBuffer, 0, this._pendingPos));

	  this.flush();
	  this.appendBuffer(sampleData);

	  // Now put back any old buffers, dividing them up into chunks.
	  for (var i = 0; i < buffers.length; i++) {
	    this.appendBuffer(buffers[i]);
	  }
	};

	/**
	 * Shift out a buffer from the head of the queue, containing a maximum of
	 * {@link BufferQueue#bufferSize} samples; if there are not enough samples
	 * you may get a shorter buffer. Call {@link BufferQueue#sampleCount} to
	 * check if enough samples are available for your needs.
	 *
	 * @returns {SampleBuffer} - an audio buffer with zero or more samples
	 */
	BufferQueue.prototype.nextBuffer = function() {
	  if (this._buffers.length) {
	    return this._buffers.shift();
	  } else {
	    var trimmed = this.trimBuffer(this._pendingBuffer, 0, this._pendingPos);
	    this._pendingBuffer = this.createBuffer(this.bufferSize);
	    this._pendingPos = 0;
	    return trimmed;
	  }
	};

	/**
	 * Trim a buffer down to a given maximum sample count.
	 * Any additional samples will simply be cropped off of the view.
	 * If no trimming is required, the same buffer will be returned.
	 *
	 * @param {SampleBuffer} sampleData - input data
	 * @param {number} start - sample number to start at
	 * @param {number} maxSamples - count of samples to crop to
	 * @returns {SampleBuffer} - output data with at most maxSamples samples
	 */
	BufferQueue.prototype.trimBuffer = function(sampleData, start, maxSamples) {
	  var bufferLength = sampleData[0].length,
	    end = start + Math.min(maxSamples, bufferLength);
	  if (start == 0 && end >= bufferLength) {
	    return sampleData;
	  } else {
	    var output = [];
	    for (var i = 0; i < this.channels; i++) {
	      output[i] = sampleData[i].subarray(start, end);
	    }
	    return output;
	  }
	};

	module.exports = BufferQueue;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @file Web Audio API backend for AudioFeeder
	 * @author Brion Vibber <brion@pobox.com>
	 * @copyright (c) 2013-2016 Brion Vibber
	 * @license MIT
	 */

	(function() {

	  var AudioContext = window.AudioContext || window.webkitAudioContext,
	    BufferQueue = __webpack_require__(1),
	    nextTick = __webpack_require__(3);

	  /**
	   * Constructor for AudioFeeder's Web Audio API backend.
	   * @class
	   * @param {number} numChannels - requested count of output channels
	   * @param {number} sampleRate - requested sample rate for output
	   * @param {Object} options - pass URL path to directory containing 'dynamicaudio.swf' in 'base' parameter
	   *
	   * @classdesc Web Audio API output backend for AudioFeeder.
	   * Maintains an internal {@link BufferQueue} of audio samples to be output on demand.
	   */
	  function WebAudioBackend(numChannels, sampleRate, options) {
	    var context = options.audioContext || WebAudioBackend.initSharedAudioContext();

	    this._context = context;


	    /*
	     * Optional audio node can be provided to connect the feeder to
	     * @type {AudioNode}
	     */
	    this.output = options.output || context.destination

	    /**
	     * Actual sample rate supported for output, in Hz
	     * @type {number}
	     * @readonly
	     */
	    this.rate = context.sampleRate;

	    /**
	     * Actual count of channels supported for output
	     * @type {number}
	     * @readonly
	     */
	    this.channels = Math.min(numChannels, 2); // @fixme remove this limit

	    if (options.bufferSize) {
	        this.bufferSize = (options.bufferSize | 0);
	    }
	    this.bufferThreshold = 2 * this.bufferSize;

	    this._bufferQueue = new BufferQueue(this.channels, this.bufferSize);
	    this._playbackTimeAtBufferTail = context.currentTime;
	    this._queuedTime = 0;
	    this._delayedTime = 0;
	    this._dropped = 0;
	    this._liveBuffer = this._bufferQueue.createBuffer(this.bufferSize);

	    // @todo support new audio worker mode too
	    if (context.createScriptProcessor) {
	      this._node = context.createScriptProcessor(this.bufferSize, 0, this.channels);
	    } else if (context.createJavaScriptNode) {
	      // In older Safari versions
	      this._node = context.createJavaScriptNode(this.bufferSize, 0, this.channels);
	    } else {
	      throw new Error("Bad version of web audio API?");
	    }
	  }

	  /**
	   * Size of output buffers in samples, as a hint for latency/scheduling
	   * @type {number}
	   * @readonly
	   */
	  WebAudioBackend.prototype.bufferSize = 4096;

	  /**
	   * Remaining sample count at which a 'bufferlow' event will be triggered.
	   *
	   * Will be pinged when falling below bufferThreshold or bufferSize,
	   * whichever is larger.
	   *
	   * @type {number}
	   */
	  WebAudioBackend.prototype.bufferThreshold = 8192;

	  /**
	   * Internal volume property backing.
	   * @type {number}
	   * @access private
	   */
	  WebAudioBackend.prototype._volume = 1;

	  /**
		 * Volume multiplier, defaults to 1.0.
		 * @name volume
		 * @type {number}
		 */
		Object.defineProperty(WebAudioBackend.prototype, 'volume', {
			get: function getVolume() {
	      return this._volume;
			},
			set: function setVolume(val) {
	      this._volume = +val;
			}
		});

	  /**
	   * Internal muted property backing.
	   * @type {number}
	   * @access private
	   */
	  WebAudioBackend.prototype._muted = false;

	  /**
		 * Is the backend currently set to mute output?
		 * When muted, this overrides the volume property.
		 *
		 * @type {boolean}
		 */
		Object.defineProperty(WebAudioBackend.prototype, 'muted', {
	 		get: function getMuted() {
	      return this._muted;
	 		},
	 		set: function setMuted(val) {
	      this._muted = !!val;
	 		}
	 	});

	  /**
	   * onaudioprocess event handler for the ScriptProcessorNode
	   * @param {AudioProcessingEvent} event - audio processing event object
	   * @access private
	   */
	  WebAudioBackend.prototype._audioProcess = function(event) {
	    var channel, input, output, i, playbackTime;
	    if (typeof event.playbackTime === 'number') {
	      playbackTime = event.playbackTime;
	    } else {
	      // Safari 6.1 hack
	      playbackTime = this._context.currentTime + (this.bufferSize / this.rate);
	    }

	    var expectedTime = this._playbackTimeAtBufferTail;
	    if (expectedTime < playbackTime) {
	      // we may have lost some time while something ran too slow
	      this._delayedTime += (playbackTime - expectedTime);
	    }

	    if (this._bufferQueue.sampleCount() < this.bufferSize) {
	      // We might be in a throttled background tab; go ping the decoder
	      // and let it know we need more data now!
	      // @todo use standard event firing?
	      if (this.onstarved) {
	        this.onstarved();
	      }
	    }

	    // If we still haven't got enough data, write a buffer of silence
	    // to all channels and record an underrun event.
	    // @todo go ahead and output the data we _do_ have?
	    if (this._bufferQueue.sampleCount() < this.bufferSize) {
	      for (channel = 0; channel < this.channels; channel++) {
	        output = event.outputBuffer.getChannelData(channel);
	        for (i = 0; i < this.bufferSize; i++) {
	          output[i] = 0;
	        }
	      }
	      this._dropped++;
	      return;
	    }

	    var volume = (this.muted ? 0 : this.volume);

	    // Actually get that data and write it out...
	    var inputBuffer = this._bufferQueue.nextBuffer();
	    if (inputBuffer[0].length < this.bufferSize) {
	      // This should not happen, but trust no invariants!
	      throw 'Audio buffer not expected length.';
	    }
	    for (channel = 0; channel < this.channels; channel++) {
	      input = inputBuffer[channel];

	      // Save this buffer data for later in case we pause
	      this._liveBuffer[channel].set(inputBuffer[channel]);

	      // And play it out with volume applied...
	      output = event.outputBuffer.getChannelData(channel);
	      for (i = 0; i < input.length; i++) {
	        output[i] = input[i] * volume;
	      }
	    }
	    this._queuedTime += (this.bufferSize / this.rate);
	    this._playbackTimeAtBufferTail = playbackTime + (this.bufferSize / this.rate);

	    if (this._bufferQueue.sampleCount() < Math.max(this.bufferSize, this.bufferThreshold)) {
	      // Let the decoder know ahead of time we're running low on data.
	      // @todo use standard event firing?
	      if (this.onbufferlow) {
	        nextTick(this.onbufferlow.bind(this));
	      }
	    }
	  };


	  /**
	   * Return a count of samples that have been queued or output but not yet played.
	   *
	   * @returns {number} - sample count
	   * @access private
	   */
	  WebAudioBackend.prototype._samplesQueued = function() {
	    var bufferedSamples = this._bufferQueue.sampleCount();
	    var remainingSamples = Math.floor(this._timeAwaitingPlayback() * this.rate);

	    return bufferedSamples + remainingSamples;
	  };

	  /**
	   * Return time duration between the present and the endpoint of audio
	   * we have already sent out from our queue to Web Audio.
	   *
	   * @returns {number} - seconds
	   */
	  WebAudioBackend.prototype._timeAwaitingPlayback = function() {
	    return Math.max(0, this._playbackTimeAtBufferTail - this._context.currentTime);
	  };

	  /**
	   * Get info about current playback state.
	   *
	   * @return {PlaybackState} - info about current playback state
	   */
	  WebAudioBackend.prototype.getPlaybackState = function() {
	    return {
	      playbackPosition: this._queuedTime - this._timeAwaitingPlayback(),
	      samplesQueued: this._samplesQueued(),
	      dropped: this._dropped,
	      delayed: this._delayedTime
	    };
	  };

	  /**
	   * Wait asynchronously until the backend is ready before continuing.
	   *
	   * This will always call immediately for the Web Audio API backend,
	   * as there is no async setup process.
	   *
	   * @param {function} callback - to be called when ready
	   */
	  WebAudioBackend.prototype.waitUntilReady = function(callback) {
	    callback();
	  };

	  /**
	   * Append a buffer of audio data to the output queue for playback.
	   *
	   * Audio data must be at the expected sample rate; resampling is done
	   * upstream in {@link AudioFeeder}.
	   *
	   * @param {SampleBuffer} sampleData - audio data at target sample rate
	   */
	  WebAudioBackend.prototype.appendBuffer = function(sampleData) {
	    this._bufferQueue.appendBuffer(sampleData);
	  };

	  /**
	   * Start playback.
	   *
	   * Audio should have already been queued at this point,
	   * or starvation may occur immediately.
	   */
	  WebAudioBackend.prototype.start = function() {
	    this._node.onaudioprocess = this._audioProcess.bind(this);
	    this._node.connect(this.output);
	    this._playbackTimeAtBufferTail = this._context.currentTime;
	  };

	  /**
	   * Stop playback, but don't release resources or clear the buffers.
	   * We'll probably come back soon.
	   */
	  WebAudioBackend.prototype.stop = function() {
	    if (this._node) {
	      var timeRemaining = this._timeAwaitingPlayback();
	      if (timeRemaining > 0) {
	        // We have some leftover samples that got queued but didn't get played.
	        // Unshift them back onto the beginning of the buffer.
	        // @todo make this not a horrible hack
	        var samplesRemaining = Math.round(timeRemaining * this.rate),
	            samplesAvailable = this._liveBuffer ? this._liveBuffer[0].length : 0;
	        if (samplesRemaining > samplesAvailable) {
	          //console.log('liveBuffer size ' + samplesRemaining + ' vs ' + samplesAvailable);
	          this._bufferQueue.prependBuffer(this._liveBuffer);
	          this._bufferQueue.prependBuffer(
	            this._bufferQueue.createBuffer(samplesRemaining - samplesAvailable));
	        } else {
	          this._bufferQueue.prependBuffer(
	            this._bufferQueue.trimBuffer(this._liveBuffer, samplesAvailable - samplesRemaining, samplesRemaining));
	        }
	        this._playbackTimeAtBufferTail -= timeRemaining;
	      }
	      this._node.onaudioprocess = null;
	      this._node.disconnect();
	    }
	  };

	  /**
	   * Flush any queued data out of the system.
	   */
	  WebAudioBackend.prototype.flush = function() {
	    this._bufferQueue.flush();
	  };

	  /**
	   * Close out the playback system and release resources.
	   *
	   * @todo consider releasing the AudioContext when possible
	   */
	  WebAudioBackend.prototype.close = function() {
	    this.stop();

	    this._context = null;
	  };

	  /**
	   * Synchronous callback for when we run out of input data
	   *
	   * @type function|null
	   */
	  WebAudioBackend.prototype.onstarved = null;

	  /**
	   * Asynchronous callback for when the buffer runs low and
	   * should be refilled soon.
	   *
	   * @type function|null
	   */
	  WebAudioBackend.prototype.onbufferlow = null;

	  /**
	   * Check if Web Audio API appears to be supported.
	   *
	   * Note this is somewhat optimistic; will return true even if there are no
	   * audio devices available, as long as the API is present.
	   *
	   * @returns {boolean} - true if this browser appears to support Web Audio API
	   */
	  WebAudioBackend.isSupported = function() {
	    return !!AudioContext;
	  };

	  /**
	   * Holder of audio context to be used/reused by WebAudioBackend.
	   * @see {WebAudioBackend#initSharedAudioContext}
	   *
	   * @type {AudioContext}
	   */
	  WebAudioBackend.sharedAudioContext = null;

	  /**
		 * Force initialization of the default Web Audio API context.
		 *
		 * Some browsers (such as mobile Safari) disable audio output unless
		 * first triggered from a UI event handler; call this method as a hint
		 * that you will be starting up an AudioFeeder soon but won't have data
		 * for it until a later callback.
	   *
	   * @returns {AudioContext|null} - initialized AudioContext instance, if applicable
		 */
	  WebAudioBackend.initSharedAudioContext = function() {
			if (!WebAudioBackend.sharedAudioContext) {
				if (WebAudioBackend.isSupported()) {
					// We're only allowed 4 contexts on many browsers
					// and there's no way to discard them (!)...
					var context = new AudioContext(),
						node;
					if (context.createScriptProcessor) {
						node = context.createScriptProcessor(1024, 0, 2);
					} else if (context.createJavaScriptNode) {
						node = context.createJavaScriptNode(1024, 0, 2);
					} else {
						throw new Error( "Bad version of web audio API?" );
					}

					// Don't actually run any audio, just start & stop the node
					node.connect(context.destination);
					node.disconnect();

	        // So far so good. Keep it around!
	        WebAudioBackend.sharedAudioContext = context;
				}
			}
	    return WebAudioBackend.sharedAudioContext;
		};

	  module.exports = WebAudioBackend;

	})();


/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = (function() {
		// Don't try to check for setImmediate directly; webpack implements
		// it using setTimeout which will be throttled in background tabs.
		// Checking directly on the global window object skips this interference.
		if (typeof window.setImmediate !== 'undefined') {
			return window.setImmediate;
		}

		// window.postMessage goes straight to the event loop, no throttling.
		if (window && window.postMessage) {
			var nextTickQueue = [];
			window.addEventListener('message', function(event) {
				if (event.source === window) {
					var data = event.data;
					if (typeof data === 'object' && data.nextTickBrowserPingMessage) {
						var callback = nextTickQueue.pop();
						if (callback) {
							callback();
						}
					}
				}
			});
			return function(callback) {
				nextTickQueue.push(callback);
				window.postMessage({
					nextTickBrowserPingMessage: true
				}, document.location.toString())
			};
		}

		// Timeout fallback may be poor in background tabs
		return function(callback) {
			setTimeout(callback, 0);
		}
	})();


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	(function() {

	  /* global ActiveXObject */
	  var dynamicaudio_swf = __webpack_require__(5);

	  var nextTick = __webpack_require__(3);

	  /**
	   * Constructor for AudioFeeder's Flash audio backend.
	   * @class
	   * @param {number} numChannels - requested count of output channels (actual will be fixed at 2)
	   * @param {number} sampleRate - requested sample rate for output (actual will be fixed at 44.1 kHz)
	   * @param {Object} options - pass URL path to directory containing 'dynamicaudio.swf' in 'base' parameter
	   *
	   * @classdesc Flash audio output backend for AudioFeeder.
	   * Maintains a local queue of data to be sent down to the Flash shim.
	   * Resampling to stereo 44.1 kHz is done upstream in AudioFeeder.
	   */
	  var FlashBackend = function(numChannels, sampleRate, options) {
	    options = options || {};
	    var flashOptions = {};
	    if (typeof options.base === 'string') {
	      // @fixme replace the version string with an auto-updateable one
	      flashOptions.swf = options.base + '/' + dynamicaudio_swf;
	    }
	    if (options.bufferSize) {
	      this.bufferSize = (options.bufferSize | 0);
	    }

	    this._flashaudio = new DynamicAudio(flashOptions);
	    this._flashBuffer = '';
	    this._flushTimeout = null;
	    this._flushInterval = 40; // flush added buffers no more often than every X ms
	    this._cachedFlashState = null;
	    this._cachedFlashTime = 0;
	    this._cachedFlashInterval = 40; // resync state no more often than every X ms

	    this._waitUntilReadyQueue = [];
	    this.onready = function() {
	        this._flashaudio.flashElement.setBufferSize(this.bufferSize);
	        this._flashaudio.flashElement.setBufferThreshold(this.bufferThreshold);
	        while (this._waitUntilReadyQueue.length) {
	            var callback = this._waitUntilReadyQueue.shift();
	            callback.apply(this);
	        }
	    };
	    this.onlog = function(msg) {
	        console.log('AudioFeeder FlashBackend: ' + msg);
	    }

	    this.bufferThreshold = this.bufferSize * 2;

	    var events = {
	        'ready': 'sync',
	        'log': 'sync',
	        'starved': 'sync',
	        'bufferlow': 'async'
	    };
	    this._callbackName = 'AudioFeederFlashBackendCallback' + this._flashaudio.id;
	    var self = this;
	    window[this._callbackName] = (function(eventName) {
	        var method = events[eventName],
	            callback = this['on' + eventName];
	        if (method && callback) {
	            if (method === 'async') {
	                nextTick(callback.bind(this));
	            } else {
	                callback.apply(this, Array.prototype.slice.call(arguments, 1));
	                this._flushFlashBuffer();
	            }
	        }
	    }).bind(this);
	  };

	  /**
	   * Actual sample rate supported for output, in Hz
	   * Fixed to 44.1 kHz for Flash backend.
	   * @type {number}
	   * @readonly
	   */
	  FlashBackend.prototype.rate = 44100;

	  /**
	   * Actual count of channels supported for output
	   * Fixed to stereo for Flash backend.
	   * @type {number}
	   * @readonly
	   */
	  FlashBackend.prototype.channels = 2;

	  /**
	   * Buffer size hint.
	   * @type {number}
	   * @readonly
	   */
	  FlashBackend.prototype.bufferSize = 4096;

	  /**
	   * Internal bufferThreshold property backing.
	   * @type {number}
	   * @access private
	   */
	  FlashBackend.prototype._bufferThreshold = 8192;

	  /**
	   * Remaining sample count at which a 'bufferlow' event will be triggered.
	   *
	   * Will be pinged when falling below bufferThreshold or bufferSize,
	   * whichever is larger.
	   *
	   * @type {number}
	   */
	  Object.defineProperty(FlashBackend.prototype, 'bufferThreshold', {
	    get: function getBufferThreshold() {
	      return this._bufferThreshold;
	    },
	    set: function setBufferThreshold(val) {
	      this._bufferThreshold = val | 0;
	      this.waitUntilReady((function() {
	        this._flashaudio.flashElement.setBufferThreshold(this._bufferThreshold);
	      }).bind(this));
	    }
	  });

	  /**
	   * Internal volume property backing.
	   * @type {number}
	   * @access private
	   */
	  FlashBackend.prototype._volume = 1;

	  /**
		 * Volume multiplier, defaults to 1.0.
		 * @name volume
		 * @type {number}
		 */
		Object.defineProperty(FlashBackend.prototype, 'volume', {
			get: function getVolume() {
	      return this._volume;
			},
			set: function setVolume(val) {
	      this._volume = +val;
	      this.waitUntilReady(this._flashVolumeUpdate.bind(this));
			}
		});

	  /**
	   * Internal muted property backing.
	   * @type {number}
	   * @access private
	   */
	  FlashBackend.prototype._muted = false;

	  /**
		 * Is the backend currently set to mute output?
		 * When muted, this overrides the volume property.
		 *
		 * @type {boolean}
		 */
		Object.defineProperty(FlashBackend.prototype, 'muted', {
	 		get: function getMuted() {
	      return this._muted;
	 		},
	 		set: function setMuted(val) {
	      this._muted = !!val;
	      this.waitUntilReady(this._flashVolumeUpdate.bind(this));
	 		}
	 	});

	  /**
	   * Are we paused/idle?
	   * @type {boolean}
	   * @access private
	   */
	  FlashBackend.prototype._paused = true;

	  /**
	   * Pass the currently configured muted+volume state down to the Flash plugin
	   * @access private
	   */
	  FlashBackend.prototype._flashVolumeUpdate = function() {
	    if (this._flashaudio && this._flashaudio.flashElement && this._flashaudio.flashElement.setVolume) {
	      this._flashaudio.flashElement.setVolume(this.muted ? 0 : this.volume);
	    }
	  }

	  /**
	   * Scaling and reordering of output for the Flash fallback.
	   * Input data must be pre-resampled to the correct sample rate.
	   *
	   * @param {SampleBuffer} samples - input data as separate channels of 32-bit float
	   * @returns {Int16Array} - interleaved stereo 16-bit signed integer output
	   * @access private
	   *
	   * @todo handle input with higher channel counts better
	   * @todo try sending floats to flash without losing precision?
	   */
	  FlashBackend.prototype._resampleFlash = function(samples) {
	    var sampleincr = 1;
	  	var samplecount = samples[0].length;
	  	var newSamples = new Int16Array(samplecount * 2);
	  	var chanLeft = samples[0];
	  	var chanRight = this.channels > 1 ? samples[1] : chanLeft;
	    var volume = this.muted ? 0 : this.volume;
	  	var multiplier = volume * 16384; // smaller than 32768 to allow some headroom from those floats
	  	for(var s = 0; s < samplecount; s++) {
	  		var idx = (s * sampleincr) | 0;
	  		var idx_out = s * 2;
	  		// Use a smaller
	  		newSamples[idx_out] = chanLeft[idx] * multiplier;
	  		newSamples[idx_out + 1] = chanRight[idx] * multiplier;
	  	}
	  	return newSamples;
	  };

	  var hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7',
	           '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
	  var hexBytes = [];
	  for (var i = 0; i < 256; i++) {
	    hexBytes[i] = hexDigits[(i & 0x0f)] +
	            hexDigits[(i & 0xf0) >> 4];
	  }
	  function hexString(buffer) {
	    var samples = new Uint8Array(buffer);
	    var digits = "",
	      len = samples.length;
	    for (var i = 0; i < len; i++) {
	      // Note that in IE 11 string concatenation is twice as fast as
	      // the traditional make-an-array-and-join here.
	      digits += hexBytes[samples[i]];
	    }
	    return digits;
	  }

	  /**
	   * Send any pending data off to the Flash plugin.
	   *
	   * @access private
	   */
	  FlashBackend.prototype._flushFlashBuffer = function() {
	    var chunk = this._flashBuffer,
	      flashElement = this._flashaudio.flashElement;

	    if (this._cachedFlashState) {
	        this._cachedFlashState.samplesQueued += chunk.length / 8;
	    }
	    this._flashBuffer = '';
	    this._flushTimeout = null;

	    if (chunk.length > 0) {
	      this.waitUntilReady(function() {
	        flashElement.write(chunk);
	      });
	    }
	  };

	  /**
	   * Append a buffer of audio data to the output queue for playback.
	   *
	   * Audio data must be at the expected sample rate; resampling is done
	   * upstream in {@link AudioFeeder}.
	   *
	   * @param {SampleBuffer} sampleData - audio data at target sample rate
	   */
	  FlashBackend.prototype.appendBuffer = function(sampleData) {
	    var resamples = this._resampleFlash(sampleData);
	    if (resamples.length > 0) {
	      var str = hexString(resamples.buffer);
	      this._flashBuffer += str;
	      if (!this._flushTimeout) {
	        // consolidate multiple consecutive tiny buffers in one pass;
	        // pushing data to Flash is relatively expensive on slow machines
	        this._flushTimeout = setTimeout(this._flushFlashBuffer.bind(this), this._flushInterval);
	      }
	    }
	  };

	  /**
	   * Get info about current playback state.
	   *
	   * @return {PlaybackState} - info about current playback state
	   */
	  FlashBackend.prototype.getPlaybackState = function() {
	    if (this._flashaudio && this._flashaudio.flashElement && this._flashaudio.flashElement.write) {
	      var now = Date.now(),
	        delta = this._paused ? 0 : (now - this._cachedFlashTime),
	        state;
	      if (this._cachedFlashState && delta < this._cachedFlashInterval) {
	        var cachedFlashState = this._cachedFlashState;
	        state = {
	          playbackPosition: cachedFlashState.playbackPosition + delta / 1000,
	          samplesQueued: cachedFlashState.samplesQueued -
	            Math.max(0, Math.round(delta * this.rate / 1000)),
	          dropped: cachedFlashState.dropped,
	          delayed: cachedFlashState.delayed
	        };
	      } else {
	        state = this._flashaudio.flashElement.getPlaybackState();
	        this._cachedFlashState = state;
	        this._cachedFlashTime = now;
	      }
	      state.samplesQueued += this._flashBuffer.length / 8;
	      return state;
	    } else {
	      //console.log('getPlaybackState USED TOO EARLY');
	      return {
	        playbackPosition: 0,
	        samplesQueued: 0,
	        dropped: 0,
	        delayed: 0
	      };
	    }
	  };

	  /**
	   * Wait until the backend is ready to start, then call the callback.
	   *
	   * @param {function} callback - called on completion
	   * @todo handle fail case better?
	   */
	  FlashBackend.prototype.waitUntilReady = function(callback) {
	    if (this._flashaudio && this._flashaudio.flashElement.write) {
	      callback.apply(this);
	    } else {
	      this._waitUntilReadyQueue.push(callback);
	    }
	  };

	  /**
	   * Start playback.
	   *
	   * Audio should have already been queued at this point,
	   * or starvation may occur immediately.
	   */
	  FlashBackend.prototype.start = function() {
	    this._flashaudio.flashElement.start();
	    this._paused = false;
	    this._cachedFlashState = null;
	  };

	  /**
	   * Stop playback, but don't release resources or clear the buffers.
	   * We'll probably come back soon.
	   */
	  FlashBackend.prototype.stop = function() {
	    this._flashaudio.flashElement.stop();
	    this._paused = true;
	    this._cachedFlashState = null;
	  };

	  /**
	   * Flush any queued data out of the system.
	   */
	  FlashBackend.prototype.flush = function() {
	    this._flashaudio.flashElement.flush();
	    this._cachedFlashState = null;
	  };

	  /**
	   * Close out the playback system and release resources.
	   */
	  FlashBackend.prototype.close = function() {
	    this.stop();

	    var wrapper = this._flashaudio.flashWrapper;
	    wrapper.parentNode.removeChild(wrapper);
	    this._flashaudio = null;
	    delete window[this._callbackName];
	  };

	  /**
	   * Synchronous callback for when we run out of input data
	   *
	   * @type function|null
	   */
	  FlashBackend.prototype.onstarved = null;

	  /**
	   * Asynchronous callback for when the buffer runs low and
	   * should be refilled soon.
	   *
	   * @type function|null
	   */
	  FlashBackend.prototype.onbufferlow = null;

	  /**
	   * Check if the browser appears to support Flash.
	   *
	   * Note this is somewhat optimistic, in that Flash may be supported
	   * but the dynamicaudio.swf file might not load, or it might load
	   * but there might be no audio devices, etc.
	   *
	   * Currently only checks for the ActiveX Flash plugin for Internet Explorer,
	   * as other target browsers support Web Audio API.
	   *
	   * @returns {boolean} - true if this browser appears to support Flash
	   */
	  FlashBackend.isSupported = function() {
			if (navigator.userAgent.indexOf('Trident') !== -1) {
				// We only do the ActiveX test because we only need Flash in
				// Internet Explorer 10/11. Other browsers use Web Audio directly
				// (Edge, Safari) or native playback, so there's no need to test
				// other ways of loading Flash.
				try {
					var obj = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
					return true;
				} catch(e) {
					return false;
				}
			}
			return false;
	  };

		/** Flash fallback **/

		/*
		The Flash fallback is based on https://github.com/an146/dynamicaudio.js

		This is the contents of the LICENSE file:

		Copyright (c) 2010, Ben Firshman
		All rights reserved.

		Redistribution and use in source and binary forms, with or without
		modification, are permitted provided that the following conditions are met:

		 * Redistributions of source code must retain the above copyright notice, this
		   list of conditions and the following disclaimer.
		 * Redistributions in binary form must reproduce the above copyright notice,
		   this list of conditions and the following disclaimer in the documentation
		   and/or other materials provided with the distribution.
		 * The names of its contributors may not be used to endorse or promote products
		   derived from this software without specific prior written permission.

		THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
		ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
		WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
		DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
		ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
		(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
		LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
		ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
		(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
		SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
		*/


	  /**
	   * Wrapper class for instantiating Flash plugin.
	   *
	   * @constructor
	   * @param {Object} args - pass 'swf' to override default dynamicaudio.swf URL
	   * @access private
	   */
		function DynamicAudio(args) {
			if (this instanceof arguments.callee) {
				if (typeof this.init === "function") {
					this.init.apply(this, (args && args.callee) ? args : arguments);
				}
			} else {
				return new arguments.callee(arguments);
			}
		}


		DynamicAudio.nextId = 1;

		DynamicAudio.prototype = {
			nextId: null,
			swf: dynamicaudio_swf,

			flashWrapper: null,
			flashElement: null,

			init: function(opts) {
				var self = this;
				self.id = DynamicAudio.nextId++;

				if (opts && typeof opts.swf !== 'undefined') {
					self.swf = opts.swf;
				}


				self.flashWrapper = document.createElement('div');
				self.flashWrapper.id = 'dynamicaudio-flashwrapper-'+self.id;
				// Credit to SoundManager2 for this:
				var s = self.flashWrapper.style;
				s.position = 'fixed';
				s.width = '11px'; // must be at least 6px for flash to run fast
				s.height = '11px';
				s.bottom = s.left = '0px';
				s.overflow = 'hidden';
				self.flashElement = document.createElement('div');
				self.flashElement.id = 'dynamicaudio-flashelement-'+self.id;
				self.flashWrapper.appendChild(self.flashElement);

				document.body.appendChild(self.flashWrapper);

				var id = self.flashElement.id;
	            var params = '<param name="FlashVars" value="objectId=' + self.id + '">';

				self.flashWrapper.innerHTML = "<object id='"+id+"' width='10' height='10' type='application/x-shockwave-flash' data='"+self.swf+"' style='visibility: visible;'><param name='allowscriptaccess' value='always'>" + params + "</object>";
				self.flashElement = document.getElementById(id);
			},
		};

	  module.exports = FlashBackend;

	})();


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "dynamicaudio.swf?version=0f98a83acdc72cf30968c16a018e1cf1";

/***/ }
/******/ ])
});
;