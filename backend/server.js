require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database');
const chatRoutes = require('./routes/chat');
const reportRoutes = require('./routes/report');
const transcribeRoutes = require('./routes/transcribe');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Increase body size limit for audio uploads (10MB)
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💬 Chat API: POST http://localhost:${PORT}/api/chat`);
      console.log(`📋 Report API: GET http://localhost:${PORT}/api/report/:userId`);
      console.log(`🎤 Transcribe API: POST http://localhost:${PORT}/api/transcribe`);
      console.log(`👨‍💼 Admin API: http://localhost:${PORT}/api/admin`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
