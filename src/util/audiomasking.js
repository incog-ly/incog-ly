var delayTime = 0.100;
var fadeTime = 0.050;
var bufferTime = 0.100;

function createFadeBuffer(context, activeTime, fadeTime) {
  var length1 = activeTime * context.sampleRate;
  var length2 = (activeTime - 2*fadeTime) * context.sampleRate;
  var length = length1 + length2;
  var buffer = context.createBuffer(1, length, context.sampleRate);
  var p = buffer.getChannelData(0);
  
  console.log("createFadeBuffer() length = " + length);
  
  var fadeLength = fadeTime * context.sampleRate;

  var fadeIndex1 = fadeLength;
  var fadeIndex2 = length1 - fadeLength;
  
  // 1st part of cycle
  for (var i = 0; i < length1; ++i) {
      var value;
      
      if (i < fadeIndex1) {
          value = Math.sqrt(i / fadeLength);
      } else if (i >= fadeIndex2) {
          value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
      } else {
          value = 1;
      }
      
      p[i] = value;
  }

  // 2nd part
  for (var i = length1; i < length; ++i) {
      p[i] = 0;
  }
  
  
  return buffer;
}

function createDelayTimeBuffer(context, activeTime, fadeTime, shiftUp) {
  var length1 = activeTime * context.sampleRate;
  var length2 = (activeTime - 2*fadeTime) * context.sampleRate;
  var length = length1 + length2;
  var buffer = context.createBuffer(1, length, context.sampleRate);
  var p = buffer.getChannelData(0);

  console.log("createDelayTimeBuffer() length = " + length);
  
  // 1st part of cycle
  for (var i = 0; i < length1; ++i) {
      if (shiftUp)
        // This line does shift-up transpose
        p[i] = (length1-i)/length;
      else
        // This line does shift-down transpose
        p[i] = i / length1;
  }

  // 2nd part
  for (var i = length1; i < length; ++i) {
      p[i] = 0;
  }

  return buffer;
}

function Jungle(context) {
  this.context = context;
  // Create nodes for the input and output of this "module".
  var input = context.createGain();
  var output = context.createGain();
  this.input = input;
  this.output = output;
  
  // Delay modulation.
  //var mod1 = context.createBufferSource();
  //var mod2 = context.createBufferSource();
  var mod3 = context.createBufferSource();
  var mod4 = context.createBufferSource();

  //this.shiftDownBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, false);
  this.shiftUpBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, true);

  //mod1.buffer = this.shiftDownBuffer;
  //mod2.buffer = this.shiftDownBuffer;
  mod3.buffer = this.shiftUpBuffer;
  mod4.buffer = this.shiftUpBuffer;
  //mod1.loop = true;
  //mod2.loop = true;
  mod3.loop = true;
  mod4.loop = true;

    // for switching between oct-up and oct-down
    var mod1Gain = context.createGain();
    var mod2Gain = context.createGain();
    var mod3Gain = context.createGain();
    mod3Gain.gain.value = 0;
    var mod4Gain = context.createGain();
    mod4Gain.gain.value = 0;

    //mod1.connect(mod1Gain);
    //mod2.connect(mod2Gain);
    mod3.connect(mod3Gain);
    mod4.connect(mod4Gain);

    // Delay amount for changing pitch.
    var modGain1 = context.createGain();
    var modGain2 = context.createGain();

    var delay1 = context.createDelay();
    var delay2 = context.createDelay();
    mod1Gain.connect(modGain1);
    mod2Gain.connect(modGain2);
    mod3Gain.connect(modGain1);
    mod4Gain.connect(modGain2);
    modGain1.connect(delay1.delayTime);
    modGain2.connect(delay2.delayTime);

    // Crossfading.
    var fade1 = context.createBufferSource();
    var fade2 = context.createBufferSource();
    var fadeBuffer = createFadeBuffer(context, bufferTime, fadeTime);
    fade1.buffer = fadeBuffer
    fade2.buffer = fadeBuffer;
    fade1.loop = true;
    fade2.loop = true;

    var mix1 = context.createGain();
    var mix2 = context.createGain();
    mix1.gain.value = 0;
    mix2.gain.value = 0;

    fade1.connect(mix1.gain);    
    fade2.connect(mix2.gain);
        
    // Connect processing graph.
    input.connect(delay1);
    input.connect(delay2);    
    delay1.connect(mix1);
    delay2.connect(mix2);
    mix1.connect(output);
    mix2.connect(output);

    // Start
    var t = context.currentTime + 0.050;
    var t2 = t + bufferTime - fadeTime;
    //mod1.start(t);
    //mod2.start(t2);
    mod3.start(t);
    mod4.start(t2);
    fade1.start(t);
    fade2.start(t2);

    //this.mod1 = mod1;
    //this.mod2 = mod2;
    this.mod1Gain = mod1Gain;
    this.mod2Gain = mod2Gain;
    this.mod3Gain = mod3Gain;
    this.mod4Gain = mod4Gain;
    this.modGain1 = modGain1;
    this.modGain2 = modGain2;
    this.fade1 = fade1;
    this.fade2 = fade2;
    this.mix1 = mix1;
    this.mix2 = mix2;
    this.delay1 = delay1;
    this.delay2 = delay2;
    
    this.setDelay(delayTime);
}

Jungle.prototype.setDelay = function(delayTime) {
  this.modGain1.gain.setTargetAtTime(0.5*delayTime, 0, 0.010);
  this.modGain2.gain.setTargetAtTime(0.5*delayTime, 0, 0.010);
}

var previousPitch = -1;

Jungle.prototype.setPitchOffset = function(mult) {
      //if (mult>0) { // pitch up
          this.mod1Gain.gain.value = 0;
          this.mod2Gain.gain.value = 0;
          this.mod3Gain.gain.value = 1;
          this.mod4Gain.gain.value = 1;
      // } else { // pitch down
      //     this.mod1Gain.gain.value = 1;
      //     this.mod2Gain.gain.value = 1;
      //     this.mod3Gain.gain.value = 0;
      //     this.mod4Gain.gain.value = 0;
      // }
      this.setDelay(delayTime*Math.abs(mult));
  previousPitch = mult;
}