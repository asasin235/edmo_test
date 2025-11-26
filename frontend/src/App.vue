<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from './components/ChatMessage.vue';
import VoiceInput from './components/VoiceInput.vue';
import TextInput from './components/TextInput.vue';
import ReportModal from './components/ReportModal.vue';
import { sendChatMessage, getUserReport } from './services/api';

// State
const messages = ref([]);
const inputText = ref('');
const isLoading = ref(false);
const error = ref(null);
const userId = ref('');
const conversationId = ref(null);
const messagesContainer = ref(null);
const textInputRef = ref(null);
const interimTranscript = ref('');

// Report modal
const showReport = ref(false);
const reportData = ref(null);
const reportLoading = ref(false);

// Initialize user ID
onMounted(() => {
  // Get or create user ID from localStorage
  const storedUserId = localStorage.getItem('ai_chat_user_id');
  if (storedUserId) {
    userId.value = storedUserId;
  } else {
    userId.value = uuidv4();
    localStorage.setItem('ai_chat_user_id', userId.value);
  }
  
  // Add welcome message for student interview
  messages.value.push({
    role: 'assistant',
    content: 'Hello! 👋 I\'m your Student Profile Assistant. I\'m here to learn about you and help create your personalized student profile.\n\nYou can type your responses or click the microphone button to speak - your voice will be transcribed so you can review before sending.\n\nLet\'s get started! What\'s your name?',
    timestamp: new Date().toISOString()
  });
});

// Scroll to bottom of messages
async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

// Send message
async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;
  
  // Clear input
  inputText.value = '';
  interimTranscript.value = '';
  error.value = null;
  
  // Add user message to chat
  messages.value.push({
    role: 'user',
    content: text,
    timestamp: new Date().toISOString()
  });
  
  scrollToBottom();
  isLoading.value = true;
  
  try {
    const response = await sendChatMessage(userId.value, text, conversationId.value);
    
    // Save conversation ID for context
    conversationId.value = response.conversationId;
    
    // Add AI response
    messages.value.push({
      role: 'assistant',
      content: response.response,
      timestamp: response.timestamp
    });
    
    scrollToBottom();
  } catch (err) {
    console.error('Error sending message:', err);
    error.value = err.response?.data?.details || err.message || 'Failed to send message';
    
    // Remove the user message if it failed
    // messages.value.pop();
  } finally {
    isLoading.value = false;
    textInputRef.value?.focus();
  }
}

// Handle voice transcript
function handleVoiceTranscript(transcript) {
  interimTranscript.value = transcript;
}

// Handle final voice transcript - populate text box for review before sending
function handleFinalTranscript(transcript) {
  inputText.value = transcript;
  interimTranscript.value = '';
  // Focus the text input so user can review/edit before sending
  textInputRef.value?.focus();
}

// Handle voice error
function handleVoiceError(message) {
  error.value = message;
}

// Load and show report
async function loadReport() {
  showReport.value = true;
  reportLoading.value = true;
  reportData.value = null;
  
  try {
    reportData.value = await getUserReport(userId.value);
  } catch (err) {
    console.error('Error loading report:', err);
    error.value = 'Failed to load report';
  } finally {
    reportLoading.value = false;
  }
}

// Start new conversation
function startNewConversation() {
  conversationId.value = null;
  messages.value = [{
    role: 'assistant',
    content: 'Starting a new interview session! 🎯\n\nI\'m ready to learn about you. Let\'s begin - what\'s your name?',
    timestamp: new Date().toISOString()
  }];
  error.value = null;
}

// Display text
const displayInput = computed(() => {
  return interimTranscript.value || inputText.value;
});
</script>

<template>
  <div class="app">
    <div class="chat-container">
      <!-- Header -->
      <header class="chat-header">
        <div class="header-content">
          <div class="logo">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8V4H8"/>
                <rect width="16" height="12" x="4" y="8" rx="2"/>
                <path d="M2 14h2"/>
                <path d="M20 14h2"/>
                <path d="M15 13v2"/>
                <path d="M9 13v2"/>
              </svg>
            </div>
            <span class="logo-text">AI Assistant</span>
          </div>
          <div class="header-actions">
            <button class="header-btn" @click="startNewConversation" title="New conversation">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
            </button>
            <button class="header-btn report-btn" @click="loadReport" title="View Report">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" x2="8" y1="13" y2="13"/>
                <line x1="16" x2="8" y1="17" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Report</span>
            </button>
          </div>
        </div>
      </header>
      
      <!-- Messages -->
      <div class="messages-container" ref="messagesContainer">
        <div class="messages-wrapper">
          <ChatMessage 
            v-for="(message, index) in messages" 
            :key="index" 
            :message="message" 
          />
          
          <!-- Loading indicator -->
          <div class="message assistant" v-if="isLoading">
            <div class="message-bubble loading">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Error message -->
      <div class="error-message" v-if="error">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" x2="12" y1="8" y2="12"/>
          <line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
        <span>{{ error }}</span>
        <button @click="error = null">Dismiss</button>
      </div>
      
      <!-- Interim transcript display -->
      <div class="interim-transcript" v-if="interimTranscript">
        <span class="listening-label">Listening:</span>
        {{ interimTranscript }}
      </div>
      
      <!-- Input area -->
      <div class="input-area">
        <VoiceInput 
          @transcript="handleVoiceTranscript"
          @final-transcript="handleFinalTranscript"
          @error="handleVoiceError"
        />
        <TextInput 
          ref="textInputRef"
          v-model="inputText"
          :disabled="isLoading"
          placeholder="Type your message..."
          @send="sendMessage"
        />
      </div>
    </div>
    
    <!-- Report Modal -->
    <ReportModal 
      v-if="showReport"
      :report="reportData"
      :loading="reportLoading"
      @close="showReport = false"
    />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #0f172a;
  color: #e2e8f0;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.chat-container {
  width: 100%;
  max-width: 800px;
  height: calc(100vh - 40px);
  max-height: 900px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 10px 40px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.5);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.report-btn {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.report-btn:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #c7d2fe;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scroll-behavior: smooth;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.messages-wrapper {
  display: flex;
  flex-direction: column;
}

.message {
  display: flex;
  margin-bottom: 16px;
}

.message.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
}

.message-bubble.loading {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom-left-radius: 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #6366f1;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(239, 68, 68, 0.1);
  border-top: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  font-size: 14px;
}

.error-message button {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  text-decoration: underline;
  font-size: 13px;
}

.interim-transcript {
  padding: 8px 24px;
  background: rgba(99, 102, 241, 0.1);
  border-top: 1px solid rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  font-size: 14px;
  font-style: italic;
}

.listening-label {
  font-weight: 600;
  margin-right: 8px;
}

.input-area {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.5);
}

@media (max-width: 600px) {
  .app {
    padding: 0;
  }
  
  .chat-container {
    height: 100vh;
    max-height: none;
    border-radius: 0;
    border: none;
  }
  
  .report-btn span {
    display: none;
  }
}
</style>
