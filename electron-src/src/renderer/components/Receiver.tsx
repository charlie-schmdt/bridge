export default function Receiver() {
  return (
    <div>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="flex-1  min-w-[150px] mt-2 mb-2">
          <label className="mb-2">Upload File/s</label>
        </div>
        <div className="flex-1  min-w-[150px] mt-2 mb-2">
          <label className="mb-2">Uploaded files</label>
        </div>
        <div className="flex-1  min-w-[150px] mt-2 mb-2">
          <label className="mb-2">Output File</label>
        </div>
        <div className="flex-1  min-w-[150px] mt-2 mb-2">
          <label className="mb-2">input</label>
        </div>
      </div>
      <hr/>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="flex-1  min-w-[100px] mt-2 mb-2">
          <label className="mb-2">Process:</label>
        </div>
        <div className="flex-1  min-w-[50px] mt-2 mb-2">
          <label className="mb-2">button</label>
        </div>
        <div className="flex-1  min-w-[100px] mt-2 mb-2">
          <label className="mb-2">Play Inputs</label>
        </div>
        <div className="flex-1  min-w-[50px] mt-2 mb-2">
          <label className="mb-2">button</label>
        </div>
        <div className="flex-1  min-w-[100px] mt-2 mb-2">
          <label className="mb-2">Play Outputs</label>
        </div>
        <div className="flex-1  min-w-[50px] mt-2 mb-2">
          <label className="mb-2">button</label>
        </div>
        <div className="flex-1  min-w-[100px] mt-2 mb-2">
          <label className="mb-2">Visualize Both</label>
        </div>
        <div className="flex-1  min-w-[50px] mt-2 mb-2">
          <label className="mb-2">button</label>
        </div>
      </div>
      <hr/>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="grid grid-flow-col grid-cols-2 grid-rows-4 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4  row-span-1 col-span-2">
            <h2 className="text-1xl font-bold text-gray-900">Before Processing:</h2>
          </div>
          <div className="p-4  row-span-3 col-span-1">
            <label className="mb-2">Meter Component</label>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <label className="mb-2">Waveform Canvas</label>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <label className="mb-2">Spectragram</label>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <label className="mb-2">Frequency</label>
          </div>    
        </div>
        <div className="grid grid-flow-col grid-cols-2 grid-rows-4 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4  row-span-1 col-span-2">
            <h2 className="text-1xl font-bold text-gray-900">After Processing:</h2>
          </div>
          <div className="p-4  row-span-3 col-span-1">
            <label className="mb-2">Meter Component</label>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <label className="mb-2">Waveform Canvas</label>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <label className="mb-2">Spectragram</label>
          </div>
          <div className="p-4  row-span-1 col-span-1">
            <label className="mb-2">Frequency</label>
          </div>    
        </div>
      </div>
      <hr/>
      <h2 className="text-1xl font-bold text-gray-900 mt-2">Latency: ______</h2>
    </div>
  );
}
