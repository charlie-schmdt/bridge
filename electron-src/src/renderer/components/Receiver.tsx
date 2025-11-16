import { useEffect, useState, useRef } from "react";
import AudioMeter from "./AudioMeter";
import TranscriptionWindow from "./TranscriptionWindow";
import {useAudioContext} from "../contexts/AudioContext";

import {
  Tabs, Tab,
  Card, CardHeader, CardBody,
  Input, Textarea, Button, Slider,
  Select, SelectItem, 
  Switch
} from "@heroui/react";

function Initialize() {
  const { initializeAudioGraph } = useAudioContext();
  return(<Button
  onPress={initializeAudioGraph}
  >Initialize Audio</Button>)
  
}

function Teardown() {
  const { tearDownAudioGraph } = useAudioContext();
  return(<Button
  onPress={tearDownAudioGraph}
  >TearDown Audio</Button>)
  
}

function UploadFile({name, index}) {
  return (
    <div className="flex">
      <Input 
      placeholder={name}
      id={`file${index}`}/>
    </div>
  )
}



function LoadFiles() {
  const { loadAudioFiles } = useAudioContext();
  const load = () => {
    let files = []
    for (let i = 0 ; i < 5 ; i++) {
      const fileRef = document.getElementById(`file${i}`) as HTMLInputElement
      let val = fileRef.value
      files.push(val)
    }
    loadAudioFiles(files)
  }
  
  return (
    <Button onPress={load}>
      Load Files
    </Button>
  );
}

function ResetFiles() {
  const { resetAudioFiles } = useAudioContext();
  const reset = () => {
    for (let i = 0 ; i < 5 ; i++) {
      const fileRef = document.getElementById(`file${i}`) as HTMLInputElement
      fileRef.value = '';
    }
    resetAudioFiles()
  }

  return (
    <Button onPress={reset}>
      Reset Files
    </Button>
  );
}

function PlayUnprocessed() {
  const { playAudioFiles } = useAudioContext();

  return (
    <Button onPress={playAudioFiles}>
      Play Unprocessed
    </Button>
  );
}

function Process() {
  return (
    <Button>
      Process
    </Button>
  );
}

function AGCValue({index}) {
  //const {loadedAudioFiles, agcValues} = useAudioContext();
  let agcValues=[0.5,0.5,0.5,0.5,0.5]
  let title=`agcValue${index}`
  //have it update every time the AGC changes

  return (
    <div className="flex pl-8 gap-4 items-center">
      <input
        id={title}
        type="range"
        min="0"
        max="1"
        step="0.01"
        defaultValue={agcValues[index]}
        className="w-full rotate-90 origin-left"
      />
    </div>
  );
}

export default function Receiver() {

  const { analyserNode } = useAudioContext();
  return (
    <div>
      <Initialize/>
      <Teardown/>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="flex-1  min-w-[150px] mt-2 mb-2">
          <UploadFile name="File 1..." index={0}/>
          <UploadFile name="File 2..." index={1}/>
          <UploadFile name="File 3..." index={2}/>
          <UploadFile name="File 4..." index={3}/>
          <UploadFile name="File 5..." index={4}/>
        </div>
        <div className="flex-row  min-w-[150px] mt-2 mb-2">
          <div className="flex-1  min-w-[50px] mt-2 mb-2">
            <LoadFiles/>
          </div>
          <div className="flex-1  min-w-[50px] mt-2 mb-2">
            <ResetFiles/>
          </div>
          <div className="flex-1  min-w-[50px] mt-2 mb-2">
            <PlayUnprocessed/>
          </div>
          <div className="flex-1  min-w-[50px] mt-2 mb-2">
            <Process/>
          </div>
        </div>
      </div>
      <div className="flex flex-row min-w-[300px] rounded-xl shadow gap-4">
        <div className ="flex-[1]">
          <div className="flex flex-row rounded-xl">
            <div className="flex-1">
              <AudioMeter
                title="File 1"
                analyzerNode={analyserNode}
                size={0.5}
              />
            </div>
            <div className="flex-1">
              <AudioMeter
                title="File 2"
                analyzerNode={analyserNode}
                size={0.5}
              />
            </div>
            <div className="flex-1">
              <AudioMeter
                title="File 3"
                analyzerNode={analyserNode}
                size={0.5}
              />
            </div>
            <div className="flex-1">
              <AudioMeter
                title="File 4"
                analyzerNode={analyserNode}
                size={0.5}
              />
            </div>
            <div className="flex-1">
              <AudioMeter
                title="File 5"
                analyzerNode={analyserNode}
                size={0.5}
              />
            </div>
          </div>
          <div className="flex flex-row rounded-xl mb-30">
            <AGCValue index={0}/>
            <AGCValue index={1}/>
            <AGCValue index={2}/>
            <AGCValue index={3}/>
            <AGCValue index={4}/>
          </div>
        </div>
        <div className="flex-[1] min-w-[300px]">
          <TranscriptionWindow/>
        </div>   
      </div>
    </div>
  );
}
