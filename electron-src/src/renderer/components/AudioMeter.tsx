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

export default function AudioMeter() {
  const canvasRef = useRef(null);
  const {analyserNode} = useAudioContext();

  useEffect(() => {
    //set the dimensions of the canvas
    const winWidth = 150;
    const winHeight = 250;

    // Get the initial analyser data
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteTimeDomainData(dataArray);

    // Sketch function for p5.js
    const sketch = (p) => {
      p.setup = () => {
        // Create the canvas using p5.js and attach it to the div
        p.createCanvas(winWidth, winHeight).parent(canvasRef.current);
      };

      // Draw function for p5.js
      p.draw = () => {
        //Get the analyser data

        analyserNode.getByteTimeDomainData(dataArray);
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
        p.line(35, 25, 115, 25);

        //0.9 threshold line
        if (rms >= 0.9) {
          p.stroke(202, 2, 1)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 40, 115, 40);

        //0.8 threshold line
        if (rms >= 0.8) {
          p.stroke(202, 2, 1)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 55, 115, 55);

        //0.7 threshold line
        if (rms >= 0.7) {
          p.stroke(188, 252, 71)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 70, 115, 70);


        //0.6 threshold line
        if (rms >= 0.6) {
          p.stroke(188, 252, 71)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 85, 115, 85);

        //0.5 threshold line
        if (rms >= 0.5) {
          p.stroke(0, 220, 37)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 100, 115, 100);

        //0.4 threshold line
        if (rms >= 0.4) {
          p.stroke(0, 220, 37)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 115, 115, 115);

        //0.3 threshold line
        if (rms >= 0.3) {
          p.stroke(0, 220, 37)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 130, 115, 130);

        //0.2 threshold line
        if (rms >= 0.2) {
          p.stroke(0, 220, 37)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 145, 115, 145);

        //0.1 threshold line
        if (rms >= 0.1) {
          p.stroke(0, 220, 37)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 160, 115, 160);

        //0.05 threshold line
        if (rms >= 0.05) {
          p.stroke(0, 220, 37)
        } else {
          p.stroke(220, 229, 255);
        }
        p.strokeWeight(5);
        p.line(35, 175, 115, 175);

        // Example: Draw dynamic text
        p.stroke(178, 199, 255);
        p.fill(2, 2, 3);
        p.textSize(16);
        p.text('Audio Meter', 30, 225);
      };
    };

    // Initialize the p5 sketch
    new p5(sketch);

    // Cleanup on component unmount (destroy the p5 instance)
    return () => {
      if (canvasRef.current) {
        canvasRef.current.innerHTML = ''; // Clear the div
      }
    };
  }, []);

  return (
    <div ref={canvasRef}>
    </div>
  );
}
