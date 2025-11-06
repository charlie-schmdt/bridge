import { useEffect, useState, useRef } from "react";
import {useAudioContext} from "../contexts/AudioContext";
import AudioMeter from "./AudioMeter"
import p5 from 'p5';


function Waveform(props) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const winWidth = 175;
    const winHeight = 150;


    // Define the sketch function for p5.js
    const sketch = (p) => {
      p.setup = () => {
        // Create the canvas using p5.js and attach it to the div
        p.createCanvas(winWidth, winHeight).parent(canvasRef.current);
      };

      p.draw = () => {
        // Clear the canvas each frame (optional)
        p.background(178, 199, 255); 


        // Example: Draw dynamic text
        p.fill(0, 255, 0); // Green color
        p.textSize(16);
        p.text('Waveform', 50, 150);
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
    <div id={props.name} ref={canvasRef}>
    </div>
  );
}

function Spectragram(props) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const winWidth = 175;
    const winHeight = 150;

    // Define the sketch function for p5.js
    const sketch = (p) => {
      p.setup = () => {
        // Create the canvas using p5.js and attach it to the div
        p.createCanvas(winWidth, winHeight).parent(canvasRef.current);
      };

      p.draw = () => {
        // Clear the canvas each frame (optional)
        p.background(178, 199, 255); 


        // Example: Draw dynamic text
        p.fill(0, 255, 0); // Green color
        p.textSize(16);
        p.text('Spectragram', 50, 150);
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
    <div id={props.name} ref={canvasRef}>
    </div>
  );
}

function Frequency(props) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const winWidth = 175;
    const winHeight = 150;

    // Define the sketch function for p5.js
    const sketch = (p) => {
      p.setup = () => {
        // Create the canvas using p5.js and attach it to the div
        p.createCanvas(winWidth, winHeight).parent(canvasRef.current);
      };

      p.draw = () => {
        // Clear the canvas each frame (optional)
        p.background(60, 63, 65); 


        // Example: Draw dynamic text
        p.fill(0, 255, 0); // Green color
        p.textSize(16);
        p.text('Frequency', 50, 150);
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
    <div id={props.name} ref={canvasRef}>
    </div>
  );
}

export default function AudioVisualizers() {
  return (
    <div className="grid grid-flow-col grid-cols-2 grid-rows-3 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4  row-span-3 col-span-1">
            <AudioMeter/>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <Waveform name="senderPreWaveform"/>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <Spectragram name="senderPreSpectragram"/>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <Frequency name="senderPreFrequency"/>
          </div>    
    </div>
  );}
