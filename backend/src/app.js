const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root & Health check endpoints (for Keep-Alive pings, Render checks, and browser diagnostics)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'employee-attrition-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'employee-attrition-backend',
    message: 'RetainIQ HR Analytics Backend API Gateway is active.',
    timestamp: new Date().toISOString(),
  });
});
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/predictions', predictionRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Error Handler Middleware
app.use(errorHandler);

module.exports = app;
