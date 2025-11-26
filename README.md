# Student Profile Assistant

An AI-powered student interview system that collects student information through conversational interviews and generates comprehensive report cards. Built with Vue.js frontend and Node.js/Express backend, featuring voice and text input capabilities.

## Features

- **Voice Input**: Speak your responses using the microphone button - transcription appears in the text box for review before sending
- **Text Input**: Type your responses with real-time AI interaction
- **Smart Interview Flow**: AI asks structured questions about education, personality, interests, learning style, and goals
- **Student Report Card**: Generates a detailed report card with:
  - Student profile (name, education, institution)
  - Personality insights
  - Learning profile and style
  - Strengths and growth areas
  - Interests and hobbies
  - Short-term and long-term goals
  - Personalized recommendations
- **Context Persistence**: All conversations are stored and context is maintained

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Vue.js Frontend   │────▶│  Express Backend    │
│                     │     │                     │
│  - Voice Input      │     │  - Chat API         │
│  - Text Input       │     │  - Report Card API  │
│  - Chat Interface   │     │  - OpenAI Service   │
│  - Report Card UI   │     │  - SQLite Database  │
└─────────────────────┘     └─────────────────────┘
```

## Prerequisites

- Node.js 18+ installed
- OpenAI API key

## Quick Start

### 1. Setup Backend

```bash
cd backend

# Copy environment file and add your OpenAI API key
cp .env.example .env
# Edit .env and replace 'your_openai_api_key_here' with your actual key

# Install dependencies
npm install

# Start the server
npm start
```

The backend will start on `http://localhost:3000`

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 3. Open the Application

Navigate to `http://localhost:5173` in Chrome (recommended for voice support).

## How It Works

### Interview Flow

The AI conducts a friendly, conversational interview covering:

1. **Basic Information**: Name, age, education level, school/college
2. **Academic Profile**: Favorite subjects, challenging subjects, academic goals
3. **Personality & Interests**: Hobbies, extracurricular activities, strengths
4. **Learning Style**: Study preferences, ideal environment, time management
5. **Goals & Aspirations**: Short-term goals, long-term dreams, career aspirations

### Voice Input

1. Click the microphone button to start recording
2. Speak your response
3. The transcription appears in the text box
4. Review/edit if needed, then click send

### Report Card Generation

Click "Report Card" to generate a comprehensive student profile including:
- Personality insights extracted from the conversation
- Learning style analysis
- Identified strengths and growth areas
- Personalized recommendations based on the student's profile

## API Documentation

### POST /api/chat

Send a message and receive an AI response.

**Request:**
```json
{
  "userId": "user-123",
  "message": "My name is John",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "response": "Nice to meet you, John! What grade or year are you currently in?",
  "conversationId": "conv-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/report/:userId

Get a comprehensive student report card.

**Response:**
```json
{
  "userId": "user-123",
  "reportCard": {
    "studentProfile": {
      "name": "John",
      "age": "16",
      "educationLevel": "High School",
      "institution": "Lincoln High",
      "favoriteSubjects": ["Math", "Science"],
      "challengingSubjects": ["History"]
    },
    "personalityInsights": ["Curious and eager to learn", "Strong analytical thinking"],
    "learningProfile": {
      "preferredStyle": "Visual",
      "studyPreferences": "Prefers quiet environment with notes",
      "idealEnvironment": "Library or quiet room"
    },
    "strengths": ["Problem-solving", "Mathematics"],
    "growthAreas": ["Public speaking", "Time management"],
    "interests": ["Gaming", "Robotics"],
    "goals": {
      "shortTerm": "Improve grades in History",
      "longTerm": "Become a software engineer",
      "careerAspiration": "Work at a tech company"
    },
    "recommendations": [
      "Consider joining the robotics club",
      "Try visual learning tools for History"
    ],
    "overallSummary": "John is a bright student with strong STEM abilities..."
  },
  "conversations": [...],
  "totalMessages": 24,
  "generatedAt": "2024-01-15T11:00:00.000Z"
}
```

### GET /health

Health check endpoint.

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `PORT` | Server port | 3000 |
| `DATABASE_PATH` | SQLite database file path | ./database.sqlite |

## Project Structure

```
edmo_project/
├── backend/
│   ├── server.js           # Express server entry point
│   ├── database.js         # SQLite database setup & operations
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   │   ├── chat.js         # Chat API endpoints
│   │   └── report.js       # Report Card API endpoints
│   └── services/
│       └── openai.js       # OpenAI integration with interview prompts
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.vue         # Main chat interface
│       ├── components/
│       │   ├── ChatMessage.vue    # Message bubble component
│       │   ├── TextInput.vue      # Text input with send button
│       │   ├── VoiceInput.vue     # Voice recording button
│       │   └── ReportModal.vue    # Student Report Card modal
│       └── services/
│           ├── api.js             # Backend API client
│           └── speechRecognition.js # Web Speech API wrapper
│
├── README.md
└── .gitignore
```

## Technologies Used

### Backend
- Node.js + Express
- sql.js (SQLite in JavaScript)
- OpenAI API (GPT-3.5-turbo)

### Frontend
- Vue.js 3 (Composition API)
- Vite
- Axios
- Web Speech API

## Browser Support

Voice input uses the Web Speech API:
- ✅ Chrome (recommended)
- ✅ Edge
- ⚠️ Safari (partial support)
- ❌ Firefox (not supported)

## License

MIT
