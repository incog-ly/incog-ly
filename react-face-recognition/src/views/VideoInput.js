import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Webcam from 'react-webcam';
import { loadModels, getFullFaceDescription, getFaceExpressions, createMatcher } from '../api/face';

import Avatar,{Piece} from 'avataaars';
// Import face profile

const JSON_PROFILE = require('../descriptors/bnk48.json');



const WIDTH = 1000;
const HEIGHT = 1000;
const inputSize = 160;
const randomChoice = array => array[Math.floor(Math.random() * array.length)];
const clothes = randomChoice(['BlazerShirt', 'BlazerSweater', 'CollarSweater', 'Hoodie', 'Overall'])
const top = randomChoice(['NoHair', 'EyePatch','LongHairMiaWallace', 'Hat', 'Hijab', 'Turban', 'WinterHat1', 'LongHairBigHair', 'ShortHairSides', 'ShortHairFrizzle'])
const accessories = randomChoice(['Blank', 'Prescription01', 'Prescription02', 'Round', 'Wayfarers'])
const skinColor = randomChoice(['Light', 'Pale', 'Brown', 'Yellow', 'Tanned', 'DarkBrown', 'Black'])
const mouth = {'neutral': 'Twinkle', 'happy': 'Smile', 'sad':  'Sad', 'angry': 'Grimace', 'fearful': 'ScreamOpen', 'disgusted': 'Vomit', 'surprised': 'Disbelief'}
const eyes = {'neutral': 'Default', 'happy': 'Happy', 'sad':  'Cry', 'angry': 'Squint', 'fearful': 'Dizzy', 'disgusted': 'Squint', 'surprised': 'Surprised'}
const eyeBrows = {'neutral': 'DefaultNatural', 'happy': 'Default', 'sad':  'SadConcernedNatural', 'angry': 'AngryNatural', 'fearful': 'SadConcernedNatural', 'disgusted': 'SadConcernedNatural', 'surprised': 'RaisedExcitedNatural'}

class VideoInput extends Component {
  constructor(props) {
    super(props);
    this.webcam = React.createRef();
    this.state = {
      fullDesc: null,
      detections: null,
      descriptors: null,
      faceMatcher: null,
      match: null,
      facingMode: null,
      expression: null,
      video: true
    };
  }

  componentWillMount = async () => {
    await loadModels();
    this.setState({ faceMatcher: await createMatcher(JSON_PROFILE) });
    this.setInputDevice();
  };

  setInputDevice = () => {
    navigator.mediaDevices.enumerateDevices().then(async devices => {
      let inputDevice = await devices.filter(
        device => device.kind === 'videoinput'
      );
      if (inputDevice.length < 2) {
        await this.setState({
          facingMode: 'user'
        });
      } else {
        await this.setState({
          facingMode: { exact: 'environment' }
        });
      }
      this.startCapture();
    });
  };

  startCapture = () => {
    this.interval = setInterval(() => {
      this.capture();
    }, 1500);
  };
  
  lerp = (value1, value2, amount)=> {
    amount = amount < 0 ? 0 : amount;
    amount = amount > 1 ? 1 : amount;
    return value1 + (value2 - value1) * amount;
  }


  componentWillUnmount() {
    clearInterval(this.interval);
  }

//Track avatar, movements and facial expressions
  capture = async () => {
    if (!!this.webcam.current) {
      await getFullFaceDescription(
        this.webcam.current.getScreenshot(),
        inputSize
      ).then(fullDesc => {
        if (!!fullDesc) {
          const resizedResults = fullDesc[0] && fullDesc[0].expressions;
          const minConfidence = 0.05
          const exprObj = resizedResults && resizedResults.filter(expr => expr.probability > minConfidence);
          let maxCallback = ( acc, cur ) => {
            acc['expression'] = acc.probability > cur.probability ? acc.expression : cur.expression
            acc['probability'] = Math.max( acc.probability, cur.probability )
            return acc;
          };

          const output = exprObj && exprObj.reduce(maxCallback);
          this.setState({
            detections: fullDesc.map(fd => fd.detection),
            descriptors: fullDesc.map(fd => fd.descriptor),
            expression: output ? output.expression : null
          });
        }
      });

      if (!!this.state.descriptors && !!this.state.faceMatcher) {
        let match = await this.state.descriptors.map(descriptor =>
          this.state.faceMatcher.findBestMatch(descriptor)
        );
        this.setState({ match });
      }
    }
  };
  prevX = 0;
  render() {
    const { detections, expression, match, facingMode } = this.state;

    let videoConstraints = null;
    let camera = '';
    if (!!facingMode) {
      videoConstraints = {
        width: WIDTH,
        height: HEIGHT,
        facingMode: facingMode
      };
      if (facingMode === 'user') {
        camera = 'Front';
      } else {
        camera = 'Back';
      }
    }

    let drawBox = null;
    if (!!detections) {
      drawBox = detections.map((detection, i) => {
        let _H = detection.box.height;
        let _W = detection.box.width;
        let _X = detection.box._x;
        this.prevX = _X;
        let _Y = detection.box._y;
        return (
          <div key={i} >
              {!!match && !!match[i] ? (
                      <div style={{width: WIDTH, height: 600, backgroundColor: 'black', position: 'absolute', zIndex: 2}}>
                        {/*TODO: Replacement for the hardcoded translateX center value */}
                        <Avatar
                        style={{width: 300, height: 600, transform:  `translateX(
                          ${350-_X}px)`, marginBottom: 0,}}
                        avatarStyle='Square'
                        topType={top}
                        accessoriesType={accessories}
                        hairColor='BrownDark'
                        facialHairType='Blank'
                        clotheType={clothes}
                        clotheColor='PastelBlue'
                        eyeType={eyes[expression]}
                        eyebrowType={eyeBrows[expression]}
                        mouthType={mouth[expression]}
                        skinColor={skinColor}
                      />
                      </div>
              ) : null
              }
          </div>
              
        );
      });
    }

    return (
      <div
        className="Camera"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <p>Camera: {camera}</p>
        <div
          style={{
            width: WIDTH,
            height: HEIGHT
          }}
        >
          <div style={{ position: 'relative', width: WIDTH }}>
            <div style={{width: WIDTH, height: 600, backgroundColor: 'black', position: 'absolute', zIndex: 2}}></div>
            {!!videoConstraints ? (
              <div style={{ position: 'absolute'}}>
                <Webcam
                  audio={false}
                  width={WIDTH}
                  height={600}
                  ref={this.webcam}
                  mirrored
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  style={{zIndex: -1}}
                />
              </div>
            ) : null}
            {!!drawBox ? drawBox : null}
          </div>
          
        </div>
      </div>
    );
  }
}

export default VideoInput;
