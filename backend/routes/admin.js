const express = require('express');
const PDFDocument = require('pdfkit');
const { userOperations, conversationOperations, messageOperations, settingsOperations } = require('../database');
const { generateStudentReportCard } = require('../services/openai');

const router = express.Router();

// Get admin password from environment
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * POST /api/admin/login
 * Verify admin password
 */
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

/**
 * Middleware to verify admin password in header
 */
function requireAdmin(req, res, next) {
  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

/**
 * GET /api/admin/settings
 * Get all settings
 */
router.get('/settings', requireAdmin, (req, res) => {
  try {
    const settings = settingsOperations.getAll();
    res.json(settings);
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * PUT /api/admin/settings
 * Update settings
 */
router.put('/settings', requireAdmin, (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value required' });
    }
    
    settingsOperations.set(key, value);
    res.json({ success: true, key, value });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

/**
 * GET /api/admin/students
 * Get all students with stats
 */
router.get('/students', requireAdmin, (req, res) => {
  try {
    const users = userOperations.getAll();
    
    const studentsWithStats = users.map(user => {
      const conversations = conversationOperations.getByUser(user.user_id);
      const messages = messageOperations.getByUser(user.user_id);
      
      // Use name from database, or try to extract from messages
      let studentName = user.name || null;
      if (!studentName) {
        for (const msg of messages) {
          if (msg.role === 'user') {
            // Simple heuristic: look for "my name is" or "I'm" or "I am"
            const content = msg.content.toLowerCase();
            if (content.includes('my name is') || content.includes("i'm ") || content.includes('i am ')) {
              // Extract the next word(s) as potential name
              const nameMatch = msg.content.match(/(?:my name is|i'm|i am)\s+([A-Za-z]+)/i);
              if (nameMatch) {
                studentName = nameMatch[1];
                break;
              }
            }
          }
        }
      }
      
      // Get last message timestamp
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      
      return {
        userId: user.user_id,
        email: user.email,
        name: studentName,
        createdAt: user.created_at,
        totalConversations: conversations.length,
        totalMessages: messages.length,
        lastActive: lastMessage ? lastMessage.timestamp : user.created_at
      };
    });
    
    res.json(studentsWithStats);
  } catch (error) {
    console.error('Students list error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

/**
 * GET /api/admin/students/:userId/report
 * Get full report for a student
 */
router.get('/students/:userId/report', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = userOperations.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const conversations = conversationOperations.getByUser(userId);
    const allMessages = messageOperations.getByUser(userId);
    
    // Generate report card
    let reportCard = {
      studentProfile: null,
      personalityInsights: [],
      learningProfile: null,
      strengths: [],
      growthAreas: [],
      interests: [],
      goals: null,
      recommendations: [],
      overallSummary: 'No conversations to analyze yet.'
    };
    
    if (allMessages.length > 0) {
      reportCard = await generateStudentReportCard(allMessages);
    }
    
    res.json({
      userId,
      userCreatedAt: user.created_at,
      reportCard,
      totalConversations: conversations.length,
      totalMessages: allMessages.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * GET /api/admin/students/:userId/pdf
 * Generate and download PDF report for a student
 */
router.get('/students/:userId/pdf', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = userOperations.get(userId);
    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const allMessages = messageOperations.getByUser(userId);
    
    // Generate report card
    let reportCard = {
      studentProfile: null,
      personalityInsights: [],
      learningProfile: null,
      strengths: [],
      growthAreas: [],
      interests: [],
      goals: null,
      recommendations: [],
      overallSummary: 'No conversations to analyze yet.'
    };
    
    if (allMessages.length > 0) {
      reportCard = await generateStudentReportCard(allMessages);
    }
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    const studentName = reportCard.studentProfile?.name || 'Student';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${studentName}_Report_Card.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // PDF Content
    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#4F46E5')
       .text('Student Report Card', { align: 'center' });
    doc.moveDown(0.5);
    
    // Student Profile
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937')
       .text('Student Profile');
    doc.moveDown(0.3);
    
    doc.fontSize(12).font('Helvetica').fillColor('#374151');
    if (reportCard.studentProfile) {
      const profile = reportCard.studentProfile;
      if (profile.name) doc.text(`Name: ${profile.name}`);
      if (profile.age) doc.text(`Age: ${profile.age}`);
      if (profile.educationLevel) doc.text(`Education Level: ${profile.educationLevel}`);
      if (profile.institution) doc.text(`Institution: ${profile.institution}`);
      if (profile.favoriteSubjects?.length) {
        doc.text(`Favorite Subjects: ${profile.favoriteSubjects.join(', ')}`);
      }
    } else {
      doc.text('Profile information not available');
    }
    doc.moveDown();
    
    // Overall Summary
    if (reportCard.overallSummary) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937')
         .text('Overall Summary');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#374151')
         .text(reportCard.overallSummary, { align: 'justify' });
      doc.moveDown();
    }
    
    // Personality Insights
    if (reportCard.personalityInsights?.length) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937')
         .text('Personality Insights');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      reportCard.personalityInsights.forEach(insight => {
        doc.text(`• ${insight}`);
      });
      doc.moveDown();
    }
    
    // Learning Profile
    if (reportCard.learningProfile) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937')
         .text('Learning Profile');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      const lp = reportCard.learningProfile;
      if (lp.preferredStyle) doc.text(`Preferred Style: ${lp.preferredStyle}`);
      if (lp.studyPreferences) doc.text(`Study Preferences: ${lp.studyPreferences}`);
      if (lp.idealEnvironment) doc.text(`Ideal Environment: ${lp.idealEnvironment}`);
      if (lp.timeManagement) doc.text(`Time Management: ${lp.timeManagement}`);
      doc.moveDown();
    }
    
    // Strengths
    if (reportCard.strengths?.length) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#059669')
         .text('Strengths');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      reportCard.strengths.forEach(strength => {
        doc.text(`✓ ${strength}`);
      });
      doc.moveDown();
    }
    
    // Growth Areas
    if (reportCard.growthAreas?.length) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#D97706')
         .text('Growth Areas');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      reportCard.growthAreas.forEach(area => {
        doc.text(`○ ${area}`);
      });
      doc.moveDown();
    }
    
    // Goals
    if (reportCard.goals) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937')
         .text('Goals & Aspirations');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      if (reportCard.goals.shortTerm) doc.text(`Short Term: ${reportCard.goals.shortTerm}`);
      if (reportCard.goals.longTerm) doc.text(`Long Term: ${reportCard.goals.longTerm}`);
      if (reportCard.goals.careerAspiration) doc.text(`Career Aspiration: ${reportCard.goals.careerAspiration}`);
      doc.moveDown();
    }
    
    // Recommendations
    if (reportCard.recommendations?.length) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#4F46E5')
         .text('Recommendations');
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').fillColor('#374151');
      reportCard.recommendations.forEach((rec, idx) => {
        doc.text(`${idx + 1}. ${rec}`);
      });
      doc.moveDown();
    }
    
    // Footer
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica').fillColor('#9CA3AF')
       .text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.text('Student Profile Assistant', { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;

