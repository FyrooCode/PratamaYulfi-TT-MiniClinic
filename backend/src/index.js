const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const { sendSuccess } = require('./utils/response');
const healthRoutes = require('./routes/health.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root Welcome Route
app.get('/', (req, res) => {
  return sendSuccess(res, 'Welcome to Mini Clinic Information System API', {
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// API Routes
app.use('/api/health', healthRoutes);

// 404 and Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Mini Clinic Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);

  // Verify Database Connection on startup
  await db.testConnection();
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.pool.end(() => {
      console.log('Database pool has ended');
      process.exit(0);
    });
  });
});

module.exports = app;
