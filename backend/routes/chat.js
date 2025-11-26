const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { userOperations, conversationOperations, messageOperations } = require('../database');
const { generateChatResponse } = require('../services/openai');

const router = express.Router();

/**
 * POST /api/chat
 * Handle incoming chat messages
 * 
 * Request body:
 * {
 *   userId: string,
 *   message: string,
 *   conversationId?: string (optional - creates new conversation if not provided)
 * }
 * 
 * Response:
 * {
 *   response: string,
 *   conversationId: string,
 *   timestamp: string
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, message, conversationId } = req.body;

    // Validate required fields
    if (!userId || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'userId and message are required'
      });
    }

    // Ensure user exists
    userOperations.create.run(userId);

    let activeConversationId = conversationId;

    // Create new conversation if not provided
    if (!activeConversationId) {
      activeConversationId = uuidv4();
      conversationOperations.create.run(activeConversationId, userId);
    } else {
      // Verify conversation exists and belongs to user
      const conversation = conversationOperations.get.get(activeConversationId);
      if (!conversation) {
        return res.status(404).json({
          error: 'Conversation not found',
          details: 'The specified conversationId does not exist'
        });
      }
      if (conversation.user_id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          details: 'This conversation does not belong to the specified user'
        });
      }
    }

    // Get conversation history (last 20 messages for context)
    const recentMessages = messageOperations.getRecentByConversation
      .all(activeConversationId, 20)
      .reverse(); // Reverse to get chronological order

    // Generate AI response
    const aiResponse = await generateChatResponse(recentMessages, message);

    // Store user message
    const userMessageId = uuidv4();
    messageOperations.create.run(userMessageId, activeConversationId, 'user', message);

    // Store AI response
    const aiMessageId = uuidv4();
    messageOperations.create.run(aiMessageId, activeConversationId, 'assistant', aiResponse);

    const timestamp = new Date().toISOString();

    res.json({
      response: aiResponse,
      conversationId: activeConversationId,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/chat/history/:conversationId
 * Get conversation history
 */
router.get('/history/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = conversationOperations.get.get(conversationId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    const messages = messageOperations.getByConversation.all(conversationId);

    res.json({
      conversationId,
      userId: conversation.user_id,
      startedAt: conversation.started_at,
      messages: messages.map(msg => ({
        id: msg.message_id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }))
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;

