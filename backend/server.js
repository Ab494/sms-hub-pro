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

// Import middleware
import { protect } from './middleware/authMiddleware.js';

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
const configuredOrigins = [process.env.CLIENT_URL, process.env.CORS_ORIGINS]
  .filter(Boolean)
  .flatMap((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean));

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'https://sms-hub-convex.onrender.com',
  'https://convex-sms.vercel.app',
  'https://254convexcomltd.africa',
  'https://www.254convexcomltd.africa',
  ...configuredOrigins,
]);

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
  const testMode = process.env.BLESSEDTEXTS_TEST_MODE === 'true';
  res.json({
    success: true,
    config: {
      hasApiKey: !!process.env.BLESSEDTEXTS_API_KEY,
      hasSender: !!process.env.BLESSEDTEXTS_SENDER,
      defaultSenderId: process.env.DEFAULT_SENDER_ID,
      apiUrl: testMode ? 'https://test.blessedtexts.com/api/sms/v1' : 'https://sms.blessedtexts.com/api/sms/v1',
      testMode: testMode,
      nodeEnv: process.env.NODE_ENV,
      clientUrl: process.env.CLIENT_URL
    }
  });
});

// Debug endpoint for all environment variables (remove after debugging)
app.get('/api/debug/env', (req, res) => {
  try {
    const envVars = {};
    const smsVars = ['BLESSEDTEXTS_API_KEY', 'BLESSEDTEXTS_SENDER', 'DEFAULT_SENDER_ID', 'NODE_ENV', 'CLIENT_URL'];

    smsVars.forEach(key => {
      envVars[key] = {
        exists: !!process.env[key],
        value: process.env[key] ? (key.includes('API_KEY') ? '***' + process.env[key].slice(-4) : process.env[key]) : null
      };
    });

    res.json({
      success: true,
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// Debug endpoint for database state
app.get('/api/debug/db', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    const userCount = await db.collection('users').countDocuments();
    const adminUser = await db.collection('users').findOne({ email: 'admin@smshubpro.com' }, { projection: { password: 0 } });
    const settingsCount = await db.collection('platformsettings').countDocuments();

    res.json({
      success: true,
      database: {
        userCount,
        adminUser: adminUser ? {
          email: adminUser.email,
          role: adminUser.role,
          smsBalance: adminUser.smsBalance,
          isActive: adminUser.isActive
        } : null,
        settingsCount,
        collections: await db.listCollections().toArray().then(cols => cols.map(c => c.name))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database debug error',
      error: error.message
    });
  }
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

// Initialize platform settings (temporary endpoint)
app.post('/api/init-platform', async (req, res) => {
  try {
    const db = mongoose.connection.db;

    // Initialize platform settings
    const defaultSettings = [
      { key: 'sms_price_per_unit', value: 0.50, description: 'Price charged to customers per SMS unit', isPublic: true },
      { key: 'sms_cost_per_unit', value: 0.46, description: 'Cost paid to BlessedTexts per SMS unit', isPublic: false },
      { key: 'minimum_credit_purchase', value: 100, description: 'Minimum credits to purchase at once', isPublic: true },
      { key: 'bonus_credits_percent', value: 0, description: 'Bonus credits percentage on purchase', isPublic: true },
      { key: 'default_sender_id', value: 'FERRITE', description: 'Default sender ID for SMS', isPublic: true },
      { key: 'currency', value: 'KES', description: 'Currency for transactions', isPublic: true },
      { key: 'payment_methods', value: ['mpesa', 'bank_transfer'], description: 'Available payment methods', isPublic: true },
      { key: 'business_name', value: 'SMS Hub Pro', description: 'Business name for invoices', isPublic: true },
      { key: 'contact_email', value: 'admin@smshubpro.com', description: 'Contact email', isPublic: true },
      { key: 'contact_phone', value: '+254700000000', description: 'Contact phone', isPublic: true }
    ];

    for (const setting of defaultSettings) {
      await db.collection('platformsettings').updateOne(
        { key: setting.key },
        { $set: setting },
        { upsert: true }
      );
    }

    // Check admin user
    const adminUser = await db.collection('users').findOne({ email: 'admin@smshubpro.com' });

    res.json({
      success: true,
      message: 'Platform settings initialized',
      settingsCount: defaultSettings.length,
      adminUserExists: !!adminUser,
      adminUser: adminUser ? {
        email: adminUser.email,
        role: adminUser.role,
        smsBalance: adminUser.smsBalance
      } : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Initialization failed',
      error: error.message
    });
  }
});

// Update SMS cost (temporary admin endpoint)
app.post('/api/admin/update-sms-cost', async (req, res) => {
  try {
    const { cost } = req.body;

    if (!cost || typeof cost !== 'number' || cost <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid cost per unit is required'
      });
    }

    const db = mongoose.connection.db;
    await db.collection('platformsettings').updateOne(
      { key: 'sms_cost_per_unit' },
      {
        $set: {
          value: cost,
          description: `Cost paid to BlessedTexts per SMS unit (updated to ${cost} KES)`,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `SMS cost updated to ${cost} KES per unit`,
      newCost: cost
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Update failed',
      error: error.message
    });
  }
});

// ============================================================================
// PUBLIC API ENDPOINTS (for external company integration)
// ============================================================================

// Middleware to authenticate external API clients
const authenticateApiClient = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        message: 'Please provide X-API-Key header or Authorization Bearer token'
      });
    }

    // For now, we'll use a simple API key check
    // In production, this should check against a database of API clients
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    const isValidKey = validApiKeys.includes(apiKey);

    if (!isValidKey) {
      return res.status(403).json({
        success: false,
        error: 'Invalid API key',
        message: 'The provided API key is not valid'
      });
    }

    // Mock client info - in production this would come from database
    req.apiClient = {
      id: 'client_' + apiKey.substring(0, 8),
      name: 'External Client',
      apiKey: apiKey,
      credits: 1000, // Mock credits
      rateLimit: 100 // SMS per hour
    };

    next();
  } catch (error) {
    console.error('API Client authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error during authentication'
    });
  }
};

// Public API: Send SMS
app.post('/api/v1/sms/send', authenticateApiClient, async (req, res) => {
  try {
    const { to: phone, message, from: senderId, webhook_url } = req.body;

    // Validate required fields
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Both "to" (phone) and "message" fields are required'
      });
    }

    // Check client credits (mock implementation)
    if (req.apiClient.credits < 1) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits',
        message: 'Your account has insufficient credits to send SMS'
      });
    }

    // Use existing SMS controller logic
    const { sendSMS } = await import('./controllers/smsController.js');
    const mockReq = {
      body: { phone, message, senderId },
      user: { _id: req.apiClient.id, role: 'api_client' },
      apiClient: req.apiClient
    };

    const mockRes = {
      status: (code) => ({ json: (data) => ({ status: code, data }) }),
      json: (data) => data
    };

    const result = await sendSMS(mockReq, mockRes, (err) => {
      throw err;
    });

    if (result.success !== false) {
      // Deduct credits (mock)
      req.apiClient.credits -= 1;

      res.json({
        success: true,
        message: 'SMS sent successfully',
        data: {
          message_id: result.messageId || `msg_${Date.now()}`,
          status: 'sent',
          to: phone,
          from: senderId || 'TUMAPRIME',
          credits_used: 1,
          remaining_credits: req.apiClient.credits
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'SMS sending failed',
        message: result.message || 'Failed to send SMS'
      });
    }

  } catch (error) {
    console.error('Public API SMS send error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process SMS request'
    });
  }
});

// Public API: Send Bulk SMS
app.post('/api/v1/sms/bulk', authenticateApiClient, async (req, res) => {
  try {
    const { to: phones, message, from: senderId, webhook_url } = req.body;

    if (!phones || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Both "to" (phones array) and "message" fields are required'
      });
    }

    const phoneArray = Array.isArray(phones) ? phones : [phones];
    const totalCost = phoneArray.length;

    // Check credits
    if (req.apiClient.credits < totalCost) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits',
        message: `Insufficient credits. Need ${totalCost}, have ${req.apiClient.credits}`
      });
    }

    // Use existing bulk SMS logic
    const { sendBulkSMS } = await import('./controllers/smsController.js');
    const mockReq = {
      body: { phones: phoneArray, message, senderId, name: 'API Bulk SMS' },
      user: { _id: req.apiClient.id, role: 'api_client' },
      apiClient: req.apiClient
    };

    const mockRes = {
      status: (code) => ({ json: (data) => ({ status: code, data }) }),
      json: (data) => data
    };

    const result = await sendBulkSMS(mockReq, mockRes, (err) => {
      throw err;
    });

    if (result.success !== false) {
      req.apiClient.credits -= totalCost;

      res.json({
        success: true,
        message: 'Bulk SMS queued successfully',
        data: {
          campaign_id: `campaign_${Date.now()}`,
          recipient_count: phoneArray.length,
          status: 'queued',
          credits_used: totalCost,
          remaining_credits: req.apiClient.credits
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Bulk SMS failed',
        message: result.message || 'Failed to queue bulk SMS'
      });
    }

  } catch (error) {
    console.error('Public API bulk SMS error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process bulk SMS request'
    });
  }
});

// Public API: Get Account Balance
app.get('/api/v1/account/balance', authenticateApiClient, (req, res) => {
  res.json({
    success: true,
    data: {
      credits: req.apiClient.credits,
      sms_rate: 1, // credits per SMS
      currency: 'KES'
    }
  });
});

// Public API: Get Message Status
app.get('/api/v1/sms/:messageId', authenticateApiClient, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Query SMS log
    const SMSLog = (await import('./models/SMSLog.js')).default;
    const smsLog = await SMSLog.findOne({
      $or: [
        { apiMessageId: messageId },
        { _id: messageId }
      ]
    });

    if (!smsLog) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
        message: 'The specified message ID was not found'
      });
    }

    res.json({
      success: true,
      data: {
        message_id: smsLog.apiMessageId || smsLog._id,
        status: smsLog.status,
        phone: smsLog.phone,
        sent_at: smsLog.sentAt,
        delivered_at: smsLog.deliveredAt,
        cost: smsLog.cost
      }
    });

  } catch (error) {
    console.error('Public API message status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve message status'
    });
  }
});

// Public API: Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    service: 'TumaPrime SMS API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes only (frontend is served separately on Vercel)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Catch-all 404 for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found. Frontend is served from Vercel.'
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
║   - Public API: /api/v1/*                        ║
║   - Health:   /api/health                         ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
