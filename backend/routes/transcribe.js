const express = require('express');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const os = require('os');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * POST /api/transcribe
 * Transcribe audio using OpenAI Whisper API
 * 
 * Request: multipart/form-data with 'audio' file
 * Response: { text: string }
 */
router.post('/', async (req, res) => {
  let tempFilePath = null;
  
  try {
    if (!req.body || !req.body.audio) {
      return res.status(400).json({
        error: 'No audio data provided'
      });
    }

    // Get the base64 audio data
    const audioData = req.body.audio;
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // Create a temporary file
    tempFilePath = path.join(os.tmpdir(), `audio_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'en'
    });

    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    res.json({
      text: transcription.text
    });

  } catch (error) {
    // Clean up temp file on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      details: error.message
    });
  }
});

module.exports = router;

