# Student Profile Assistant

An AI-powered student interview system that collects student information through conversational interviews and generates comprehensive report cards. Built with Vue.js frontend and Node.js/Express backend, featuring voice input, text-to-speech responses, and an admin dashboard.

---

## 🚀 How to Run

### Prerequisites
- Node.js 18+ installed
- OpenAI API key

### Quick Start (3 Steps)

**Step 1: Setup Backend**
```bash
cd backend
cp .env.example .env
# Edit .env and add your OpenAI API key and admin password
npm install
npm start
```

**Step 2: Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Step 3: Open the App**
- Navigate to `http://localhost:5173` in your browser
- Enter your email to start the interview
- Admin panel: `http://localhost:5173/#/admin` (password required)

---

## ✨ Features

### User Features
- **Email-Based Identification**: Enter your email to start or continue your interview session
- **Voice Input**: Speak your responses using OpenAI Whisper API - transcription appears in text box for review
- **Text Input**: Type your responses with real-time AI interaction
- **AI Voice Responses**: AI speaks its responses aloud (with mute/unmute control)
- **Smart Interview Flow**: AI asks structured questions (configurable count) about education, personality, interests, and goals
- **Student Report Card**: Generates a detailed report card with personality insights, learning style, strengths, and recommendations

### Admin Features
- **Password-Protected Admin Panel**: Secure access to admin dashboard
- **Student Management**: View all students with email, session count, and last active time
- **View Student Reports**: See detailed report cards for any student
- **PDF Download**: Download student reports as PDF documents
- **Configurable Settings**: Adjust the number of interview questions
- **IST Time Display**: All timestamps shown in Indian Standard Time

---

## 🏗️ Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│    Vue.js Frontend      │────▶│    Express Backend      │
│                         │     │                         │
│  - Email Login          │     │  - Chat API             │
│  - Voice Input (Whisper)│     │  - Report Card API      │
│  - Text-to-Speech       │     │  - Admin API            │
│  - Chat Interface       │     │  - Transcription API    │
│  - Report Card UI       │     │  - OpenAI Integration   │
│  - Admin Dashboard      │     │  - SQLite Database      │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 📖 How It Works

### User Flow

1. **Enter Email**: Users enter their email to start or continue their session
2. **Interview**: AI conducts a friendly interview covering:
   - Basic Information (name, age, education)
   - Academic Profile (subjects, goals)
   - Personality & Interests
   - Learning Style
   - Goals & Aspirations
3. **Voice/Text Input**: Users can speak (transcribed by Whisper) or type responses
4. **AI Speaks**: Responses are spoken aloud (can be muted)
5. **Report Card**: After completing the interview, view your personalized report card

### Admin Flow

1. Navigate to `/#/admin` or click "Admin" button
2. Enter admin password (set in `.env` file)
3. View all students and their interview data
4. Download PDF reports for any student
5. Configure interview settings

---

## 🔌 API Documentation

### POST /api/chat/start
Start a session with email identification.

```json
// Request
{ "email": "student@example.com" }

// Response
{
  "userId": "uuid",
  "email": "student@example.com",
  "name": "John",
  "isNewUser": false,
  "questionCount": 8
}
```

### POST /api/chat
Send a message and receive an AI response.

```json
// Request
{
  "userId": "user-123",
  "message": "My name is John",
  "conversationId": "optional-conversation-id"
}

// Response
{
  "response": "Nice to meet you, John! What grade are you in?",
  "conversationId": "conv-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "questionProgress": { "current": 1, "total": 8 }
}
```

### POST /api/transcribe
Transcribe audio using OpenAI Whisper.

```json
// Request
{ "audio": "base64-encoded-audio-data" }

// Response
{ "text": "Transcribed text here" }
```

### GET /api/report/:userId
Get a comprehensive student report card.

### Admin Endpoints (requires `X-Admin-Password` header)
- `POST /api/admin/login` - Verify admin password
- `GET /api/admin/settings` - Get all settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/students` - List all students
- `GET /api/admin/students/:userId/report` - Get student report
- `GET /api/admin/students/:userId/pdf` - Download PDF report

---

## ⚙️ Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `ADMIN_PASSWORD` | Admin panel password | Required |
| `PORT` | Server port | 3000 |
| `DATABASE_PATH` | SQLite database path | ./database.sqlite |

### Example .env file
```
OPENAI_API_KEY=sk-your-openai-api-key
ADMIN_PASSWORD=your-secure-password
PORT=3000
DATABASE_PATH=./database.sqlite
```

---

## 📁 Project Structure

```
edmo_project/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── database.js            # SQLite database setup & operations
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   │   ├── chat.js            # Chat API endpoints
│   │   ├── report.js          # Report Card API endpoints
│   │   ├── admin.js           # Admin API endpoints
│   │   └── transcribe.js      # Whisper transcription endpoint
│   └── services/
│       └── openai.js          # OpenAI integration
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.vue            # Main app with chat interface
│       ├── components/
│       │   ├── ChatMessage.vue     # Message bubble
│       │   ├── TextInput.vue       # Text input
│       │   ├── VoiceInput.vue      # Voice recording (Whisper)
│       │   └── ReportModal.vue     # Report card modal
│       ├── views/
│       │   └── AdminPanel.vue      # Admin dashboard
│       └── services/
│           └── api.js              # Backend API client
│
├── README.md
└── .gitignore
```

---

## 🛠️ Technologies Used

### Backend
- **Node.js + Express** - Server framework
- **sql.js** - SQLite database (pure JavaScript)
- **OpenAI API** - GPT-4 for chat, Whisper for transcription
- **PDFKit** - PDF generation

### Frontend
- **Vue.js 3** - Composition API
- **Vite** - Build tool
- **Axios** - HTTP client
- **Web Speech API** - Text-to-speech for AI responses

---

## 🌐 Browser Support

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Voice Input (Whisper) | ✅ | ✅ | ✅ | ✅ |
| Text-to-Speech | ✅ | ✅ | ✅ | ✅ |
| Full Support | ✅ | ✅ | ✅ | ✅ |

*Voice input now uses OpenAI Whisper API (server-side), so it works in all browsers!*

---

## 📄 License

MIT
