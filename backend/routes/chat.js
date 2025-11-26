const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { userOperations, conversationOperations, messageOperations, settingsOperations } = require('../database');
const { generateChatResponse } = require('../services/openai');

const router = express.Router();

/**
 * POST /api/chat/start
 * Start a chat session with email identification
 * 
 * Request body:
 * {
 *   email: string
 * }
 * 
 * Response:
 * {
 *   userId: string,
 *   email: string,
 *   name: string | null,
 *   isNewUser: boolean,
 *   questionCount: number
 * }
 */
router.post('/start', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        details: 'Please provide a valid email address'
      });
    }

    // Get or create user by email
    const { user, isNew } = userOperations.createByEmail(email.toLowerCase().trim());

    // Get question count from settings
    const questionCountSetting = settingsOperations.get('question_count');
    const questionCount = parseInt(questionCountSetting) || 8;

    res.json({
      userId: user.user_id,
      email: user.email,
      name: user.name,
      isNewUser: isNew,
      questionCount
    });

  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

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
 *   timestamp: string,
 *   questionProgress: { current: number, total: number }
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

    // Get question count from settings
    const questionCountSetting = settingsOperations.get('question_count');
    const questionCount = parseInt(questionCountSetting) || 8;

    // Verify user exists
    const user = userOperations.get(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        details: 'Please start a session first'
      });
    }

    let activeConversationId = conversationId;

    // Create new conversation if not provided
    if (!activeConversationId) {
      activeConversationId = uuidv4();
      conversationOperations.create(activeConversationId, userId);
    } else {
      // Verify conversation exists and belongs to user
      const conversation = conversationOperations.get(activeConversationId);
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
    const recentMessages = messageOperations.getRecentByConversation(activeConversationId, 20);
    
    // Count user messages (questions answered) - add 1 for current message
    const userMessageCount = recentMessages.filter(m => m.role === 'user').length + 1;

    // Generate AI response with question count context
    const aiResponse = await generateChatResponse(recentMessages, message, questionCount, userMessageCount);

    // Store user message
    const userMessageId = uuidv4();
    messageOperations.create(userMessageId, activeConversationId, 'user', message);

    // Store AI response
    const aiMessageId = uuidv4();
    messageOperations.create(aiMessageId, activeConversationId, 'assistant', aiResponse);

    // Try to extract name from the message if this is early in the conversation
    if (userMessageCount <= 3 && !user.name) {
      // Improved heuristics to extract name
      const namePatterns = [
        /(?:my name is|i'm|i am|call me|this is|it's|its)\s+([A-Za-z]+)/i,
        /(?:name'?s?)\s+([A-Za-z]+)/i,
        /^(?:hi,?\s*)?(?:i'?m?\s+)?([A-Za-z]{2,})[.!]?$/i,  // "Hi, Aatif" or just "Aatif"
        /^([A-Za-z]{2,})(?:\s+here)?[.!]?$/i  // "Aatif here"
      ];
      
      for (const pattern of namePatterns) {
        const match = message.trim().match(pattern);
        if (match && match[1] && match[1].length >= 2) {
          // Capitalize first letter
          const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          userOperations.updateName(userId, name);
          break;
        }
      }
    }

    const timestamp = new Date().toISOString();

    res.json({
      response: aiResponse,
      conversationId: activeConversationId,
      timestamp: timestamp,
      questionProgress: {
        current: userMessageCount,
        total: questionCount
      }
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
    
    const conversation = conversationOperations.get(conversationId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      });
    }

    const messages = messageOperations.getByConversation(conversationId);

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
