const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./controllers/auth');
const studentRoutes = require('./controllers/students');
const adminRoutes = require('./controllers/admin');
const shopRoutes = require('./controllers/shop');
const adminHousesRouter = require('./controllers/adminHouses');
const housesPublic = require('./controllers/housesPublic');
const adminEventsRouter = require('./controllers/adminEvents');
const eventsPublicRouter = require('./controllers/eventsPublic');
const teacherRoutes = require('./controllers/teachers');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS - restrict to specific origins in production
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',') 
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting - more restrictive

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased: Limit each IP to 2000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased: Limit each IP to 20 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// CORS middleware for static files
app.use('/api/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// serve uploaded files at /api/uploads/...
app.use('/api/uploads/houses', express.static(path.join(__dirname, '..', 'uploads', 'houses')));
app.use('/api/uploads/items', express.static(path.join(__dirname, '..', 'uploads', 'items')));
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/houses', adminHousesRouter);
app.use('/api/houses', housesPublic);
app.use('/api/shop', shopRoutes);
app.use('/api/admin/events', adminEventsRouter);
app.use('/api/events', eventsPublicRouter);
app.use('/api/teachers', teacherRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler - MUST be last
app.use(errorHandler);

// export
module.exports = app;
