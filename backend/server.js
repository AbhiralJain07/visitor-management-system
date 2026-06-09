const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express(); // ← PEHLE app banao!

// Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests! Try after 15 minutes!'
    }
});

const loginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts! Try after 30 minutes!'
    }
});

// Middleware
app.use(globalLimiter); // ← app ke baad!
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite default port
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Swagger Setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'VMS API Documentation',
            version: '1.0.0',
            description: 'AI-Native Visitor Management System API'
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Routes Import
const visitorRoutes = require('./routes/visitors');
const visitRoutes = require('./routes/visits');
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const realmRoutes = require('./routes/realms');
const userRoutes = require('./routes/users');
const masterTypeRoutes = require('./routes/masterTypes');
const masterDataRoutes = require('./routes/masterData');
const auditLogRoutes = require('./routes/auditLogs');

// Login strict limiter
app.use('/api/auth/login', loginLimiter);

// Routes Use
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/visitors', visitorRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/realms', realmRoutes);
app.use('/api/users', userRoutes);
app.use('/api/master-types', masterTypeRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('VMS Server is running!');
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Database connected!');
    })
    .catch((error) => {
        console.log('Database error:', error);
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server ${PORT} is running! 🚀`);
});