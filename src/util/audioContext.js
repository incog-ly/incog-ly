import Jungle from './audioMasking';

let audioCtx = null;
let _audioCtx = null;
let _jungle = null;
let _outputNode = null;

// let videoConnected = false;
// let _previousPlaybackRate = 1;
let _previousPitch = 0;

let transpose = false;

function getAudioContext() {
  if (!_audioCtx) {
    _audioCtx = new AudioContext();
  }

  return _audioCtx;
}

function getJungle() {
  if (!_jungle) {
    _jungle = new Jungle(getAudioContext());
  }
  return _jungle;
}

function getOutputNode(video) {
  if (!_outputNode) {
    audioCtx = getAudioContext();
    _outputNode = audioCtx.createMediaElementSource(video);
  }
  return _outputNode;
}

function connectStream(stream) {
  console.log("enter the connect streammmmmmmmmmmmmmmmmmmmmmmm")
  audioCtx = getAudioContext();
  // if (_outputNode !== undefined && _outputNode !== null) {
  //   _outputNode.disconnect(audioCtx.destination);
  // }
  console.log("streammmmmmmmmmmmmmmmmm", stream);
  var outputNode = getOutputNode(stream);
  var jungle = getJungle();

  outputNode.connect(jungle.input);
  console.log("kkkkkkkkkkkkkkkkkkkkkkk", outputNode);
  jungle.output.connect(audioCtx.destination);

  jungle.setPitchOffset(_previousPitch, transpose);
}

export default connectStream;