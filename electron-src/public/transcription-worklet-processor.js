class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (event) => {};
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0]; // Float32Array
      this.port.postMessage(channelData);
    }

    // return true to keep processor alive
    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
