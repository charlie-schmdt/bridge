const express = require('express');
const router = express.Router();

// Import controllers
const { getWorkspaces, createWorkspace, joinWorkspace, getUserWorkspaces, getWorkspaceMembers, leaveWorkspace, removeUserFromWorkspace } = require('../controllers/workspaceController');
const { createUser, loginUser, getSettings, updateSettings, oauthLogin, deleteAccount, setOnboarding } = require('../controllers/userController');
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
        'PUT /api/users/:id/onboarding - Mark onboarding complete',
      'GET /api/health - Health check',
      'GET /api/settings - Get user settings',
      'PUT /api/settings - Update user settings'
    ]
  });
});

// Settings routes
router.get('/settings', auth, getSettings);
router.put('/settings', auth, updateSettings);

// Onboarding route - mark onboarding as completed for a user
router.put('/users/:id/onboarding', authenticateToken, setOnboarding);

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
router.post('/auth/oauth', oauthLogin);

// Protected routes (require authentication)
router.delete('/auth/delete-account', authenticateToken, deleteAccount);

// Workspace routes
router.get('/workspaces/public', getWorkspaces);
router.post('/workspaces', createWorkspace); // Removed auth middleware
router.post('/workspace/join', authenticateToken, joinWorkspace);
router.get('/workspaces/user', authenticateToken, getUserWorkspaces);
router.get('/workspace/:workspaceId/members', authenticateToken, getWorkspaceMembers);
router.delete('/workspace/:workspaceId/leave', authenticateToken, leaveWorkspace);
router.delete('/workspace/:workspaceId/member/:userId', authenticateToken, removeUserFromWorkspace);
// Protected routes (require authentication)
router.delete('/auth/delete-account', authenticateToken, deleteAccount);

module.exports = router;