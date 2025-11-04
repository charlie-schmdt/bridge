import { useEffect, useState, useRef } from "react";
import AudioVisualizers from "./AudioVisualizers";
import {
  Tabs, Tab,
  Card, CardHeader, CardBody,
  Input, Textarea, Button, Slider,
  Select, SelectItem, 
  Switch
} from "@heroui/react";

function UploadFile() {

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <Input 
      placeholder="Upload File"
      type="file"/>
    </div>
  )
}

function OutputFile() {

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <Input placeholder="File"/>
    </div>
  )
}

function ProcessButton() {
  return (
    <div className="flex gap-4 items-center">
      <Button isIconOnly aria-label="Process">
        <img
          src="/Users/tylerptak/Documents/Class/Fall_25/407/bridge/electron-src/src/assets/record.avif" // Replace with the path to your image
          alt="Record Icon"
          className="w-8 h-8" // You can adjust the size here
        />
      </Button>
    </div>
  );
}

function PlayInputsButton() {
  return (
    <div className="flex gap-4 items-center">
      <Button isIconOnly aria-label="Play Inputs">
        <img
          src="/Users/tylerptak/Documents/Class/Fall_25/407/bridge/electron-src/src/assets/play.png" // Replace with the path to your image
          alt="Record Icon"
          className="w-8 h-8" // You can adjust the size here
        />
      </Button>
    </div>
  );
}

function PlayOutputsButton() {
  return (
    <div className="flex gap-4 items-center">
      <Button isIconOnly aria-label="Play Outputs">
        <img
          src="/Users/tylerptak/Documents/Class/Fall_25/407/bridge/electron-src/src/assets/play.png" // Replace with the path to your image
          alt="Play Outputs Icon"
          className="w-8 h-8" // You can adjust the size here
        />
      </Button>
    </div>
  );
}

function VisualizeButton() {
  return (
    <div className="flex gap-4 items-center">
      <Button isIconOnly aria-label="Play">
        <img
          src="/Users/tylerptak/Documents/Class/Fall_25/407/bridge/electron-src/src/assets/play.png" // Replace with the path to your image
          alt="Visualize Icon"
          className="w-8 h-8" // You can adjust the size here
        />
      </Button>
    </div>
  );
}

export default function Receiver() {
  return (
    <div>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="flex-2  min-w-[150px] mt-2 mb-2">
          <UploadFile/>
          <UploadFile/>
          <UploadFile/>
          <UploadFile/>
          <UploadFile/>
        </div>
        <div className="flex-1  min-w-[150px] mt-2 mb-2">
          <label className="mb-2">Output File</label>
        </div>
        <div className="flex-1  min-w-[150px] mt-2 mb-2">
          <OutputFile/>
        </div>
      </div>
      <hr/>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="flex-1  min-w-[100px] mt-2 mb-2">
          <label className="mb-2">Process:</label>
        </div>
        <div className="flex-1  min-w-[50px] mt-2 mb-2">
          <ProcessButton/>
        </div>
        <div className="flex-1  min-w-[100px] mt-2 mb-2">
          <label className="mb-2">Play Inputs</label>
        </div>
        <div className="flex-1  min-w-[50px] mt-2 mb-2">
          <PlayInputsButton/>
        </div>
        <div className="flex-1  min-w-[100px] mt-2 mb-2">
          <label className="mb-2">Play Outputs</label>
        </div>
        <div className="flex-1  min-w-[50px] mt-2 mb-2">
          <PlayOutputsButton/>
        </div>
        <div className="flex-1  min-w-[100px] mt-2 mb-2">
          <label className="mb-2">Visualize Both</label>
        </div>
        <div className="flex-1  min-w-[50px] mt-2 mb-2">
          <VisualizeButton/>
        </div>
      </div>
      <hr/>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <AudioVisualizers/>
        <AudioVisualizers/>
      </div>
      <hr/>
      <h2 className="text-1xl font-bold text-gray-900 mt-2">Latency: ______</h2>
    </div>
  );
}
