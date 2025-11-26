<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  adminLogin, 
  getAdminSettings, 
  updateAdminSetting, 
  getAdminStudents,
  getAdminStudentReport,
  downloadStudentPDF
} from '../services/api';

const emit = defineEmits(['back']);

// Auth state
const isAuthenticated = ref(false);
const password = ref('');
const adminPassword = ref('');
const loginError = ref('');
const loginLoading = ref(false);

// Data state
const settings = ref({});
const students = ref([]);
const loading = ref(false);
const error = ref(null);

// Settings edit
const editingQuestionCount = ref(false);
const newQuestionCount = ref('');

// Selected student report
const selectedStudent = ref(null);
const studentReport = ref(null);
const reportLoading = ref(false);

// Check if there's a saved session and validate it
onMounted(async () => {
  const savedPassword = sessionStorage.getItem('adminPassword');
  if (savedPassword) {
    // Verify the saved password is still valid
    try {
      await adminLogin(savedPassword);
      adminPassword.value = savedPassword;
      isAuthenticated.value = true;
      loadData();
    } catch (err) {
      // Saved password is invalid, clear it
      sessionStorage.removeItem('adminPassword');
      isAuthenticated.value = false;
    }
  }
});

// Login
async function handleLogin() {
  if (!password.value) return;
  
  loginLoading.value = true;
  loginError.value = '';
  
  try {
    await adminLogin(password.value);
    adminPassword.value = password.value;
    sessionStorage.setItem('adminPassword', password.value);
    isAuthenticated.value = true;
    password.value = '';
    loadData();
  } catch (err) {
    loginError.value = err.response?.data?.error || 'Invalid password';
  } finally {
    loginLoading.value = false;
  }
}

// Logout
function handleLogout() {
  sessionStorage.removeItem('adminPassword');
  isAuthenticated.value = false;
  adminPassword.value = '';
  settings.value = {};
  students.value = [];
}

// Load all data
async function loadData() {
  loading.value = true;
  error.value = null;
  
  try {
    const [settingsData, studentsData] = await Promise.all([
      getAdminSettings(adminPassword.value),
      getAdminStudents(adminPassword.value)
    ]);
    settings.value = settingsData;
    students.value = studentsData;
    newQuestionCount.value = settingsData.question_count || '8';
  } catch (err) {
    if (err.response?.status === 401) {
      handleLogout();
      loginError.value = 'Session expired. Please login again.';
    } else {
      error.value = err.message || 'Failed to load data';
    }
  } finally {
    loading.value = false;
  }
}

// Update question count
async function saveQuestionCount() {
  try {
    await updateAdminSetting(adminPassword.value, 'question_count', newQuestionCount.value);
    settings.value.question_count = newQuestionCount.value;
    editingQuestionCount.value = false;
  } catch (err) {
    error.value = 'Failed to update setting';
  }
}

// View student report
async function viewStudentReport(student) {
  selectedStudent.value = student;
  reportLoading.value = true;
  studentReport.value = null;
  
  try {
    studentReport.value = await getAdminStudentReport(adminPassword.value, student.userId);
  } catch (err) {
    error.value = 'Failed to load student report';
  } finally {
    reportLoading.value = false;
  }
}

// Download PDF
async function downloadPDF(student) {
  try {
    await downloadStudentPDF(adminPassword.value, student.userId);
  } catch (err) {
    error.value = 'Failed to download PDF';
  }
}

// Close report modal
function closeReport() {
  selectedStudent.value = null;
  studentReport.value = null;
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const formatted = new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${formatted} IST`;
}

// Get student display name
function getStudentName(student) {
  if (student.name) return student.name;
  if (student.email) {
    // Capitalize email username as fallback
    const username = student.email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  return `Student ${student.userId.slice(0, 8)}...`;
}
</script>

<template>
  <div class="admin-panel">
    <!-- Login Screen -->
    <div v-if="!isAuthenticated" class="login-screen">
      <div class="login-card">
        <div class="login-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h1>Admin Panel</h1>
          <p>Enter password to access the admin dashboard</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <input
              type="password"
              v-model="password"
              placeholder="Enter admin password"
              :disabled="loginLoading"
            />
          </div>
          
          <div class="error-text" v-if="loginError">{{ loginError }}</div>
          
          <button type="submit" class="login-btn" :disabled="loginLoading || !password">
            {{ loginLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
        
        <button class="back-link" @click="$emit('back')">
          ← Back to Chat
        </button>
      </div>
    </div>
    
    <!-- Admin Dashboard -->
    <div v-else class="dashboard">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-left">
          <h1>Admin Dashboard</h1>
        </div>
        <div class="header-right">
          <button class="btn-secondary" @click="loadData" :disabled="loading">
            🔄 Refresh
          </button>
          <button class="btn-secondary" @click="$emit('back')">
            ← Back to Chat
          </button>
          <button class="btn-logout" @click="handleLogout">
            Logout
          </button>
        </div>
      </header>
      
      <!-- Error -->
      <div class="error-banner" v-if="error">
        {{ error }}
        <button @click="error = null">✕</button>
      </div>
      
      <!-- Loading -->
      <div class="loading-state" v-if="loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
      
      <!-- Content -->
      <div class="dashboard-content" v-else>
        <!-- Settings Section -->
        <section class="settings-section">
          <h2>⚙️ Interview Settings</h2>
          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <label>Number of Questions</label>
                <p>How many questions the AI will ask before concluding the interview</p>
              </div>
              <div class="setting-value">
                <template v-if="editingQuestionCount">
                  <input 
                    type="number" 
                    v-model="newQuestionCount" 
                    min="3" 
                    max="20"
                    class="setting-input"
                  />
                  <button class="btn-save" @click="saveQuestionCount">Save</button>
                  <button class="btn-cancel" @click="editingQuestionCount = false">Cancel</button>
                </template>
                <template v-else>
                  <span class="value">{{ settings.question_count || 8 }}</span>
                  <button class="btn-edit" @click="editingQuestionCount = true">Edit</button>
                </template>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Students Section -->
        <section class="students-section">
          <h2>👨‍🎓 Students ({{ students.length }})</h2>
          
          <div class="students-table-wrapper" v-if="students.length > 0">
            <table class="students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Sessions</th>
                  <th>Messages</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in students" :key="student.userId">
                  <td class="student-name">
                    <div class="avatar">{{ (student.name || student.email || 'S')[0].toUpperCase() }}</div>
                    {{ getStudentName(student) }}
                  </td>
                  <td class="student-email">{{ student.email || '-' }}</td>
                  <td>{{ student.totalConversations }}</td>
                  <td>{{ student.totalMessages }}</td>
                  <td>{{ formatDate(student.lastActive) }}</td>
                  <td class="actions">
                    <button class="btn-view" @click="viewStudentReport(student)">
                      📋 View Report
                    </button>
                    <button class="btn-download" @click="downloadPDF(student)">
                      📥 PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="empty-state" v-else>
            <p>No students have completed interviews yet.</p>
          </div>
        </section>
      </div>
    </div>
    
    <!-- Report Modal -->
    <div class="report-modal-overlay" v-if="selectedStudent" @click.self="closeReport">
      <div class="report-modal">
        <div class="modal-header">
          <h2>Student Report: {{ getStudentName(selectedStudent) }}</h2>
          <button class="close-btn" @click="closeReport">✕</button>
        </div>
        
        <div class="modal-body" v-if="reportLoading">
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading report...</p>
          </div>
        </div>
        
        <div class="modal-body" v-else-if="studentReport">
          <div class="report-content">
            <!-- Profile -->
            <div class="report-section" v-if="studentReport.reportCard?.studentProfile">
              <h3>👤 Profile</h3>
              <div class="profile-grid">
                <div v-if="studentReport.reportCard.studentProfile.name">
                  <strong>Name:</strong> {{ studentReport.reportCard.studentProfile.name }}
                </div>
                <div v-if="studentReport.reportCard.studentProfile.age">
                  <strong>Age:</strong> {{ studentReport.reportCard.studentProfile.age }}
                </div>
                <div v-if="studentReport.reportCard.studentProfile.educationLevel">
                  <strong>Education:</strong> {{ studentReport.reportCard.studentProfile.educationLevel }}
                </div>
                <div v-if="studentReport.reportCard.studentProfile.institution">
                  <strong>Institution:</strong> {{ studentReport.reportCard.studentProfile.institution }}
                </div>
              </div>
            </div>
            
            <!-- Summary -->
            <div class="report-section" v-if="studentReport.reportCard?.overallSummary">
              <h3>📝 Summary</h3>
              <p class="summary-text">{{ studentReport.reportCard.overallSummary }}</p>
            </div>
            
            <!-- Strengths -->
            <div class="report-section" v-if="studentReport.reportCard?.strengths?.length">
              <h3>💪 Strengths</h3>
              <ul class="tag-list green">
                <li v-for="s in studentReport.reportCard.strengths" :key="s">{{ s }}</li>
              </ul>
            </div>
            
            <!-- Growth Areas -->
            <div class="report-section" v-if="studentReport.reportCard?.growthAreas?.length">
              <h3>🌱 Growth Areas</h3>
              <ul class="tag-list orange">
                <li v-for="g in studentReport.reportCard.growthAreas" :key="g">{{ g }}</li>
              </ul>
            </div>
            
            <!-- Recommendations -->
            <div class="report-section" v-if="studentReport.reportCard?.recommendations?.length">
              <h3>💡 Recommendations</h3>
              <ol class="recommendations-list">
                <li v-for="r in studentReport.reportCard.recommendations" :key="r">{{ r }}</li>
              </ol>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn-download-large" @click="downloadPDF(selectedStudent)">
              📥 Download PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-panel {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #e2e8f0;
}

/* Login Screen */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-header {
  margin-bottom: 32px;
}

.login-header svg {
  color: #6366f1;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.login-header p {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
}

.input-group input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.error-text {
  color: #f87171;
  font-size: 14px;
}

.login-btn {
  padding: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-link {
  margin-top: 24px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
}

.back-link:hover {
  color: #e2e8f0;
}

/* Dashboard */
.dashboard {
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dashboard-header h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-logout {
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.2);
}

.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px;
  background: rgba(239, 68, 68, 0.1);
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.error-banner button {
  background: none;
  border: none;
  color: #fca5a5;
  cursor: pointer;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
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

.dashboard-content {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Settings Section */
.settings-section {
  margin-bottom: 40px;
}

.settings-section h2,
.students-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.settings-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.setting-info label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}

.setting-info p {
  color: #94a3b8;
  font-size: 13px;
  margin: 0;
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-value .value {
  font-size: 24px;
  font-weight: 700;
  color: #6366f1;
}

.setting-input {
  width: 80px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 16px;
}

.btn-edit, .btn-save, .btn-cancel {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.btn-save {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}

/* Students Section */
.students-table-wrapper {
  overflow-x: auto;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  overflow: hidden;
}

.students-table th,
.students-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.students-table th {
  background: rgba(255, 255, 255, 0.03);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
}

.students-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.student-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-email {
  color: #94a3b8;
  font-size: 13px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-view, .btn-download {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.btn-view:hover {
  background: rgba(99, 102, 241, 0.2);
}

.btn-download {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #86efac;
}

.btn-download:hover {
  background: rgba(34, 197, 94, 0.2);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
}

/* Report Modal */
.report-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.report-modal {
  background: linear-gradient(165deg, #1a1f35 0%, #0d1117 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
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
  font-size: 18px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.report-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.report-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0 0 12px 0;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.profile-grid div {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 14px;
}

.summary-text {
  color: #d1fae5;
  line-height: 1.6;
  font-style: italic;
  padding: 16px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  margin: 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.tag-list li {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
}

.tag-list.green li {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
}

.tag-list.orange li {
  background: rgba(251, 191, 36, 0.15);
  color: #fcd34d;
}

.recommendations-list {
  padding-left: 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommendations-list li {
  color: #e2e8f0;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-download-large {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-right {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .students-table th:nth-child(2),
  .students-table td:nth-child(2),
  .students-table th:nth-child(4),
  .students-table td:nth-child(4) {
    display: none;
  }
  
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>

