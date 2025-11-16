import { useEffect, useRef } from "react";
import {useAudioContext} from "../contexts/AudioContext";
import p5 from 'p5';

function calculateRMS(dataArray) {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += Math.pow(dataArray[i] - 128, 2);
  }
  const rms = Math.sqrt(sum / dataArray.length)
  return rms / 128; // Normalize RMS value between 0 and 1
}

export default function AudioMeter({title, analyzerNode, size}) {
  const canvasRef = useRef(null);
  const {audioContext} = useAudioContext();

  useEffect(() => {
    if (audioContext) {
      //set the dimensions of the canvas
      const winWidth = 150 * size;
      const winHeight = 250 * size;

      // Get the initial analyser data
      const bufferLength = analyzerNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyzerNode.getByteTimeDomainData(dataArray);

      // Sketch function for p5.js
      const sketch = (p) => {
        p.setup = () => {
          // Create the canvas using p5.js and attach it to the div
          p.createCanvas(winWidth, winHeight).parent(canvasRef.current);
        };

        // Draw function for p5.js
        p.draw = () => {
          //Get the analyser data

          analyzerNode.getByteTimeDomainData(dataArray);
          const rms = calculateRMS(dataArray)

          // Clear the canvas each frame (optional)
          p.background(178, 199, 255);
      
          // Example: Draw meter lines colored if above threshold
          //1 threshold line
          if (rms >= 1) {
            p.stroke(202, 2, 1)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 25*size, 115*size, 25*size);

          //0.9 threshold line
          if (rms >= 0.9) {
            p.stroke(202, 2, 1)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 40*size, 115*size, 40*size);

          //0.8 threshold line
          if (rms >= 0.8) {
            p.stroke(202, 2, 1)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 55*size, 115*size, 55*size);

          //0.7 threshold line
          if (rms >= 0.7) {
            p.stroke(188, 252, 71)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 70*size, 115*size, 70*size);


          //0.6 threshold line
          if (rms >= 0.6) {
            p.stroke(188, 252, 71)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 85*size, 115*size, 85*size);

          //0.5 threshold line
          if (rms >= 0.5) {
            p.stroke(0, 220, 37)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 100*size, 115*size, 100*size);

          //0.4 threshold line
          if (rms >= 0.4) {
            p.stroke(0, 220, 37)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 115*size, 115*size, 115*size);

          //0.3 threshold line
          if (rms >= 0.3) {
            p.stroke(0, 220, 37)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 130*size, 115*size, 130*size);

          //0.2 threshold line
          if (rms >= 0.2) {
            p.stroke(0, 220, 37)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 145*size, 115*size, 145*size);

          //0.1 threshold line
          if (rms >= 0.1) {
            p.stroke(0, 220, 37)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 160*size, 115*size, 160*size);

          //0.05 threshold line
          if (rms >= 0.05) {
            p.stroke(0, 220, 37)
          } else {
            p.stroke(220, 229, 255);
          }
          p.strokeWeight(5);
          p.line(35*size, 175*size, 115*size, 175*size);

          // Example: Draw dynamic text
          p.stroke(178, 199, 255);
          p.fill(2, 2, 3);
          p.textSize(16*size);
          p.text(title, 30*size, 225*size);
        };
      };

      // Initialize the p5 sketch
      new p5(sketch);
    }
    else {
      //if the audio context isn't set up
      //set the dimensions of the canvas
      const winWidth = 150 * size;
      const winHeight = 250 * size;

      // Sketch function for p5.js
      const sketch = (p) => {
        p.setup = () => {
          // Create the canvas using p5.js and attach it to the div
          p.createCanvas(winWidth, winHeight).parent(canvasRef.current);
        };

        // Draw function for p5.js
        p.draw = () => {
          // Clear the canvas each frame (optional)
          p.background(178, 199, 255);
      
          // Example: Draw dynamic text
          p.stroke(178, 199, 255);
          p.fill(2, 2, 3);
          p.textSize(16*size);
          p.text("No Audio", 30*size, 125*size);
        };
      };

      // Initialize the p5 sketch
      new p5(sketch);
    }
    

    // Cleanup on component unmount (destroy the p5 instance)
    return () => {
      if (canvasRef.current) {
        canvasRef.current.innerHTML = ''; // Clear the div
      }
    };
  }, [audioContext]);

  return (
    <div ref={canvasRef}>
    </div>
  );
}
