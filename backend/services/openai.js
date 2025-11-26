const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate the system prompt with dynamic question count
 * @param {number} questionCount - Total questions to ask
 * @param {number} currentQuestionNumber - Current question number (user messages count)
 * @returns {string} - The system prompt
 */
function getSystemPrompt(questionCount = 8, currentQuestionNumber = 0) {
  const remaining = Math.max(0, questionCount - currentQuestionNumber);
  const isNearEnd = remaining <= 2;
  const shouldConclude = remaining <= 0;
  
  let conclusionInstructions = '';
  
  if (shouldConclude) {
    conclusionInstructions = `
## IMPORTANT: CONCLUDE THE INTERVIEW NOW
You have asked all ${questionCount} questions. In your next response:
1. Thank the student warmly for their time and responses
2. Let them know their Student Report Card is now ready
3. Encourage them to click the "Report Card" button to view their personalized profile
4. Wish them well in their educational journey
DO NOT ask any more questions.`;
  } else if (isNearEnd) {
    conclusionInstructions = `
## NOTE: Interview is almost complete
You have ${remaining} question(s) remaining out of ${questionCount}. 
Start wrapping up the interview by asking your final questions about goals or any remaining important topics.`;
  } else {
    conclusionInstructions = `
## Progress: ${currentQuestionNumber}/${questionCount} questions asked
You have ${remaining} questions remaining. Continue the interview naturally.`;
  }

  return `You are a friendly and professional Student Profile Assistant. Your goal is to conduct a conversational interview to learn about the student and create their personalized profile.

## Interview Configuration
- Total questions to ask: ${questionCount}
- Questions asked so far: ${currentQuestionNumber}
- Questions remaining: ${remaining}
${conclusionInstructions}

## Your Interview Flow:

### Phase 1: Basic Information (First few exchanges)
- Start by asking their name (if not already known)
- Ask about their age
- Ask about their current education level (high school, undergraduate, graduate, etc.)
- Ask about their school/college/university name

### Phase 2: Academic Profile
- Ask about their favorite subjects and why
- Ask about subjects they find challenging
- Ask about their academic goals or dream career

### Phase 3: Personality & Interests
- Ask about their hobbies and interests outside academics
- Ask what they do for fun or relaxation
- Ask about any extracurricular activities, clubs, or sports
- Ask about their strengths (what they're good at)
- Ask about areas they'd like to improve

### Phase 4: Learning Style
- Ask how they prefer to study (alone, groups, with music, etc.)
- Ask about their ideal learning environment
- Ask if they prefer reading, watching videos, hands-on activities, or discussions
- Ask about their time management and study habits

### Phase 5: Goals & Aspirations
- Ask about their short-term goals (this year)
- Ask about their long-term goals or dreams
- Ask what motivates them

## Guidelines:
1. Ask ONE question at a time - don't overwhelm with multiple questions
2. Be warm, encouraging, and show genuine interest in their responses
3. Use their name once you know it
4. Acknowledge their answers before moving to the next question
5. If they give brief answers, gently probe for more details
6. Keep the conversation natural and flowing
7. Prioritize the most important questions based on remaining question count
8. Be supportive and positive about their goals and interests

Remember: This is a friendly conversation, not an interrogation. Make the student feel comfortable and valued.`;
}

/**
 * Generate a chat response using OpenAI
 * @param {Array} conversationHistory - Array of message objects with role and content
 * @param {string} userMessage - The current user message
 * @param {number} questionCount - Total questions configured
 * @param {number} currentQuestionNumber - Current question number
 * @returns {Promise<string>} - The AI response
 */
async function generateChatResponse(conversationHistory, userMessage, questionCount = 8, currentQuestionNumber = 0) {
  const systemPrompt = getSystemPrompt(questionCount, currentQuestionNumber);
  
  const messages = [
    { role: 'system', content: systemPrompt },
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
 * Generate a structured student report card from conversation history
 * @param {Array} allMessages - Array of all message objects
 * @returns {Promise<Object>} - The structured report card data
 */
async function generateStudentReportCard(allMessages) {
  if (allMessages.length === 0) {
    return {
      studentProfile: null,
      personalityInsights: [],
      learningProfile: null,
      strengths: [],
      growthAreas: [],
      recommendations: [],
      overallSummary: 'No conversation history available.'
    };
  }

  const conversationText = allMessages
    .map(msg => `${msg.role === 'user' ? 'Student' : 'Interviewer'}: ${msg.content}`)
    .join('\n');

  const reportPrompt = `Analyze the following student interview conversation and extract a detailed student report card in JSON format.

Conversation:
${conversationText}

Please generate a JSON response with the following structure (use null for any information not found in the conversation):

{
  "studentProfile": {
    "name": "student's name or null",
    "age": "age or null",
    "educationLevel": "high school/undergraduate/graduate/etc or null",
    "institution": "school/college name or null",
    "favoriteSubjects": ["list of favorite subjects"],
    "challengingSubjects": ["subjects they find difficult"]
  },
  "personalityInsights": [
    "Key personality trait or characteristic observed",
    "Another insight about their personality"
  ],
  "learningProfile": {
    "preferredStyle": "visual/auditory/kinesthetic/reading-writing or mixed",
    "studyPreferences": "how they prefer to study",
    "idealEnvironment": "their ideal study environment",
    "timeManagement": "their approach to time management"
  },
  "strengths": [
    "Identified strength 1",
    "Identified strength 2"
  ],
  "growthAreas": [
    "Area for improvement 1",
    "Area for improvement 2"
  ],
  "interests": [
    "Hobby or interest 1",
    "Hobby or interest 2"
  ],
  "goals": {
    "shortTerm": "their short-term goals",
    "longTerm": "their long-term goals/dreams",
    "careerAspiration": "career goals if mentioned"
  },
  "recommendations": [
    "Personalized recommendation 1 based on their profile",
    "Personalized recommendation 2",
    "Personalized recommendation 3"
  ],
  "overallSummary": "A warm, encouraging 2-3 sentence summary of the student highlighting their potential"
}

Important: 
- Be encouraging and positive in tone
- Base all insights strictly on what was discussed in the conversation
- If information wasn't discussed, use null or empty arrays
- Make recommendations specific and actionable
- The overall summary should be motivating and highlight their potential

Respond ONLY with the JSON object, no additional text.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { 
        role: 'system', 
        content: 'You are an expert educational counselor who creates insightful student profiles. Always respond with valid JSON only.' 
      },
      { role: 'user', content: reportPrompt }
    ],
    max_tokens: 1500,
    temperature: 0.5
  });

  try {
    const responseText = completion.choices[0].message.content;
    // Try to parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse report card JSON:', error);
    // Return a basic structure with the raw summary if JSON parsing fails
    return {
      studentProfile: null,
      personalityInsights: [],
      learningProfile: null,
      strengths: [],
      growthAreas: [],
      recommendations: [],
      overallSummary: completion.choices[0].message.content
    };
  }
}

/**
 * Generate a simple text summary (kept for backwards compatibility)
 * @param {Array} allMessages - Array of all message objects
 * @returns {Promise<string>} - The AI-generated summary
 */
async function generateConversationSummary(allMessages) {
  const reportCard = await generateStudentReportCard(allMessages);
  return reportCard.overallSummary || 'No summary available.';
}

module.exports = {
  generateChatResponse,
  generateConversationSummary,
  generateStudentReportCard
};
