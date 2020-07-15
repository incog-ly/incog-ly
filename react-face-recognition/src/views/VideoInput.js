import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Webcam from 'react-webcam';
import { loadModels, getFullFaceDescription, getFaceExpressions, createMatcher } from '../api/face';

// Import face profile
const JSON_PROFILE = require('../descriptors/bnk48.json');

const WIDTH = 420;
const HEIGHT = 420;
const inputSize = 160;

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
      expression: null
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

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  //Facial Expressions
  capture = async () => {
    if (!!this.webcam.current) {
      await getFaceExpressions(
        this.webcam.current.getScreenshot(),
        inputSize
      ).then(resizedResults => {
        if (!!resizedResults) {
          const minConfidence = 0.05
          const exprObj = resizedResults[0] && resizedResults[0].expressions.filter(expr => expr.probability > minConfidence);
          let maxCallback = ( acc, cur ) => {
            acc['expression'] = acc.probability > cur.probability ? acc.expression : cur.expression
            acc['probability'] = Math.max( acc.probability, cur.probability )
            return acc;
          };

          const output = exprObj && exprObj.reduce(maxCallback);
          console.log("VideoInput -> capture -> output", output)

          this.setState({
            expression: output
          })
        }
      });
    }
  };

//Track avatar and movements
  // capture = async () => {
  //   if (!!this.webcam.current) {
  //     await getFullFaceDescription(
  //       this.webcam.current.getScreenshot(),
  //       inputSize
  //     ).then(fullDesc => {
  //       if (!!fullDesc) {
  //         this.setState({
  //           detections: fullDesc.map(fd => fd.detection),
  //           descriptors: fullDesc.map(fd => fd.descriptor)
  //         });
  //       }
  //     });

  //     if (!!this.state.descriptors && !!this.state.faceMatcher) {
  //       let match = await this.state.descriptors.map(descriptor =>
  //         this.state.faceMatcher.findBestMatch(descriptor)
  //       );
  //       this.setState({ match });
  //     }
  //   }
  // };

  render() {
    const { detections, match, facingMode } = this.state;
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
        let _Y = detection.box._y;
        return (
          <div key={i}>
            {/* <div
              style={{
                position: 'absolute',
                border: 'solid',
                borderColor: 'blue',
                height: _H,
                width: _W,
                transform: 
              }}
            > */}
              {!!match && !!match[i] ? (
                <img
                  src="https://avatars1.githubusercontent.com/u/29942790?s=460&u=f6dc49f79d7d53a31cd9b093ef1438d590d1b886&v=4"
                  style={{
                    backgroundColor: 'blue',
                    border: 'solid',
                    borderColor: 'blue',
                    width: '100px',
                    marginTop: 0,
                    color: '#fff',
                    transform:  `translateX(${_X}px)`
                    // `translate(-3px,${_H}px)`
                  }}
                />
              ) : null}
            {/* </div> */}
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
            {!!videoConstraints ? (
              <div style={{ position: 'absolute' }}>
                <Webcam
                  audio={false}
                  width={WIDTH}
                  height={HEIGHT}
                  ref={this.webcam}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
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

export default withRouter(VideoInput);
