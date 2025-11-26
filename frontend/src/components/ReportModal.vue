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

const reportCard = computed(() => props.report?.reportCard || null);
const studentProfile = computed(() => reportCard.value?.studentProfile || null);
const learningProfile = computed(() => reportCard.value?.learningProfile || null);
const goals = computed(() => reportCard.value?.goals || null);

function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Learning style icon mapping
const learningStyleIcons = {
  visual: '👁️',
  auditory: '👂',
  kinesthetic: '🤸',
  'reading-writing': '📖',
  mixed: '🎯'
};

function getLearningStyleIcon(style) {
  if (!style) return '📚';
  const lower = style.toLowerCase();
  for (const [key, icon] of Object.entries(learningStyleIcons)) {
    if (lower.includes(key)) return icon;
  }
  return '📚';
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <h2>Student Report Card</h2>
        </div>
        <button class="close-button" @click="$emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" x2="6" y1="6" y2="18"/>
            <line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>
      </div>
      
      <!-- Loading State -->
      <div class="modal-body" v-if="loading">
        <div class="loading-state">
          <div class="loading-spinner">
            <div class="spinner"></div>
          </div>
          <p>Generating your report card...</p>
          <span class="loading-sub">Analyzing conversation and creating insights</span>
        </div>
      </div>
      
      <!-- Report Card Content -->
      <div class="modal-body" v-else-if="report && reportCard">
        
        <!-- Student Profile Header -->
        <div class="profile-header">
          <div class="avatar">
            <span>{{ studentProfile?.name?.[0]?.toUpperCase() || '?' }}</span>
          </div>
          <div class="profile-info">
            <h3 class="student-name">{{ studentProfile?.name || 'Student' }}</h3>
            <div class="profile-details">
              <span v-if="studentProfile?.educationLevel" class="detail-badge">
                🎓 {{ studentProfile.educationLevel }}
              </span>
              <span v-if="studentProfile?.institution" class="detail-badge">
                🏫 {{ studentProfile.institution }}
              </span>
              <span v-if="studentProfile?.age" class="detail-badge">
                📅 {{ studentProfile.age }} years old
              </span>
            </div>
          </div>
        </div>

        <!-- Overall Summary -->
        <div class="summary-card" v-if="reportCard.overallSummary">
          <div class="summary-content">
            <p>{{ reportCard.overallSummary }}</p>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-icon">💬</span>
            <span class="stat-value">{{ report.totalMessages || 0 }}</span>
            <span class="stat-label">Messages</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">📝</span>
            <span class="stat-value">{{ report.totalConversations || 0 }}</span>
            <span class="stat-label">Sessions</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">{{ getLearningStyleIcon(learningProfile?.preferredStyle) }}</span>
            <span class="stat-value">{{ learningProfile?.preferredStyle || 'TBD' }}</span>
            <span class="stat-label">Learning Style</span>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div class="two-columns">
          
          <!-- Left Column -->
          <div class="column">
            
            <!-- Strengths -->
            <div class="section-card strengths" v-if="reportCard.strengths?.length">
              <h4 class="section-title">
                <span class="title-icon">💪</span>
                Strengths
              </h4>
              <ul class="tag-list">
                <li v-for="(strength, idx) in reportCard.strengths" :key="idx" class="tag strength-tag">
                  {{ strength }}
                </li>
              </ul>
            </div>

            <!-- Interests -->
            <div class="section-card interests" v-if="reportCard.interests?.length">
              <h4 class="section-title">
                <span class="title-icon">⭐</span>
                Interests & Hobbies
              </h4>
              <ul class="tag-list">
                <li v-for="(interest, idx) in reportCard.interests" :key="idx" class="tag interest-tag">
                  {{ interest }}
                </li>
              </ul>
            </div>

            <!-- Favorite Subjects -->
            <div class="section-card subjects" v-if="studentProfile?.favoriteSubjects?.length">
              <h4 class="section-title">
                <span class="title-icon">📚</span>
                Favorite Subjects
              </h4>
              <ul class="tag-list">
                <li v-for="(subject, idx) in studentProfile.favoriteSubjects" :key="idx" class="tag subject-tag">
                  {{ subject }}
                </li>
              </ul>
            </div>
            
          </div>

          <!-- Right Column -->
          <div class="column">
            
            <!-- Personality Insights -->
            <div class="section-card personality" v-if="reportCard.personalityInsights?.length">
              <h4 class="section-title">
                <span class="title-icon">🧠</span>
                Personality Insights
              </h4>
              <ul class="insight-list">
                <li v-for="(insight, idx) in reportCard.personalityInsights" :key="idx">
                  {{ insight }}
                </li>
              </ul>
            </div>

            <!-- Growth Areas -->
            <div class="section-card growth" v-if="reportCard.growthAreas?.length">
              <h4 class="section-title">
                <span class="title-icon">🌱</span>
                Growth Areas
              </h4>
              <ul class="insight-list growth-list">
                <li v-for="(area, idx) in reportCard.growthAreas" :key="idx">
                  {{ area }}
                </li>
              </ul>
            </div>
            
          </div>
        </div>

        <!-- Learning Profile -->
        <div class="section-card learning-section" v-if="learningProfile">
          <h4 class="section-title">
            <span class="title-icon">📖</span>
            Learning Profile
          </h4>
          <div class="learning-grid">
            <div class="learning-item" v-if="learningProfile.studyPreferences">
              <span class="learning-label">Study Preferences</span>
              <span class="learning-value">{{ learningProfile.studyPreferences }}</span>
            </div>
            <div class="learning-item" v-if="learningProfile.idealEnvironment">
              <span class="learning-label">Ideal Environment</span>
              <span class="learning-value">{{ learningProfile.idealEnvironment }}</span>
            </div>
            <div class="learning-item" v-if="learningProfile.timeManagement">
              <span class="learning-label">Time Management</span>
              <span class="learning-value">{{ learningProfile.timeManagement }}</span>
            </div>
          </div>
        </div>

        <!-- Goals -->
        <div class="section-card goals-section" v-if="goals && (goals.shortTerm || goals.longTerm || goals.careerAspiration)">
          <h4 class="section-title">
            <span class="title-icon">🎯</span>
            Goals & Aspirations
          </h4>
          <div class="goals-grid">
            <div class="goal-item" v-if="goals.shortTerm">
              <span class="goal-type">Short Term</span>
              <p class="goal-text">{{ goals.shortTerm }}</p>
            </div>
            <div class="goal-item" v-if="goals.longTerm">
              <span class="goal-type">Long Term</span>
              <p class="goal-text">{{ goals.longTerm }}</p>
            </div>
            <div class="goal-item career" v-if="goals.careerAspiration">
              <span class="goal-type">Career Aspiration</span>
              <p class="goal-text">{{ goals.careerAspiration }}</p>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="section-card recommendations" v-if="reportCard.recommendations?.length">
          <h4 class="section-title">
            <span class="title-icon">💡</span>
            Personalized Recommendations
          </h4>
          <ul class="recommendations-list">
            <li v-for="(rec, idx) in reportCard.recommendations" :key="idx">
              <span class="rec-number">{{ idx + 1 }}</span>
              <span class="rec-text">{{ rec }}</span>
            </li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="report-footer">
          <span>Generated on {{ formatDate(report.generatedAt) }}</span>
        </div>
        
      </div>
      
      <!-- No Data State -->
      <div class="modal-body" v-else>
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No Report Available</h3>
          <p>Start a conversation with the AI to build your student profile and generate your report card!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
  padding: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(165deg, #1a1f35 0%, #0d1117 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 24px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.05),
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 100px rgba(99, 102, 241, 0.1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #a5b4fc;
}

.header-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s;
}

.close-button:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 3px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #f1f5f9;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.loading-sub {
  color: #64748b;
  font-size: 14px;
}

/* Profile Header */
.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.avatar {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.profile-info {
  flex: 1;
}

.student-name {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
}

.profile-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 13px;
  color: #cbd5e1;
}

/* Summary Card */
.summary-card {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.summary-content p {
  margin: 0;
  color: #d1fae5;
  font-size: 15px;
  line-height: 1.7;
  font-style: italic;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #f1f5f9;
  text-transform: capitalize;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Two Columns */
.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Section Cards */
.section-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 18px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px 0;
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.title-icon {
  font-size: 16px;
}

/* Tags */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.strength-tag {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.interest-tag {
  background: rgba(251, 191, 36, 0.15);
  color: #fcd34d;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.subject-tag {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

/* Insight Lists */
.insight-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.insight-list li {
  padding-left: 16px;
  position: relative;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.5;
}

.insight-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #6366f1;
  font-weight: bold;
}

.growth-list li::before {
  color: #f59e0b;
}

/* Learning Section */
.learning-section {
  margin-bottom: 16px;
}

.learning-grid {
  display: grid;
  gap: 12px;
}

.learning-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.learning-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.learning-value {
  font-size: 14px;
  color: #e2e8f0;
}

/* Goals Section */
.goals-section {
  margin-bottom: 16px;
}

.goals-grid {
  display: grid;
  gap: 14px;
}

.goal-item {
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border-left: 3px solid #6366f1;
}

.goal-item.career {
  border-left-color: #f59e0b;
}

.goal-type {
  display: block;
  font-size: 11px;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  font-weight: 600;
}

.goal-item.career .goal-type {
  color: #f59e0b;
}

.goal-text {
  margin: 0;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.5;
}

/* Recommendations */
.recommendations {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-color: rgba(99, 102, 241, 0.2);
}

.recommendations-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendations-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.rec-number {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.rec-text {
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.5;
}

/* Footer */
.report-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  color: #475569;
  font-size: 12px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #f1f5f9;
  font-size: 20px;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  max-width: 300px;
}

/* Responsive */
@media (max-width: 700px) {
  .modal-content {
    max-height: 95vh;
    border-radius: 16px;
  }
  
  .two-columns {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-details {
    justify-content: center;
  }
}
</style>
