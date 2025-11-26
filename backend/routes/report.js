const express = require('express');
const { userOperations, conversationOperations, messageOperations } = require('../database');
const { generateStudentReportCard } = require('../services/openai');

const router = express.Router();

/**
 * GET /api/report/:userId
 * Get consolidated student report card with structured data
 * 
 * Response:
 * {
 *   userId: string,
 *   userCreatedAt: string,
 *   reportCard: {
 *     studentProfile: {...},
 *     personalityInsights: [...],
 *     learningProfile: {...},
 *     strengths: [...],
 *     growthAreas: [...],
 *     interests: [...],
 *     goals: {...},
 *     recommendations: [...],
 *     overallSummary: string
 *   },
 *   conversations: Array<{...}>,
 *   totalMessages: number,
 *   totalConversations: number,
 *   generatedAt: string
 * }
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = userOperations.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user found with the specified userId'
      });
    }

    // Get all conversations for the user
    const conversations = conversationOperations.getByUser(userId);

    // Get all messages for each conversation
    const conversationsWithMessages = conversations.map(conv => {
      const messages = messageOperations.getByConversation(conv.conversation_id);
      return {
        conversationId: conv.conversation_id,
        startedAt: conv.started_at,
        endedAt: conv.ended_at,
        messageCount: messages.length,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      };
    });

    // Get all messages for report card generation
    const allMessages = messageOperations.getByUser(userId);
    const totalMessages = allMessages.length;

    // Generate structured student report card
    let reportCard = {
      studentProfile: null,
      personalityInsights: [],
      learningProfile: null,
      strengths: [],
      growthAreas: [],
      interests: [],
      goals: null,
      recommendations: [],
      overallSummary: 'No conversations to analyze yet. Start chatting to build your student profile!'
    };

    if (allMessages.length > 0) {
      reportCard = await generateStudentReportCard(allMessages);
    }

    res.json({
      userId,
      userCreatedAt: user.created_at,
      reportCard,
      conversations: conversationsWithMessages,
      totalConversations: conversations.length,
      totalMessages,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/report/:userId/summary
 * Get only the report card summary without full conversation history
 */
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = userOperations.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get all messages for report
    const allMessages = messageOperations.getByUser(userId);

    let reportCard = {
      studentProfile: null,
      overallSummary: 'No conversations to analyze yet.'
    };

    if (allMessages.length > 0) {
      reportCard = await generateStudentReportCard(allMessages);
    }

    res.json({
      userId,
      totalMessages: allMessages.length,
      reportCard,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
