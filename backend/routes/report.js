const express = require('express');
const { userOperations, conversationOperations, messageOperations } = require('../database');
const { generateConversationSummary } = require('../services/openai');

const router = express.Router();

/**
 * GET /api/report/:userId
 * Get consolidated user report with conversation history and AI summary
 * 
 * Response:
 * {
 *   userId: string,
 *   conversations: Array<{
 *     conversationId: string,
 *     startedAt: string,
 *     endedAt: string | null,
 *     messageCount: number,
 *     messages: Array<{
 *       role: string,
 *       content: string,
 *       timestamp: string
 *     }>
 *   }>,
 *   totalMessages: number,
 *   totalConversations: number,
 *   aiSummary: string,
 *   generatedAt: string
 * }
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = userOperations.get.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'No user found with the specified userId'
      });
    }

    // Get all conversations for the user
    const conversations = conversationOperations.getByUser.all(userId);

    // Get all messages for each conversation
    const conversationsWithMessages = conversations.map(conv => {
      const messages = messageOperations.getByConversation.all(conv.conversation_id);
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

    // Get all messages for summary generation
    const allMessages = messageOperations.getByUser.all(userId);
    const totalMessages = allMessages.length;

    // Generate AI summary
    let aiSummary = 'No conversations to summarize.';
    if (allMessages.length > 0) {
      aiSummary = await generateConversationSummary(allMessages);
    }

    res.json({
      userId,
      userCreatedAt: user.created_at,
      conversations: conversationsWithMessages,
      totalConversations: conversations.length,
      totalMessages,
      aiSummary,
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
 * Get only the AI summary without full conversation history
 */
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = userOperations.get.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get all messages for summary
    const allMessages = messageOperations.getByUser.all(userId);

    let aiSummary = 'No conversations to summarize.';
    if (allMessages.length > 0) {
      aiSummary = await generateConversationSummary(allMessages);
    }

    res.json({
      userId,
      totalMessages: allMessages.length,
      aiSummary,
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

