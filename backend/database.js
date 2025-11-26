const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, process.env.DATABASE_PATH || './database.sqlite');

let db = null;

// Initialize database
async function initializeDatabase() {
  const SQL = await initSqlJs();
  
  // Try to load existing database
  try {
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing database');
    } else {
      db = new SQL.Database();
      console.log('Created new database');
    }
  } catch (error) {
    console.log('Creating fresh database');
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      conversation_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
    )
  `);

  // Save to file
  saveDatabase();
  console.log('Database initialized successfully');
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Get database instance
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// User operations
const userOperations = {
  create: (userId) => {
    const stmt = getDb().prepare('INSERT OR IGNORE INTO users (user_id) VALUES (?)');
    stmt.run([userId]);
    stmt.free();
    saveDatabase();
  },
  get: (userId) => {
    const stmt = getDb().prepare('SELECT * FROM users WHERE user_id = ?');
    stmt.bind([userId]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  },
  getAll: () => {
    const results = getDb().exec('SELECT * FROM users');
    return results.length > 0 ? results[0].values.map(row => ({
      user_id: row[0],
      created_at: row[1]
    })) : [];
  }
};

// Conversation operations
const conversationOperations = {
  create: (conversationId, userId) => {
    const stmt = getDb().prepare('INSERT INTO conversations (conversation_id, user_id) VALUES (?, ?)');
    stmt.run([conversationId, userId]);
    stmt.free();
    saveDatabase();
  },
  get: (conversationId) => {
    const stmt = getDb().prepare('SELECT * FROM conversations WHERE conversation_id = ?');
    stmt.bind([conversationId]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  },
  getByUser: (userId) => {
    const results = getDb().exec('SELECT * FROM conversations WHERE user_id = ? ORDER BY started_at DESC', [userId]);
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      conversation_id: row[0],
      user_id: row[1],
      started_at: row[2],
      ended_at: row[3]
    }));
  },
  end: (conversationId) => {
    const stmt = getDb().prepare('UPDATE conversations SET ended_at = datetime("now") WHERE conversation_id = ?');
    stmt.run([conversationId]);
    stmt.free();
    saveDatabase();
  }
};

// Message operations
const messageOperations = {
  create: (messageId, conversationId, role, content) => {
    const stmt = getDb().prepare('INSERT INTO messages (message_id, conversation_id, role, content) VALUES (?, ?, ?, ?)');
    stmt.run([messageId, conversationId, role, content]);
    stmt.free();
    saveDatabase();
  },
  getByConversation: (conversationId) => {
    const results = getDb().exec('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC', [conversationId]);
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      message_id: row[0],
      conversation_id: row[1],
      role: row[2],
      content: row[3],
      timestamp: row[4]
    }));
  },
  getRecentByConversation: (conversationId, limit) => {
    const results = getDb().exec(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT ?', 
      [conversationId, limit]
    );
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      message_id: row[0],
      conversation_id: row[1],
      role: row[2],
      content: row[3],
      timestamp: row[4]
    })).reverse(); // Reverse to get chronological order
  },
  getByUser: (userId) => {
    const results = getDb().exec(`
      SELECT m.*, c.user_id 
      FROM messages m 
      JOIN conversations c ON m.conversation_id = c.conversation_id 
      WHERE c.user_id = ? 
      ORDER BY m.timestamp ASC
    `, [userId]);
    if (results.length === 0) return [];
    return results[0].values.map(row => ({
      message_id: row[0],
      conversation_id: row[1],
      role: row[2],
      content: row[3],
      timestamp: row[4],
      user_id: row[5]
    }));
  }
};

module.exports = {
  initializeDatabase,
  getDb,
  saveDatabase,
  userOperations,
  conversationOperations,
  messageOperations
};
