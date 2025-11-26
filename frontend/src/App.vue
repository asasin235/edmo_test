<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import ChatMessage from './components/ChatMessage.vue';
import VoiceInput from './components/VoiceInput.vue';
import TextInput from './components/TextInput.vue';
import ReportModal from './components/ReportModal.vue';
import AdminPanel from './views/AdminPanel.vue';
import { sendChatMessage, getUserReport, startSession } from './services/api';

// Routing
const currentView = ref('chat'); // 'chat' or 'admin'

// Check URL hash on mount and watch for changes
onMounted(() => {
  checkRoute();
  window.addEventListener('hashchange', checkRoute);
});

function checkRoute() {
  const hash = window.location.hash;
  if (hash === '#/admin') {
    currentView.value = 'admin';
  } else {
    currentView.value = 'chat';
  }
}

function goToAdmin() {
  window.location.hash = '#/admin';
  currentView.value = 'admin';
}

function goToChat() {
  window.location.hash = '';
  currentView.value = 'chat';
}

// Session state
const isSessionStarted = ref(false);
const emailInput = ref('');
const emailError = ref('');
const emailLoading = ref(false);
const userEmail = ref('');
const userName = ref('');
const isReturningUser = ref(false);

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
const questionProgress = ref({ current: 0, total: 8 });

// Report modal
const showReport = ref(false);
const reportData = ref(null);
const reportLoading = ref(false);

// Interview completion popup
const showCompletionPopup = ref(false);
const interviewCompleted = ref(false);

// Check for existing session on mount
onMounted(() => {
  const storedEmail = localStorage.getItem('student_email');
  const storedUserId = localStorage.getItem('student_user_id');
  
  if (storedEmail && storedUserId) {
    // Restore session
    userEmail.value = storedEmail;
    userId.value = storedUserId;
    userName.value = localStorage.getItem('student_name') || '';
    isSessionStarted.value = true;
    isReturningUser.value = true;
    
    // Add welcome back message
    addWelcomeMessage(true, userName.value);
  }
});

// Start session with email
async function handleStartSession() {
  if (!emailInput.value.trim()) {
    emailError.value = 'Please enter your email address';
    return;
  }
  
  emailError.value = '';
  emailLoading.value = true;
  
  try {
    const result = await startSession(emailInput.value.trim());
    
    // Store session data
    userId.value = result.userId;
    userEmail.value = result.email;
    userName.value = result.name || '';
    questionProgress.value.total = result.questionCount;
    isReturningUser.value = !result.isNewUser;
    
    // Save to localStorage
    localStorage.setItem('student_email', result.email);
    localStorage.setItem('student_user_id', result.userId);
    if (result.name) {
      localStorage.setItem('student_name', result.name);
    }
    
    isSessionStarted.value = true;
    
    // Add welcome message
    addWelcomeMessage(!result.isNewUser, result.name);
    
  } catch (err) {
    console.error('Session start error:', err);
    emailError.value = err.response?.data?.details || 'Failed to start session. Please try again.';
  } finally {
    emailLoading.value = false;
  }
}

// Add welcome message based on user status
function addWelcomeMessage(isReturning, name) {
  let welcomeContent;
  
  if (isReturning && name) {
    welcomeContent = `Welcome back, ${name}! 👋\n\nGreat to see you again. Let's continue learning about you to build an even better student profile.\n\nYou can type your responses or click the microphone button to speak.\n\nWhat would you like to tell me about yourself today?`;
  } else if (isReturning) {
    welcomeContent = `Welcome back! 👋\n\nGreat to see you again. Let's continue learning about you to build an even better student profile.\n\nYou can type your responses or click the microphone button to speak.\n\nWhat would you like to tell me about yourself today?`;
  } else {
    welcomeContent = `Hello! 👋 I'm your Student Profile Assistant. I'm here to learn about you and help create your personalized student profile.\n\nYou can type your responses or click the microphone button to speak - your voice will be transcribed so you can review before sending.\n\nLet's get started! What's your name?`;
  }
  
  messages.value = [{
    role: 'assistant',
    content: welcomeContent,
    timestamp: new Date().toISOString()
  }];
}

// Logout / Change email
function handleLogout() {
  localStorage.removeItem('student_email');
  localStorage.removeItem('student_user_id');
  localStorage.removeItem('student_name');
  
  isSessionStarted.value = false;
  userId.value = '';
  userEmail.value = '';
  userName.value = '';
  emailInput.value = '';
  conversationId.value = null;
  messages.value = [];
  questionProgress.value = { current: 0, total: 8 };
  interviewCompleted.value = false;
  showCompletionPopup.value = false;
}

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
    
    // Update question progress
    if (response.questionProgress) {
      questionProgress.value = response.questionProgress;
      
      // Check if interview is complete
      if (response.questionProgress.current >= response.questionProgress.total && !interviewCompleted.value) {
        interviewCompleted.value = true;
        // Show completion popup after a short delay to let the final message appear
        setTimeout(() => {
          showCompletionPopup.value = true;
        }, 1500);
      }
    }
    
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
  questionProgress.value.current = 0;
  interviewCompleted.value = false;
  showCompletionPopup.value = false;
  
  const greeting = userName.value 
    ? `Starting a new interview session, ${userName.value}! 🎯\n\nI'm ready to learn more about you. What would you like to share?`
    : 'Starting a new interview session! 🎯\n\nI\'m ready to learn about you. Let\'s begin - what\'s your name?';
  
  messages.value = [{
    role: 'assistant',
    content: greeting,
    timestamp: new Date().toISOString()
  }];
  error.value = null;
}

// View report from completion popup
function viewReportFromPopup() {
  showCompletionPopup.value = false;
  loadReport();
}

// Display text
const displayInput = computed(() => {
  return interimTranscript.value || inputText.value;
});

// Progress percentage
const progressPercentage = computed(() => {
  return Math.min(100, (questionProgress.value.current / questionProgress.value.total) * 100);
});
</script>

<template>
  <!-- Admin Panel -->
  <AdminPanel v-if="currentView === 'admin'" @back="goToChat" />
  
  <!-- Email Welcome Screen -->
  <div v-else-if="!isSessionStarted" class="welcome-screen">
    <div class="welcome-card">
      <div class="welcome-header">
        <div class="welcome-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <h1>Student Profile Assistant</h1>
        <p>Enter your email to start or continue your interview</p>
      </div>
      
      <form @submit.prevent="handleStartSession" class="email-form">
        <div class="input-group">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
          <input 
            type="email" 
            v-model="emailInput"
            placeholder="Enter your email address"
            :disabled="emailLoading"
            required
          />
        </div>
        
        <div class="error-text" v-if="emailError">{{ emailError }}</div>
        
        <button type="submit" class="start-btn" :disabled="emailLoading">
          {{ emailLoading ? 'Starting...' : 'Start Interview' }}
        </button>
      </form>
      
      <div class="welcome-features">
        <div class="feature">
          <span class="feature-icon">🎤</span>
          <span>Voice & Text Input</span>
        </div>
        <div class="feature">
          <span class="feature-icon">📋</span>
          <span>Personal Report Card</span>
        </div>
        <div class="feature">
          <span class="feature-icon">🤖</span>
          <span>AI-Powered Interview</span>
        </div>
      </div>
      
      <button class="admin-link" @click="goToAdmin">
        Admin Panel →
      </button>
    </div>
  </div>
  
  <!-- Chat Interface -->
  <div v-else class="app">
    <div class="chat-container">
      <!-- Header -->
      <header class="chat-header">
        <div class="header-content">
          <div class="logo">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div class="logo-info">
              <span class="logo-text">Student Profile</span>
              <span class="user-email" v-if="userEmail">{{ userEmail }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button class="header-btn" @click="startNewConversation" title="New conversation">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
            </button>
            <button class="header-btn report-btn" @click="loadReport" title="View Report Card">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                <path d="M8 7h6"/>
                <path d="M8 11h8"/>
              </svg>
              <span>Report Card</span>
            </button>
            <button class="header-btn admin-btn" @click="goToAdmin" title="Admin Panel">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>Admin</span>
            </button>
            <button class="header-btn logout-btn" @click="handleLogout" title="Change Email">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="progress-container" v-if="questionProgress.current > 0">
          <div class="progress-info">
            <span>Interview Progress</span>
            <span>{{ questionProgress.current }}/{{ questionProgress.total }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
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
    
    <!-- Interview Completion Popup -->
    <div class="completion-overlay" v-if="showCompletionPopup" @click.self="showCompletionPopup = false">
      <div class="completion-popup">
        <div class="completion-icon">🎉</div>
        <h2>Interview Complete!</h2>
        <p>Great job! You've answered all the questions. Your personalized Student Report Card is now ready.</p>
        <div class="completion-actions">
          <button class="btn-primary" @click="viewReportFromPopup">
            📋 View Report Card
          </button>
          <button class="btn-secondary" @click="showCompletionPopup = false">
            Continue Chatting
          </button>
        </div>
      </div>
    </div>
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

.logo-info {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
}

.user-email {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
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

.admin-btn {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fcd34d;
}

.admin-btn:hover {
  background: rgba(251, 191, 36, 0.2);
  color: #fde68a;
}

.logout-btn {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fecaca;
}

/* Progress Bar */
.progress-container {
  margin-top: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 6px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
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
  
  .report-btn span,
  .admin-btn span {
    display: none;
  }
  
  .user-email {
    display: none;
  }
}

/* Welcome Screen */
.welcome-screen {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.welcome-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 450px;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 10px 40px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.4s ease-out;
}

.welcome-header {
  margin-bottom: 32px;
}

.welcome-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
}

.welcome-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 10px 0;
}

.welcome-header p {
  color: #94a3b8;
  font-size: 15px;
  margin: 0;
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.email-form .input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s;
}

.email-form .input-group:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.email-form .input-group svg {
  color: #64748b;
  flex-shrink: 0;
}

.email-form .input-group input {
  flex: 1;
  background: transparent;
  border: none;
  color: #e2e8f0;
  font-size: 15px;
  outline: none;
}

.email-form .input-group input::placeholder {
  color: #64748b;
}

.email-form .error-text {
  color: #f87171;
  font-size: 14px;
  text-align: left;
}

.start-btn {
  padding: 16px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
}

.start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.welcome-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.feature-icon {
  font-size: 24px;
}

.admin-link {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.admin-link:hover {
  color: #94a3b8;
}

/* Completion Popup */
.completion-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.completion-popup {
  background: linear-gradient(165deg, #1a1f35 0%, #0d1117 100%);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 24px;
  padding: 40px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  animation: popIn 0.4s ease-out;
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 100px rgba(99, 102, 241, 0.2);
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.completion-icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: bounce-in 0.6s ease-out;
}

@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.completion-popup h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.completion-popup p {
  color: #94a3b8;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 28px 0;
}

.completion-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.completion-actions .btn-primary {
  padding: 16px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.completion-actions .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
}

.completion-actions .btn-secondary {
  padding: 14px 24px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.completion-actions .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}
</style>
