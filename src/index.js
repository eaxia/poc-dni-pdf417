import './js/BigInteger';
import './js/zxing-pdf417';
import './styles/main.scss';

// Crossbrowser getUserMedia
navigator.getUserMedia  = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;

// Variables
let _canvasWidth = 0, _canvasHeight = 0;
let skipFrame = 25;
let source, binarizer, bitmap, result;

// Crear canvas para el video
const canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');

// Párrafo de resultado
let resultP = document.createElement('p');
document.body.appendChild(resultP)

// Crear elemento video e imagen
const video = document.createElement('video');
      video.setAttribute('autoplay',true);
      document.body.appendChild(video);
const image = document.createElement('img')

const startWebcam = () => { 
  //----------------------------------------------------------------------
  //  Here we list all media devices, in order to choose between
  //  the front and the back camera.
  //      videoDevices[0] : Front Camera
  //      videoDevices[1] : Back Camera
  //----------------------------------------------------------------------
  navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    let videoDevices = [0,0];
    let videoDeviceIndex = 0;
    devices.forEach(function(device) {
      // console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
      if (device.kind == "videoinput") {  
        videoDevices[videoDeviceIndex++] =  device.deviceId;    
      }
    });

    let _videoDevice = videoDevices[1] ? videoDevices[1] : videoDevices[0];
    let constraints =  {
      width: { min: 320, ideal: 640, max: 1024 },
      height: { min: 240, ideal: 480, max: 768 },
      deviceId: { exact: _videoDevice  } 
    };
    
    return navigator.mediaDevices.getUserMedia({ video: constraints });
  })
  .then(stream => {
    if (video.mozSrcObject !== undefined) {
      video.mozSrcObject = stream;
    } else if (video.srcObject !== undefined) {
      video.srcObject = stream;
    } else {
      video.src = stream;
    }})
  .catch(e => console.error(e));
}

let loopFrame;

const loop = () => {
  // Loop principal
  loopFrame = requestAnimationFrame(loop);
  ctx.globalAlpha = 1;
  image.src = canvas.toDataURL();
  ctx.drawImage(video, 0, 0, _canvasWidth, _canvasHeight);

  // Analizar frame

  if( (loopFrame % skipFrame !== 0) && image.naturalWidth && image.naturalHeight ) {
    try {
      source    = new ZXing.BitmapLuminanceSource(ctx, image);
      binarizer = new ZXing.Common.HybridBinarizer(source);
      bitmap    = new ZXing.BinaryBitmap(binarizer);
      result    = ZXing.PDF417.PDF417Reader.decode(bitmap, null, false)
      if( result && result[0] ) {
        resultP.innerHTML = result[0].Text.split('@').join('<br />');
      }
     
    } catch (err) {
      console.error(err);
    }
  }
}

const startLoop = () => { 
  loopFrame = loopFrame || requestAnimationFrame(loop);
}

// Iniciar loop
video.addEventListener('loadedmetadata',function(){
  _canvasWidth  = canvas.width = video.videoWidth;
  _canvasHeight = canvas.height = video.videoHeight;
  startLoop();
});


// Inicializar
startWebcam();