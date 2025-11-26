# AI Conversation System

A full-stack AI conversation system with voice and text input, built with Vue.js frontend and Node.js/Express backend. Features OpenAI-powered conversations with context persistence and comprehensive user reporting.

## Features

- **Voice Input**: Browser-based speech recognition using Web Speech API
- **Text Input**: Standard text messaging with real-time AI responses
- **Context Persistence**: Conversations are stored in SQLite and context is maintained across messages
- **User Reports**: Consolidated reports with conversation history and AI-generated summaries
- **Modern UI**: Beautiful, responsive chat interface with dark theme

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Vue.js Frontend   │────▶│  Express Backend    │
│                     │     │                     │
│  - Voice Input      │     │  - Chat API         │
│  - Text Input       │     │  - Report API       │
│  - Chat Display     │     │  - OpenAI Service   │
│  - Report Modal     │     │  - SQLite Database  │
└─────────────────────┘     └─────────────────────┘
```

## Prerequisites

- Node.js 18+ installed
- OpenAI API key

## Quick Start

### 1. Clone and Setup Backend

```bash
cd backend

# Copy environment file and add your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

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

Navigate to `http://localhost:5173` in your browser (Chrome recommended for voice support).

## API Documentation

### POST /api/chat

Send a message and receive an AI response.

**Request:**
```json
{
  "userId": "user-123",
  "message": "Hello, how are you?",
  "conversationId": "optional-conversation-id"
}
```

**Response:**
```json
{
  "response": "Hello! I'm doing great, thank you for asking. How can I help you today?",
  "conversationId": "conv-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/chat/history/:conversationId

Get the full history of a conversation.

**Response:**
```json
{
  "conversationId": "conv-abc123",
  "userId": "user-123",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "messages": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "Hello!",
      "timestamp": "2024-01-15T10:00:01.000Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "Hello! How can I help you?",
      "timestamp": "2024-01-15T10:00:02.000Z"
    }
  ]
}
```

### GET /api/report/:userId

Get a comprehensive user report with all conversations and an AI-generated summary.

**Response:**
```json
{
  "userId": "user-123",
  "userCreatedAt": "2024-01-15T09:00:00.000Z",
  "conversations": [
    {
      "conversationId": "conv-abc123",
      "startedAt": "2024-01-15T10:00:00.000Z",
      "endedAt": null,
      "messageCount": 10,
      "messages": [...]
    }
  ],
  "totalConversations": 1,
  "totalMessages": 10,
  "aiSummary": "The user engaged in a productive conversation about...",
  "generatedAt": "2024-01-15T11:00:00.000Z"
}
```

### GET /api/report/:userId/summary

Get only the AI summary without full conversation history.

**Response:**
```json
{
  "userId": "user-123",
  "totalMessages": 10,
  "aiSummary": "The user engaged in a productive conversation about...",
  "generatedAt": "2024-01-15T11:00:00.000Z"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

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
│   │   └── report.js       # Report API endpoints
│   └── services/
│       └── openai.js       # OpenAI integration
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.vue         # Main application component
│       ├── main.js
│       ├── components/
│       │   ├── ChatMessage.vue    # Message bubble component
│       │   ├── TextInput.vue      # Text input with send button
│       │   ├── VoiceInput.vue     # Voice recording button
│       │   └── ReportModal.vue    # Report display modal
│       └── services/
│           ├── api.js             # Backend API client
│           └── speechRecognition.js # Web Speech API wrapper
│
├── README.md
└── .gitignore
```

## Voice Input Support

Voice input uses the Web Speech API which is supported in:
- Chrome (recommended)
- Edge
- Safari (partial support)

Firefox does not support the Web Speech API for speech recognition.

## Technologies Used

### Backend
- Node.js + Express
- sql.js (SQLite in JavaScript)
- OpenAI API (GPT-3.5-turbo)
- UUID for ID generation

### Frontend
- Vue.js 3 (Composition API)
- Vite
- Axios for HTTP requests
- Web Speech API for voice input

## Development

### Running in Development Mode

**Backend:**
```bash
cd backend
npm run dev  # Uses Node.js --watch for auto-reload
```

**Frontend:**
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Building for Production

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`.

## Troubleshooting

### "Microphone access denied"
- Ensure you're using HTTPS or localhost
- Check browser permissions for microphone access

### "Speech recognition not supported"
- Use Chrome or Edge browser
- Make sure you're not in incognito mode

### Backend connection errors
- Ensure backend is running on port 3000
- Check CORS settings if using a different port

## License

MIT

