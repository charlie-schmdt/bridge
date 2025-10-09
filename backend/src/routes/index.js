const express = require('express');
const router = express.Router();

// Import controllers
const { createUser, loginUser, getSettings, updateSettings, oauthLogin, deleteAccount } = require('../controllers/userController');
const { getWorkspaces, createWorkspace } = require('../controllers/workspaceController');
// Import middleware
const { auth, authenticateToken } = require('../middleware/auth');

// Basic routes
router.get('/', (req, res) => {
  res.json({ 
    message: 'Bridge API Routes',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/register - Register new user',
      'POST /api/auth/login - Login user',
      'GET /api/health - Health check',
      'GET /api/settings - Get user settings',
      'PUT /api/settings - Update user settings'
    ]
  });
});

// Settings routes
router.get('/settings', auth, getSettings);
router.put('/settings', auth, updateSettings);

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

// Workspace routes
router.get('/workspaces/public', getWorkspaces);
router.post('/workspaces', createWorkspace); // Removed auth middleware
router.post('/auth/oauth', oauthLogin);

// Protected routes (require authentication)
router.delete('/auth/delete-account', authenticateToken, deleteAccount);

module.exports = router;