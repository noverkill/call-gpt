require('dotenv').config();
const { Buffer } = require('node:buffer');
const EventEmitter = require('events');
const fetch = require('node-fetch');
const axios = require('axios');

let gnum = 0;

class TextToSpeechService extends EventEmitter {
  constructor() {
    super();
    this.nextExpectedIndex = 0;
    this.speechBuffer = {};
  }

  async generate(gptReply, interactionCount) {

    console.log("generate", gnum++);

    const { partialResponseIndex, partialResponse } = gptReply;

    if (! partialResponse) { return; }

    try {
      // `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream?output_format=ulaw_8000&optimize_streaming_latency=3`,


      // Set options for the API request.
      // Code from: https://dev.to/ssk14/getting-started-with-elevenlabs-text-to-speech-api-21j4
      // Axios: https://www.npmjs.com/package/axios
      // npm install axios
      const options = {
        method: 'POST',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_MODEL_ID}/stream?output_format=ulaw_8000&optimize_streaming_latency=3`,
        headers: {
          accept: 'audio/wav',
          'content-type': 'application/json',
          'xi-api-key': `${process.env.ELEVENLABS_API_KEY}`,
        },
        data: {
          text: partialResponse,
        },
        responseType: 'arraybuffer',
      };

      // Send the API request using Axios and wait for the response.
      const response = await axios.request(options);

      // Return the binary audio data received from the API response.
      // return response.data;
      // console.log(response.data);

      if (response.status === 200) {
        // const audioArrayBuffer = await response.arrayBuffer();
        const audioArrayBuffer = response.data;
        this.emit('speech', partialResponseIndex, Buffer.from(audioArrayBuffer).toString('base64'), partialResponse, interactionCount);
      } else {
        console.log('Eleven Labs Error:', response.status);
        // console.log(response);
      }
    } catch (err) {
      console.error('Error occurred in Elevenlabs TextToSpeech service');
      console.error(err);
    }

    /* Deepgram TTS API
    try {
      const response = await fetch(
        `https://api.deepgram.com/v1/speak?model=${process.env.VOICE_MODEL}&encoding=mulaw&sample_rate=8000&container=none`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: partialResponse,
          }),
        }
      );

      if (response.status === 200) {
        try {
          const blob = await response.blob();
          const audioArrayBuffer = await blob.arrayBuffer();
          const base64String = Buffer.from(audioArrayBuffer).toString('base64');
          this.emit('speech', partialResponseIndex, base64String, partialResponse, interactionCount);
        } catch (err) {
          console.log(err);
        }
      } else {
        console.log('Deepgram TTS error:');
        console.log(response);
      }
    } catch (err) {
      console.error('Error occurred in Deepgram TextToSpeech service');
      console.error(err);
    }
    */
  }
}

module.exports = { TextToSpeechService };