import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Send a chat message and get AI response
 * @param {string} userId - The user's ID
 * @param {string} message - The message to send
 * @param {string|null} conversationId - Optional conversation ID
 * @returns {Promise<{response: string, conversationId: string, timestamp: string}>}
 */
export async function sendChatMessage(userId, message, conversationId = null) {
  const payload = {
    userId,
    message
  };
  
  if (conversationId) {
    payload.conversationId = conversationId;
  }
  
  const response = await api.post('/chat', payload);
  return response.data;
}

/**
 * Get conversation history
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>}
 */
export async function getConversationHistory(conversationId) {
  const response = await api.get(`/chat/history/${conversationId}`);
  return response.data;
}

/**
 * Get user report with conversation history and AI summary
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>}
 */
export async function getUserReport(userId) {
  const response = await api.get(`/report/${userId}`);
  return response.data;
}

/**
 * Get only the AI summary for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>}
 */
export async function getUserSummary(userId) {
  const response = await api.get(`/report/${userId}/summary`);
  return response.data;
}

export default api;

