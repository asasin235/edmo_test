const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are a helpful AI assistant conducting a conversational interview. Your role is to:
1. Engage users in meaningful conversation
2. Ask relevant follow-up questions based on their responses
3. Remember context from the conversation
4. Be friendly, professional, and helpful
5. Guide the conversation naturally while gathering information

Always maintain a conversational tone and show genuine interest in what the user shares.`;

/**
 * Generate a chat response using OpenAI
 * @param {Array} conversationHistory - Array of message objects with role and content
 * @param {string} userMessage - The current user message
 * @returns {Promise<string>} - The AI response
 */
async function generateChatResponse(conversationHistory, userMessage) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages,
    max_tokens: 500,
    temperature: 0.7
  });

  return completion.choices[0].message.content;
}

/**
 * Generate a summary of conversation history
 * @param {Array} allMessages - Array of all message objects
 * @returns {Promise<string>} - The AI-generated summary
 */
async function generateConversationSummary(allMessages) {
  if (allMessages.length === 0) {
    return 'No conversation history available.';
  }

  const conversationText = allMessages
    .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
    .join('\n');

  const summaryPrompt = `Please provide a comprehensive summary of the following conversation. 
Include:
1. Main topics discussed
2. Key information shared by the user
3. Important questions asked and answers given
4. Overall sentiment and engagement level
5. Any action items or follow-ups mentioned

Conversation:
${conversationText}

Please provide a well-structured summary:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are an expert at summarizing conversations. Provide clear, concise, and insightful summaries.' },
      { role: 'user', content: summaryPrompt }
    ],
    max_tokens: 1000,
    temperature: 0.5
  });

  return completion.choices[0].message.content;
}

module.exports = {
  generateChatResponse,
  generateConversationSummary
};

