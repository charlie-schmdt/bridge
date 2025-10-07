const express = require('express');
const router = express.Router();
const initSfuStream = require('./services/sfuClient.js');

// Import controllers
const { createUser, loginUser } = require('../controllers/userController');

// Basic routes
router.get('/', (req, res) => {
  res.json({ 
    message: 'Bridge API Routes',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/register - Register new user',
      'POST /api/auth/login - Login user',
      'GET /api/health - Health check'
    ]
  });
});

// We can delete this later
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Authentication routes
router.post('/auth/register', createUser);
router.post('/auth/login', loginUser);

module.exports = router;