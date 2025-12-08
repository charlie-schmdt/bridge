const express = require('express');
const router = express.Router();

// Import controllers
const { getWorkspaces, createWorkspace, joinWorkspace, getUserWorkspaces, getWorkspaceMembers, leaveWorkspace, 
  removeUserFromWorkspace, updateWorkspace, setPermissions, getPermissions, toggleWorkspaceFavorite, getUserFavoriteWorkspaces, 
  inviteUserToWorkspace, getJoinableWorkspaces, acceptInvite, setUserRole } = require('../controllers/workspaceController');
const { createUser, loginUser, getSettings, updateSettings, oauthLogin, deleteAccount, setOnboarding, getUsers } = require('../controllers/userController');
const { getRooms, getRoom, createRoom, getRoomMembers, updateRoomMembers, editRoom, deleteRoom } = require('../controllers/roomController');
const { submitQuestion } = require('../controllers/questionController');
const { getQAQuestions, submitQuestion: submitQAQuestion, updateQuestionStatus } = require('../controllers/qaController');
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
router.get('/users', authenticateToken, getUsers);

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
router.put('/workspace/:workspaceId/update', authenticateToken, updateWorkspace);
router.get('/workspaces/user', authenticateToken, getUserWorkspaces);
router.get('/workspace/:workspaceId/members', authenticateToken, getWorkspaceMembers);
router.delete('/workspace/:workspaceId/leave', authenticateToken, leaveWorkspace);
router.delete('/workspace/:workspaceId/member/:userId', authenticateToken, removeUserFromWorkspace);
router.post('/workspace/:workspaceId/favorite', authenticateToken, toggleWorkspaceFavorite);
router.get('/workspaces/user/favorites', authenticateToken, getUserFavoriteWorkspaces);
router.put('/workspaces/:workspaceId/permissions', authenticateToken, setPermissions);
router.get('/workspaces/:workspaceId/permissions/:userId', authenticateToken, getPermissions);
router.post('/workspace/:workspaceId/invite', authenticateToken, inviteUserToWorkspace);
router.get('/workspaces/joinable', authenticateToken, getJoinableWorkspaces);
router.post('/workspace/:workspaceId/accept-invite', authenticateToken, acceptInvite);
router.put('/workspace/:workspaceId/member/:userId/role', authenticateToken, setUserRole);


// Room routes would go here
router.get('/workspace/:workspaceId/rooms', authenticateToken, getRooms);
router.get('/rooms/:roomId', authenticateToken, getRoom);
router.post('/rooms/create', authenticateToken, createRoom);
router.put('/rooms/edit/:roomId', authenticateToken, editRoom);
router.delete('/rooms/delete/:roomId', authenticateToken, deleteRoom);

router.get('/rooms/:roomId/getRoomMembers', authenticateToken, getRoomMembers);
router.put('/rooms/:roomId/updateRoomMembers', authenticateToken, updateRoomMembers);

// Q&A routes for rooms
router.get('/rooms/:roomId/qa', authenticateToken, getQAQuestions);
router.post('/rooms/:roomId/qa', authenticateToken, submitQAQuestion);
router.patch('/rooms/:roomId/qa/:questionId/status', authenticateToken, updateQuestionStatus);

// Protected routes (require authentication)
router.delete('/auth/delete-account', authenticateToken, deleteAccount);

// FAQ route for submitting questions
router.post('/faq/question', submitQuestion);

module.exports = router;