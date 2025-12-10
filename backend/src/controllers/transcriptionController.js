module.exports = {
    getSource
};

async function getSource(req, res) {
  try {
    const source = `class PCMProcessor extends AudioWorkletProcessor {
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

registerProcessor("pcm-processor", PCMProcessor);`

    res.setHeader("Content-Type", "application/javascript");
    res.send(source);
  } catch (error) {
    console.error('Error fetching source code', error);
    return res.status(500).json({ success: false, message: 'Server error fetching source code' });
  }
}
