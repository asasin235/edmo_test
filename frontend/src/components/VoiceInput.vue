<script setup>
import { ref, onUnmounted } from 'vue';
import { transcribeAudio } from '../services/api';

const emit = defineEmits(['transcript', 'finalTranscript', 'error']);

const isRecording = ref(false);
const isProcessing = ref(false);
const mediaRecorder = ref(null);
const audioChunks = ref([]);

// Check if MediaRecorder is supported
const isSupported = typeof MediaRecorder !== 'undefined' && navigator.mediaDevices;

async function startRecording() {
  if (isRecording.value || isProcessing.value) return;
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      } 
    });
    
    // Determine the best supported MIME type
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
    
    mediaRecorder.value = new MediaRecorder(stream, { mimeType });
    audioChunks.value = [];
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data);
      }
    };
    
    mediaRecorder.value.onstop = async () => {
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      if (audioChunks.value.length === 0) {
        emit('error', 'No audio was recorded. Please try again.');
        isProcessing.value = false;
        return;
      }
      
      // Create audio blob
      const audioBlob = new Blob(audioChunks.value, { type: mimeType });
      
      // Send to backend for transcription
      isProcessing.value = true;
      emit('transcript', 'Processing audio...');
      
      try {
        const result = await transcribeAudio(audioBlob);
        
        if (result.text && result.text.trim()) {
          emit('finalTranscript', result.text.trim());
        } else {
          emit('error', 'No speech detected. Please try again.');
        }
      } catch (err) {
        console.error('Transcription error:', err);
        emit('error', err.response?.data?.details || 'Failed to transcribe audio. Please try again.');
      } finally {
        isProcessing.value = false;
        emit('transcript', '');
      }
    };
    
    mediaRecorder.value.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      emit('error', 'Recording error. Please try again.');
      isRecording.value = false;
      isProcessing.value = false;
    };
    
    mediaRecorder.value.start();
    isRecording.value = true;
    emit('transcript', 'Listening...');
    
  } catch (err) {
    console.error('Failed to start recording:', err);
    
    if (err.name === 'NotAllowedError') {
      emit('error', 'Microphone access denied. Please allow microphone access in your browser settings.');
    } else if (err.name === 'NotFoundError') {
      emit('error', 'No microphone found. Please connect a microphone and try again.');
    } else {
      emit('error', 'Failed to access microphone. Please check your settings.');
    }
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
  }
}

function toggleRecording() {
  if (isProcessing.value) return;
  
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
}

onUnmounted(() => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
  }
});
</script>

<template>
  <button 
    class="voice-button"
    :class="{ 
      recording: isRecording, 
      processing: isProcessing,
      unsupported: !isSupported 
    }"
    @click="toggleRecording"
    :disabled="!isSupported || isProcessing"
    :title="!isSupported ? 'Voice recording not supported' : (isProcessing ? 'Processing...' : (isRecording ? 'Stop recording' : 'Start voice input'))"
  >
    <!-- Microphone icon (default) -->
    <svg v-if="!isRecording && !isProcessing" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
    
    <!-- Stop icon (recording) -->
    <svg v-else-if="isRecording" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
    
    <!-- Processing spinner -->
    <div v-else class="spinner-icon"></div>
    
    <span class="pulse-ring" v-if="isRecording"></span>
  </button>
</template>

<style scoped>
.voice-button {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.voice-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
}

.voice-button:active:not(:disabled) {
  transform: scale(0.95);
}

.voice-button.recording {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  animation: glow 1.5s ease-in-out infinite;
}

.voice-button.processing {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  cursor: wait;
}

.voice-button.unsupported {
  background: #4b5563;
  cursor: not-allowed;
  opacity: 0.5;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
  }
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(239, 68, 68, 0.5);
  animation: pulse 1.5s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.spinner-icon {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
