<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  report: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Conversation Report</h2>
        <button class="close-button" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" x2="6" y1="6" y2="18"/>
            <line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="modal-body" v-if="loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Generating report...</p>
        </div>
      </div>
      
      <div class="modal-body" v-else-if="report">
        <div class="report-section">
          <h3>Summary</h3>
          <div class="summary-box">
            <p>{{ report.aiSummary }}</p>
          </div>
        </div>
        
        <div class="report-stats">
          <div class="stat">
            <span class="stat-value">{{ report.totalConversations }}</span>
            <span class="stat-label">Conversations</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ report.totalMessages }}</span>
            <span class="stat-label">Messages</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ formatDate(report.generatedAt).split(',')[0] }}</span>
            <span class="stat-label">Report Date</span>
          </div>
        </div>
        
        <div class="report-section" v-if="report.conversations?.length">
          <h3>Conversation History</h3>
          <div class="conversations-list">
            <div 
              class="conversation-item" 
              v-for="conv in report.conversations" 
              :key="conv.conversationId"
            >
              <div class="conversation-header">
                <span class="conversation-date">{{ formatDate(conv.startedAt) }}</span>
                <span class="message-count">{{ conv.messageCount }} messages</span>
              </div>
              <div class="messages-preview">
                <div 
                  class="message-preview" 
                  v-for="(msg, idx) in conv.messages.slice(0, 4)" 
                  :key="idx"
                  :class="msg.role"
                >
                  <strong>{{ msg.role === 'user' ? 'You' : 'AI' }}:</strong>
                  {{ msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content }}
                </div>
                <div class="more-messages" v-if="conv.messages.length > 4">
                  + {{ conv.messages.length - 4 }} more messages
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-body" v-else>
        <p class="no-data">No report data available</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
}

.close-button {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.report-section {
  margin-bottom: 24px;
}

.report-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.summary-box {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.summary-box p {
  margin: 0;
  color: #e2e8f0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.report-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.conversation-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.conversation-date {
  font-size: 13px;
  color: #94a3b8;
}

.message-count {
  font-size: 12px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
}

.messages-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-preview {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.4;
  padding-left: 8px;
  border-left: 2px solid #4b5563;
}

.message-preview.user {
  border-left-color: #6366f1;
}

.message-preview.assistant {
  border-left-color: #22c55e;
}

.more-messages {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
  text-align: center;
  padding-top: 8px;
}

.no-data {
  text-align: center;
  color: #64748b;
  padding: 48px;
}
</style>

