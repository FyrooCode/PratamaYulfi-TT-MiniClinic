const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const db = require('./config/db');
const { sendSuccess } = require('./utils/response');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed Origins for CORS with Credentials (Cookies)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

// Core Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);

// 404 and Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server
if (require.main === module) {
  const server = app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`Mini Clinic Backend Server running on port ${PORT}`);
    console.log(`Health Check URL: http://localhost:${PORT}/api/health`);
    console.log(`Auth Endpoints:   http://localhost:${PORT}/api/auth`);
    console.log(`Patient Endpoints:http://localhost:${PORT}/api/patients`);
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
}

module.exports = app;