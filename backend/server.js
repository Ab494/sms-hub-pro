import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/authRoutes.js';
import contactsRoutes from './routes/contactsRoutes.js';
import groupsRoutes from './routes/groupsRoutes.js';
import smsRoutes from './routes/smsRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Import database
import connectDB from './config/db.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - allow multiple origins
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'https://convex-sms.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting - per user
const createUserRateLimiter = () => {
  const users = new Map();
  
  return (req, res, next) => {
    const userId = req.user?._id?.toString() || req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const max = 500; // Limit per user
    
    if (!users.has(userId)) {
      users.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userLimit = users.get(userId);
    
    if (now > userLimit.resetTime) {
      userLimit.count = 1;
      userLimit.resetTime = now + windowMs;
      return next();
    }
    
    if (userLimit.count >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    userLimit.count++;
    next();
  };
};

const userRateLimiter = createUserRateLimiter();

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', globalLimiter);

// Per-user rate limiting for sensitive endpoints
app.use('/api/sms/', userRateLimiter);
app.use('/api/credits/', userRateLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SMS Hub API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Debug endpoint for SMS configuration
app.get('/api/debug/sms', (req, res) => {
  res.json({
    success: true,
    config: {
      hasApiKey: !!process.env.BLESSEDTEXTS_API_KEY,
      hasSender: !!process.env.BLESSEDTEXTS_SENDER,
      defaultSenderId: process.env.DEFAULT_SENDER_ID,
      apiUrl: 'https://sms.blessedtexts.com/api/sms/v1'
    }
  });
});

// Test SMS endpoint (requires auth)
app.post('/api/test/sms', protect, (req, res) => {
  const { phone, message } = req.body;
  
  res.json({
    success: true,
    received: { phone, message },
    user: req.user ? { id: req.user._id, email: req.user.email } : null,
    config: {
      hasApiKey: !!process.env.BLESSEDTEXTS_API_KEY
    }
  });
});

// Test SMS endpoint (for debugging)
app.post('/api/test/sms', (req, res) => {
  console.log('Test SMS request received:', {
    body: req.body,
    headers: req.headers,
    user: req.user ? req.user._id : 'no user'
  });
  res.json({
    success: true,
    received: req.body,
    hasAuth: !!req.user
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   SMS Hub Backend Server                          ║
║   Running on port ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
║                                                   ║
║   API Endpoints:                                  ║
║   - Auth:     /api/auth/*                         ║
║   - Contacts: /api/contacts/*                     ║
║   - Groups:   /api/groups/*                       ║
║   - SMS:      /api/sms/*                          ║
║   - Health:   /api/health                         ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
