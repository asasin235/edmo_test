<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import speechRecognition from '../services/speechRecognition';

const emit = defineEmits(['transcript', 'finalTranscript', 'error']);

const isListening = ref(false);
const isSupported = ref(false);
const interimTranscript = ref('');

onMounted(() => {
  isSupported.value = speechRecognition.isSupported;
  
  speechRecognition.onResult = (transcript, isFinal) => {
    if (isFinal) {
      emit('finalTranscript', transcript);
      interimTranscript.value = '';
    } else {
      interimTranscript.value = transcript;
      emit('transcript', transcript);
    }
  };
  
  speechRecognition.onStart = () => {
    isListening.value = true;
  };
  
  speechRecognition.onEnd = () => {
    isListening.value = false;
    interimTranscript.value = '';
  };
  
  speechRecognition.onError = (message, code) => {
    emit('error', message);
    isListening.value = false;
    interimTranscript.value = '';
  };
});

onUnmounted(() => {
  speechRecognition.abort();
});

function toggleListening() {
  if (isListening.value) {
    speechRecognition.stop();
  } else {
    speechRecognition.start();
  }
}
</script>

<template>
  <button 
    class="voice-button"
    :class="{ listening: isListening, unsupported: !isSupported }"
    @click="toggleListening"
    :disabled="!isSupported"
    :title="!isSupported ? 'Speech recognition not supported' : (isListening ? 'Stop listening' : 'Start voice input')"
  >
    <svg v-if="!isListening" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
    <span class="pulse-ring" v-if="isListening"></span>
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

.voice-button.listening {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  animation: glow 1.5s ease-in-out infinite;
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
</style>

