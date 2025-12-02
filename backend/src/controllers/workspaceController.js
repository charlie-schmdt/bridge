const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // Add this import
const Workspace = require('../models/Workspaces');
const User = require('../models/User');
const UserWorkspaceFavorites = require('../models/UserWorkspaceFavorites')
const clientRegistry = require('../utils/clientRegistry');

const generateToken = (userID) => {
  return jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const getWorkspaces = async (req, res) => {
  try {
    console.log("Fetching all public workspaces");
    
    // Fetch all workspaces (include private ones so Discover can list them).
    // For private workspaces we intentionally do NOT expose member lists here —
    // the frontend will show a 'Private' indicator and request-to-join action.
    const workspaces = await Workspace.findAll();

    const formattedWorkspaces = workspaces.map(workspace => ({
      id: workspace.workspace_id,
      name: workspace.name,
      description: workspace.description,
      isPrivate: workspace.private,
      // Expose member list only for non-private workspaces to avoid leaking membership
      authorizedUsers: workspace.private ? [] : (workspace.auth_users || []),
      ownerId: workspace.owner_real_id,
      createdAt: workspace.created_at
    }));

    res.json(formattedWorkspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching workspaces',
      error: error.message 
    });
  }
}

// leave a workspace
const leaveWorkspace = async (req, res) => {
try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    
    console.log(`User ${userId} attempting to leave workspace ${workspaceId}`);
    
    const workspace = await Workspace.findByPk(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check if user is the owner
    if (workspace.owner_real_id === userId) {
      return res.status(403).json({
        success: false,
        message: 'Owner cannot leave workspace. Transfer ownership or delete the workspace instead.'
      });
    }
    
    const currentAuthUsers = workspace.auth_users || [];
    if (!currentAuthUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }
    
    // Remove user from auth_users list
    const updatedAuthUsers = currentAuthUsers.filter(id => id !== userId);
    
    await workspace.update({
      auth_users: updatedAuthUsers
    });
    
    console.log(`✅ User ${userId} successfully left workspace ${workspaceId}`);
    
    res.json({
      success: true,
      message: 'Successfully left workspace',
      workspace: {
        id: workspace.workspace_id,
        name: workspace.name,
        authorizedUsers: updatedAuthUsers
      }
    });
    
  } catch (error) {
    console.error('Error leaving workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving workspace',
      error: error.message
    });
  }
};


const createWorkspace = async (req, res) => {
    try {
    const { name, description, private, auth_users, authorized_users, owner_real_id } = req.body;
    console.log('Creating workspace with data:', req.body);
    console.log('Owner ID:', owner_real_id);

    // Treat `auth_users` from the request as users to INVITE (pending invites),
    // not immediately active members. The owner should always be an active member.
    const invitedUsers = Array.isArray(auth_users) ? auth_users : [];
    const initialAuthUsers = [owner_real_id];
    const pendingInvites = invitedUsers;

    const newWorkspace = await Workspace.create({
      name,
      description,
      private: private,
      owner_real_id: owner_real_id,
      auth_users: initialAuthUsers,
      pending_invites: pendingInvites,
      authorized_users: authorized_users,
      room_ids: []
    });
        
        res.status(201).json({
            success: true,
            message: 'Workspace created successfully',
            workspace: {
                id: newWorkspace.workspace_id,
                name: newWorkspace.name,
                description: newWorkspace.description,
                isPrivate: newWorkspace.private,
                authorizedUsers: newWorkspace.auth_users,
                pendingInvites: newWorkspace.pending_invites,
                ownerId: newWorkspace.owner_real_id,
                createdAt: newWorkspace.created_at
            }
        });
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating workspace',
            error: error.message
        });
    }
};

const joinWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.body;
    const userId = req.user.id; // From auth middleware
    
    console.log(`User ${userId} attempting to join workspace ${workspaceId}`);
    
    // Find the workspace
    const workspace = await Workspace.findByPk(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check if workspace is private and user is not the owner
    if (workspace.private && workspace.owner_real_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot join private workspace - access denied'
      });
    }
    
    // Check if user is already in the workspace
    const currentAuthUsers = workspace.auth_users || [];
    if (currentAuthUsers.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this workspace'
      });
    }
    
    // Add user to auth_users list
    const updatedAuthUsers = [...currentAuthUsers, userId];
    const updatedPermissions = [...(workspace.authorized_users || []), {
      id: userId,
      role: 'member',
      permissions: {
          canCreateRooms: false,
          canDeleteRooms: false,
          canEditWorkspace: false,
        },
    }];

    await workspace.update({
      auth_users: updatedAuthUsers,
      authorized_users: updatedPermissions
    });
    
    console.log(`✅ User ${userId} successfully joined workspace ${workspaceId}`);
    
    res.json({
      success: true,
      message: 'Successfully joined workspace',
      workspace: {
        id: workspace.workspace_id,
        name: workspace.name,
        description: workspace.description,
        isPrivate: workspace.private,
        authorizedUsers: updatedAuthUsers,
        ownerId: workspace.owner_real_id,
        authorized_users: updatedPermissions,
      }
    });
    
  } catch (error) {
    console.error('Error joining workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining workspace',
      error: error.message
    });
  }
};

// Get Members of a Workspace
const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    
    console.log(`Fetching members for workspace: ${workspaceId}`);
    
    // Find the workspace
    const workspace = await Workspace.findByPk(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check if user has access to this workspace
    const authUsers = workspace.auth_users || [];
    const hasAccess = workspace.owner_real_id === userId || authUsers.includes(userId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workspace'
      });
    }
    
    // Get all member UUIDs (owner + auth_users)
    const allMemberIds = [workspace.owner_real_id, ...authUsers];
    const uniqueMemberIds = [...new Set(allMemberIds)]; // Remove duplicates
    
    // Fetch user details for all members
    const members = await User.findAll({
      where: {
        id: uniqueMemberIds
      },
      // Fetch additional public profile fields so the frontend can render member profiles
      attributes: ['id', 'name', 'email', 'picture', 'bio', 'timezone']
    });
    
    // Format member data
    const formattedMembers = members.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      picture: member.picture,
      bio: member.bio || '',
      timezone: member.timezone || 'UTC-8',
      isOwner: member.id === workspace.owner_real_id,
      role: member.id === workspace.owner_real_id ? 'Owner' : 'Member'
    }));
    
    console.log(`✅ Found ${formattedMembers.length} members for workspace ${workspaceId}`);
    
    res.json({
      success: true,
      workspaceId: workspace.workspace_id,
      workspaceName: workspace.name,
      members: formattedMembers
    });
    
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace members',
      error: error.message
    });
  }
};

// Invite an existing user to a workspace by email (owner-only).
const inviteUserToWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body || {};
    const requestingUserId = req.user?.id;

    console.log('[inviteUserToWorkspace] incoming request', { workspaceId, requestingUserId, body: req.body });

    if (!email) {
      console.warn('[inviteUserToWorkspace] missing email in request body', { workspaceId, requestingUserId });
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    console.log('[inviteUserToWorkspace] workspace state before invite', { workspaceId: workspace.workspace_id, auth_users: workspace.auth_users, pending_invites: workspace.pending_invites });

    // Only owner can invite
    if (workspace.owner_real_id !== requestingUserId) {
      return res.status(403).json({ success: false, message: 'Only workspace owner can invite members' });
    }

    // Find user by email
    const userToInvite = await User.findOne({ where: { email } });
    if (!userToInvite) {
      return res.status(404).json({ success: false, message: 'User with that email not found' });
    }

    const userId = userToInvite.id;
    const currentAuthUsers = workspace.auth_users || [];
    if (workspace.owner_real_id === userId || currentAuthUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    // Add to pending_invites
    const currentPending = workspace.pending_invites || [];
    if (currentPending.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User has already been invited' });
    }

    const updatedPending = [...currentPending, userId];
    await workspace.update({ pending_invites: updatedPending });

    // Notify invited user via websocket if connected
    const invitedSocket = clientRegistry.getClientById(userId);
    if (invitedSocket && invitedSocket.readyState === invitedSocket.OPEN) {
      try {
        invitedSocket.send(JSON.stringify({ type: 'workspace_invite', workspaceId: workspace.workspace_id, workspaceName: workspace.name }));
      } catch (e) {
        console.error('Failed to notify invited user via websocket:', e);
      }
    }

    console.log(`✅ User ${userId} (${userToInvite.email}) invited to workspace ${workspaceId} by ${requestingUserId}`);

    res.json({ success: true, message: 'User invited to workspace (pending acceptance)', invitedUser: { id: userToInvite.id, name: userToInvite.name, email: userToInvite.email }, workspace: { id: workspace.workspace_id, name: workspace.name, pendingInvites: updatedPending } });
  } catch (error) {
    console.error('Error inviting user to workspace:', error);
    res.status(500).json({ success: false, message: 'Error inviting user to workspace', error: error.message });
  }
};

// List workspaces where the current user has a pending invite
const getJoinableWorkspaces = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log('[getJoinableWorkspaces] user requested joinable workspaces for userId=', userId);
    const allWorkspaces = await Workspace.findAll();
    // Normalize comparisons to strings to avoid numeric/string mismatches
    const joinable = allWorkspaces.filter(w => Array.isArray(w.pending_invites) && w.pending_invites.map(String).includes(String(userId)));
    const formatted = joinable.map(workspace => ({ id: workspace.workspace_id, name: workspace.name, description: workspace.description, isPrivate: workspace.private, ownerId: workspace.owner_real_id }));
    console.log('[getJoinableWorkspaces] found', formatted.length, 'joinable workspaces for userId=', userId);
    res.json({ success: true, workspaces: formatted });
  } catch (error) {
    console.error('Error fetching joinable workspaces:', error);
    res.status(500).json({ success: false, message: 'Error fetching joinable workspaces', error: error.message });
  }
};

// Accept an invite: move user from pending_invites -> auth_users
const acceptInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const pending = workspace.pending_invites || [];
    // Compare as strings to avoid type mismatch
    if (!pending.map(String).includes(String(userId))) return res.status(403).json({ success: false, message: 'No pending invite for this user' });

    const beforeAuth = Array.isArray(workspace.auth_users) ? [...workspace.auth_users] : [];
    const newAuthSet = new Set(beforeAuth.map(String));
    newAuthSet.add(String(userId));
    // Preserve original ID types where possible by merging
    const newAuth = Array.from(newAuthSet).map(id => id);

    const updatedPending = pending.filter(id => String(id) !== String(userId));

    await workspace.update({ auth_users: newAuth, pending_invites: updatedPending });

    console.log(`✅ User ${userId} accepted invite to workspace ${workspaceId}`);
    console.log('auth_users before:', beforeAuth, 'after:', newAuth);

    res.json({ success: true, message: 'Invite accepted', workspace: { id: workspace.workspace_id, name: workspace.name, authorizedUsers: newAuth } });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ success: false, message: 'Error accepting invite', error: error.message });
  }
};

// Reject an invite: remove the user from pending_invites without adding to auth_users
const rejectInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    const pending = workspace.pending_invites || [];
    if (!pending.map(String).includes(String(userId))) return res.status(403).json({ success: false, message: 'No pending invite for this user' });

    const updatedPending = pending.filter(id => String(id) !== String(userId));
    await workspace.update({ pending_invites: updatedPending });

    console.log(`❌ User ${userId} rejected invite to workspace ${workspaceId}`);

    res.json({ success: true, message: 'Invite rejected' });
  } catch (error) {
    console.error('Error rejecting invite:', error);
    res.status(500).json({ success: false, message: 'Error rejecting invite', error: error.message });
  }
};

// Request to join a workspace (creates a pending request)
const requestJoinWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const { message } = req.body || {};

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });

    // Prevent duplicate requests
    const pending = Array.isArray(workspace.pending_requests) ? workspace.pending_requests : (workspace.pending_requests ? JSON.parse(workspace.pending_requests) : []);
    if (pending.find(r => String(r.id) === String(userId))) {
      return res.status(400).json({ success: false, message: 'Request already submitted' });
    }

    const reqEntry = { id: userId, message: message || null, created_at: new Date().toISOString() };
    const updatedPending = [...pending, reqEntry];

    // Persist
    workspace.pending_requests = updatedPending;
    workspace.changed('pending_requests', true);
    await workspace.save();

    // Notify owner via websocket if connected
    const ownerId = workspace.owner_real_id;
    const ownerSocket = clientRegistry.getClientById(ownerId);
    if (ownerSocket && ownerSocket.readyState === ownerSocket.OPEN) {
      try {
        ownerSocket.send(JSON.stringify({ type: 'workspace_event', event: 'join_request', workspaceId, request: reqEntry }));
      } catch (e) {
        console.error('Failed to notify owner socket:', e);
      }
    }

    return res.json({ success: true, message: 'Request submitted', request: reqEntry });
  } catch (error) {
    console.error('Error requesting to join workspace:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit request' });
  }
}

// Get pending join requests (owner only)
const getPendingRequests = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    if (workspace.owner_real_id !== userId) return res.status(403).json({ success: false, message: 'Only owner can view requests' });

    const pending = Array.isArray(workspace.pending_requests) ? workspace.pending_requests : (workspace.pending_requests ? JSON.parse(workspace.pending_requests) : []);
    // Optionally enrich with basic user info
    const userIds = pending.map(p => p.id);
    const users = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'email', 'picture'] });
    const usersById = {};
    users.forEach(u => { usersById[String(u.id)] = u; });

    const decorated = pending.map(p => ({ ...p, user: usersById[String(p.id)] || null }));
    return res.json({ success: true, requests: decorated });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
}

// Owner accepts a pending request
const acceptJoinRequest = async (req, res) => {
  try {
    const { workspaceId, requesterId } = req.params;
    const userId = req.user.id; // owner
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    if (workspace.owner_real_id !== userId) return res.status(403).json({ success: false, message: 'Only owner can accept requests' });

    const pending = Array.isArray(workspace.pending_requests) ? workspace.pending_requests : (workspace.pending_requests ? JSON.parse(workspace.pending_requests) : []);
    const idx = pending.findIndex(p => String(p.id) === String(requesterId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Request not found' });

    // Remove from pending
    const [acceptedReq] = pending.splice(idx, 1);

    // Add to auth_users and authorized_users
    const currentAuth = workspace.auth_users || [];
    if (!currentAuth.includes(requesterId)) currentAuth.push(requesterId);

    const currentAuthorized = Array.isArray(workspace.authorized_users) ? workspace.authorized_users : (workspace.authorized_users ? JSON.parse(workspace.authorized_users) : []);
    currentAuthorized.push({ id: requesterId, role: 'member', permissions: { canCreateRooms: false, canDeleteRooms: false, canEditWorkspace: false } });

    workspace.pending_requests = pending;
    workspace.auth_users = currentAuth;
    workspace.authorized_users = currentAuthorized;
    workspace.changed('pending_requests', true);
    workspace.changed('auth_users', true);
    workspace.changed('authorized_users', true);
    await workspace.save();

    // Notify requester via websocket if connected
    const requesterSocket = clientRegistry.getClientById(requesterId);
    if (requesterSocket && requesterSocket.readyState === requesterSocket.OPEN) {
      try {
        requesterSocket.send(JSON.stringify({ type: 'workspace_event', event: 'request_accepted', workspaceId, message: 'Your request was accepted' }));
      } catch (e) { console.error('Failed to notify requester socket:', e); }
    }

    return res.json({ success: true, message: 'Request accepted', userId: requesterId });
  } catch (error) {
    console.error('Error accepting join request:', error);
    return res.status(500).json({ success: false, message: 'Failed to accept request' });
  }
}

// Owner denies a pending request
const denyJoinRequest = async (req, res) => {
  try {
    const { workspaceId, requesterId } = req.params;
    const userId = req.user.id; // owner
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) return res.status(404).json({ success: false, message: 'Workspace not found' });
    if (workspace.owner_real_id !== userId) return res.status(403).json({ success: false, message: 'Only owner can deny requests' });

    const pending = Array.isArray(workspace.pending_requests) ? workspace.pending_requests : (workspace.pending_requests ? JSON.parse(workspace.pending_requests) : []);
    const idx = pending.findIndex(p => String(p.id) === String(requesterId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Request not found' });

    const [deniedReq] = pending.splice(idx, 1);

    workspace.pending_requests = pending;
    workspace.changed('pending_requests', true);
    await workspace.save();

    // Notify requester via websocket if connected
    const requesterSocket = clientRegistry.getClientById(requesterId);
    if (requesterSocket && requesterSocket.readyState === requesterSocket.OPEN) {
      try {
        requesterSocket.send(JSON.stringify({ type: 'workspace_event', event: 'request_denied', workspaceId, message: 'Your request was denied' }));
      } catch (e) { console.error('Failed to notify requester socket:', e); }
    }

    return res.json({ success: true, message: 'Request denied' });
  } catch (error) {
    console.error('Error denying join request:', error);
    return res.status(500).json({ success: false, message: 'Failed to deny request' });
  }
}

// Get workspaces where user is a member
const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching workspaces for user: ${userId}`);
    
    // Fetch all workspaces and filter in JavaScript (simpler and more reliable)
    const allWorkspaces = await Workspace.findAll();
    
    // Get user's favorites
    const userFavorites = await UserWorkspaceFavorites.findAll({
      where: { user_id: userId },
      attributes: ['workspace_id']
    });
    const favoriteIds = userFavorites.map(fav => String(fav.workspace_id));
    
    // Filter workspaces where user is owner or in auth_users array
    const userWorkspaces = allWorkspaces.filter(workspace => {
      const authUsers = workspace.auth_users || [];
      const isOwner = workspace.owner_real_id === userId;
      const isMember = authUsers.includes(userId);
      return isOwner || isMember;
    });

    console.log(favoriteIds);
    console.log(favoriteIds.includes(18))
    // Format workspaces with favorite status
    const formattedWorkspaces = userWorkspaces.map(workspace => ({
      id: workspace.workspace_id,
      name: workspace.name,
      description: workspace.description,
      isPrivate: workspace.private,
      authorizedUsers: workspace.auth_users || [],
      ownerId: workspace.owner_real_id,
      createdAt: workspace.created_at,
      isFavorite: favoriteIds.includes(workspace.workspace_id)
    }));

    // Sort: favorites first, then by creation date
    formattedWorkspaces.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1; // Favorites first
      if (!a.isFavorite && b.isFavorite) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt); // Then by date
    });

    console.log(`✅ Found ${formattedWorkspaces.length} workspaces for user ${userId} (${favoriteIds.length} favorites)`);
    res.json(formattedWorkspaces);
    
    console.log(formattedWorkspaces);
  } catch (error) {
    console.error('Error fetching user workspaces:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user workspaces',
      error: error.message 
    });
  }
};

// remove a user from a workspace
const removeUserFromWorkspace = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const requestingUserId = req.user.id; // User making the request
    
    console.log(`User ${requestingUserId} attempting to remove user ${userId} from workspace ${workspaceId}`);
    
    // Find the workspace
    const workspace = await Workspace.findByPk(workspaceId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Permission check: Only owner can remove users
    if (workspace.owner_real_id !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only workspace owner can remove users'
      });
    }
    
    // Check if user to be removed exists in workspace
    const currentAuthUsers = workspace.auth_users || [];
    if (!currentAuthUsers.includes(userId) && workspace.owner_real_id !== userId) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this workspace'
      });
    }
    
    // Prevent owner from removing themselves
    if (userId === workspace.owner_real_id) {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot be removed from workspace'
      });
    }
    
    // Remove user from auth_users list
    const updatedAuthUsers = currentAuthUsers.filter(id => id !== userId);
    
    await workspace.update({
      auth_users: updatedAuthUsers
    });
    
    // Get user details for response
    const removedUser = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });
    
    console.log(`✅ User ${userId} (${removedUser?.name}) removed from workspace ${workspaceId} by ${requestingUserId}`);
    
    res.json({
      success: true,
      message: 'User removed from workspace successfully',
      removedUser: {
        id: removedUser?.id,
        name: removedUser?.name,
        email: removedUser?.email
      },
      workspace: {
        id: workspace.workspace_id,
        name: workspace.name,
        authorizedUsers: updatedAuthUsers
      }
    });
    
  } catch (error) {
    console.error('Error removing user from workspace:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing user from workspace',
      error: error.message
    });
  }
};

const toggleWorkspaceFavorite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    
    
    console.log(`User ${userId} toggling favorite for workspace ${workspaceId}`);
    
    // Check if workspace exists and user has access
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check if user has access to workspace
    const authUsers = workspace.auth_users || [];
    const hasAccess = workspace.owner_real_id === userId || authUsers.includes(userId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workspace'
      });
    }
    
    // Check if already favorited
    const existingFavorite = await UserWorkspaceFavorites.findOne({
      where: {
        user_id: userId,
        workspace_id: workspaceId
      }
    });
    
    if (existingFavorite) {
      // Remove favorite
      await existingFavorite.destroy();
      console.log(`✅ Removed favorite: User ${userId}, Workspace ${workspaceId}`);
      
      res.json({
        success: true,
        message: 'Workspace removed from favorites',
        isFavorite: false
      });
    } else {
      // Add favorite
      await UserWorkspaceFavorites.create({
        user_id: userId,
        workspace_id: workspaceId
      });
      console.log(`✅ Added favorite: User ${userId}, Workspace ${workspaceId}`);
      
      res.json({
        success: true,
        message: 'Workspace added to favorites',
        isFavorite: true
      });
    }
    
  } catch (error) {
    console.error('Error toggling workspace favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling workspace favorite',
      error: error.message
    });
  }
};

const getUserFavoriteWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const favorites = await UserWorkspaceFavorites.findAll({
      where: { user_id: userId },
      include: [{
        model: Workspace,
        as: 'workspace'
      }],
      order: [['favorited_at', 'ASC']] // Maintain favorite order
    });
    
    const favoriteWorkspaceIds = favorites.map(fav => fav.workspace_id);
    
    res.json({
      success: true,
      favoriteWorkspaceIds
    });
    
  } catch (error) {
    console.error('Error fetching favorite workspaces:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite workspaces',
      error: error.message
    });
  }
};

const updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, isPrivate } = req.body;
    const userId = req.user.id;
    console.log(`User ${userId} attempting to update workspace ${workspaceId}`);
    
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }
    // Only owner can update workspace
    if (workspace.owner_real_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only workspace owner can update workspace' });
    }
    await workspace.update({
      name: name || workspace.name,
      description: description || workspace.description,
      private: isPrivate !== undefined ? isPrivate : workspace.private
    });
    console.log(`✅ Workspace ${workspaceId} updated successfully by user ${userId}`);
    res.json({
      success: true,
      message: 'Workspace updated successfully',
      workspace: {
        id: workspace.workspace_id,
        name: workspace.name,
        description: workspace.description,
        isPrivate: workspace.private,
        authorizedUsers: workspace.auth_users || [],
        ownerId: workspace.owner_real_id,
        createdAt: workspace.created_at
      }
    });
  } catch (e) {
    return res.status(500);
  }
}


const setPermissions = async (req, res) => {
  try {
    const { userId, permissions } = req.body;
    const { workspaceId } = req.params;
    const { canCreateRooms, canDeleteRooms, canEditWorkspace } = permissions;

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }


    // Ensure JSON is parsed
    const users = Array.isArray(workspace.authorized_users)
      ? workspace.authorized_users
      : JSON.parse(workspace.authorized_users || "[]");

    // Match by string equality (safe for both numeric and string IDs)
    const userIndex = users.findIndex(u => String(u.id) === String(userId));
    
    if (userIndex !== -1) {
      users[userIndex].permissions = {
        canCreateRooms,
        canDeleteRooms,
        canEditWorkspace,
      };
    } else {
      users.push({
        id: userId,
        role: 'member',
        permissions: { canCreateRooms, canDeleteRooms, canEditWorkspace },
      });
    }


    workspace.authorized_users = users;
    workspace.changed('authorized_users', true);
    await workspace.save();
    const fresh = await Workspace.findByPk(workspaceId);
    console.log("DB value:", fresh.authorized_users);


    // workspace.set('authorized_users', users);
    // await workspace.save();
    // Correct way to persist
    //await workspace.update({ authorized_users: users });

    console.log('Permissions updated for user', userId);
    res.json({
      success: true,
      message: 'Permissions updated successfully',
      permissions,
    });
  } catch (error) {
    console.error('Set permissions error:', error);
    res.status(500).json({ success: false, message: 'Error updating permissions' });
  }
};



const getPermissions = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const workspace = await Workspace.findByPk(workspaceId);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Ensure JSON is parsed
    const authorizedUsers = Array.isArray(workspace.authorized_users)
      ? workspace.authorized_users
      : JSON.parse(workspace.authorized_users || "[]");

    // Match by string equality (safe for both numeric and string IDs)
    const userEntry = authorizedUsers.find(u => String(u.id) === String(userId));

    if (!userEntry) {
      console.log(`User ${userId} not found in workspace ${workspaceId}`);
    }

    const permissions = userEntry?.permissions || {
      canCreateRooms: false,
      canDeleteRooms: false,
      canEditWorkspace: false
    };

    return res.json({ success: true, permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ success: false, message: 'Error fetching user permissions' });
  }
};


module.exports = {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  getUserWorkspaces,
  getWorkspaceMembers,
  leaveWorkspace,
  removeUserFromWorkspace,
  toggleWorkspaceFavorite,
  getUserFavoriteWorkspaces,
  updateWorkspace,
  setPermissions,
  getPermissions,
  requestJoinWorkspace,
  getPendingRequests,
  acceptJoinRequest,
  denyJoinRequest,
  // Invite flow
  inviteUserToWorkspace,
  getJoinableWorkspaces,
  acceptInvite
  ,
  rejectInvite
};