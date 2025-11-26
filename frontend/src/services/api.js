import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Start a chat session with email
 * @param {string} email - The user's email
 * @returns {Promise<{userId: string, email: string, name: string|null, isNewUser: boolean, questionCount: number}>}
 */
export async function startSession(email) {
  const response = await api.post('/chat/start', { email });
  return response.data;
}

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

/**
 * Transcribe audio using OpenAI Whisper
 * @param {Blob} audioBlob - The audio blob to transcribe
 * @returns {Promise<{text: string}>}
 */
export async function transcribeAudio(audioBlob) {
  // Convert blob to base64
  const base64Audio = await blobToBase64(audioBlob);
  
  const response = await api.post('/transcribe', {
    audio: base64Audio
  });
  return response.data;
}

/**
 * Convert a Blob to base64 string
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============== ADMIN API ==============

/**
 * Admin login
 * @param {string} password - Admin password
 * @returns {Promise<{success: boolean}>}
 */
export async function adminLogin(password) {
  const response = await api.post('/admin/login', { password });
  return response.data;
}

/**
 * Get admin settings
 * @param {string} adminPassword - Admin password for auth
 * @returns {Promise<Object>}
 */
export async function getAdminSettings(adminPassword) {
  const response = await api.get('/admin/settings', {
    headers: { 'X-Admin-Password': adminPassword }
  });
  return response.data;
}

/**
 * Update admin setting
 * @param {string} adminPassword - Admin password for auth
 * @param {string} key - Setting key
 * @param {string} value - Setting value
 * @returns {Promise<Object>}
 */
export async function updateAdminSetting(adminPassword, key, value) {
  const response = await api.put('/admin/settings', { key, value }, {
    headers: { 'X-Admin-Password': adminPassword }
  });
  return response.data;
}

/**
 * Get all students
 * @param {string} adminPassword - Admin password for auth
 * @returns {Promise<Array>}
 */
export async function getAdminStudents(adminPassword) {
  const response = await api.get('/admin/students', {
    headers: { 'X-Admin-Password': adminPassword }
  });
  return response.data;
}

/**
 * Get student report
 * @param {string} adminPassword - Admin password for auth
 * @param {string} userId - Student user ID
 * @returns {Promise<Object>}
 */
export async function getAdminStudentReport(adminPassword, userId) {
  const response = await api.get(`/admin/students/${userId}/report`, {
    headers: { 'X-Admin-Password': adminPassword }
  });
  return response.data;
}

/**
 * Download student report as PDF
 * @param {string} adminPassword - Admin password for auth
 * @param {string} userId - Student user ID
 */
export async function downloadStudentPDF(adminPassword, userId) {
  const response = await api.get(`/admin/students/${userId}/pdf`, {
    headers: { 'X-Admin-Password': adminPassword },
    responseType: 'blob'
  });
  
  // Create download link
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'Student_Report.pdf';
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
