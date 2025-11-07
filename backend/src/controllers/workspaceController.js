const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // Add this import
const Workspace = require('../models/Workspaces');
const User = require('../models/User');
const UserWorkspaceFavorites = require('../models/UserWorkspaceFavorites')

const generateToken = (userID) => {
  return jwt.sign({ userID }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const getWorkspaces = async (req, res) => {
  try {
    console.log("Fetching all public workspaces");
    
    // Fetch all workspaces with their authorized users
    const workspaces = await Workspace.findAll({
      where: { 
        private: false
      },
    });

    const formattedWorkspaces = workspaces.map(workspace => ({
      id: workspace.workspace_id,
      name: workspace.name,
      description: workspace.description,
      isPrivate: workspace.private,
      authorizedUsers: workspace.auth_users || [],
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

        const newWorkspace = await Workspace.create({
            name,
            description,
            private: private,
            owner_real_id: owner_real_id,
            auth_users: [owner_real_id, ...auth_users],
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

    const { canCreateRooms, canDeleteRooms, canEditWorkspace } = permissions || {};

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Ensure authorized_users is an array
    const users = Array.isArray(workspace.authorized_users) ? workspace.authorized_users : [];

    // Find the index of the target user
    const userIndex = users.findIndex((u) => String(u.id) === String(userId));

    if (userIndex !== -1) {
      // Update existing user's permissions
      users[userIndex].permissions = {
        canCreateRooms: !!canCreateRooms,
        canDeleteRooms: !!canDeleteRooms,
        canEditWorkspace: !!canEditWorkspace
      };
    } else {
      // Add new user with default role if not found
      users.push({
        id: userId,
        role: 'member',
        permissions: {
          canCreateRooms: !!canCreateRooms,
          canDeleteRooms: !!canDeleteRooms,
          canEditWorkspace: !!canEditWorkspace
        }
      });
    }

    // Save updated array back to DB
    await workspace.update({ authorized_users: users }, { where: { id: workspaceId } });

    console.log('✅ Permissions updated for user', userId);
    res.json({
      success: true,
      message: 'Permissions updated successfully',
      permissions: { canCreateRooms: !!canCreateRooms, canDeleteRooms: !!canDeleteRooms, canEditWorkspace: !!canEditWorkspace }
    });
  } catch (error) {
    console.error('❌ Set permissions error:', error);
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

    const authorizedUsers = workspace.authorized_users || [];
    const userEntry = authorizedUsers.find(u => String(u.id) === String(userId));

    if (!userEntry) {
      console.log(`User ${userId} not found in workspace ${workspaceId}`);
    }

    // Return their permissions or default empty permissions
    res.json({ success: true, permissions: userEntry?.permissions });
    return userEntry?.permissions || { canCreateRooms: false, canDeleteRooms: false, canEditWorkspace: false };
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ success: false, message: 'Error fetching user permissions' });
  }
};

// Invite an existing user to a workspace by email. Only workspace owner can invite.
const inviteUserToWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body;
    const requestingUserId = req.user.id;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

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

    // If user is already owner or member
    if (workspace.owner_real_id === userId || currentAuthUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    // Add userId to pending_invites instead of immediately adding to auth_users
    const currentPending = workspace.pending_invites || [];
    if (currentPending.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User has already been invited' });
    }

    const updatedPending = [...currentPending, userId];
    await workspace.update({ pending_invites: updatedPending });

    console.log(`✅ User ${userId} (${userToInvite.email}) invited to workspace ${workspaceId} by ${requestingUserId}`);

    res.json({
      success: true,
      message: 'User invited to workspace successfully (pending acceptance)',
      invitedUser: {
        id: userToInvite.id,
        name: userToInvite.name,
        email: userToInvite.email
      },
      workspace: {
        id: workspace.workspace_id,
        name: workspace.name,
        pendingInvites: updatedPending
      }
    });
  } catch (error) {
    console.error('Error inviting user to workspace:', error);
    res.status(500).json({ success: false, message: 'Error inviting user to workspace', error: error.message });
  }
};

// Get workspaces the current user has been invited to (pending invites)
const getJoinableWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find all workspaces where pending_invites includes this user
    const allWorkspaces = await Workspace.findAll();
    const joinable = allWorkspaces.filter(w => Array.isArray(w.pending_invites) && w.pending_invites.includes(userId));

    const formatted = joinable.map(workspace => ({
      id: workspace.workspace_id,
      name: workspace.name,
      description: workspace.description,
      isPrivate: workspace.private,
      ownerId: workspace.owner_real_id,
      invited: true
    }));

    res.json({ success: true, workspaces: formatted });
  } catch (error) {
    console.error('Error fetching joinable workspaces:', error);
    res.status(500).json({ success: false, message: 'Error fetching joinable workspaces', error: error.message });
  }
};

// Accept an invite to a workspace (move from pending_invites -> auth_users)
const acceptInvite = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    const pending = workspace.pending_invites || [];
    if (!pending.includes(userId)) {
      return res.status(403).json({ success: false, message: 'No pending invite for this user' });
    }

    const beforeAuth = Array.isArray(workspace.auth_users) ? [...workspace.auth_users] : [];
    const newAuthSet = new Set(beforeAuth);
    newAuthSet.add(userId);
    const newAuth = Array.from(newAuthSet);

    // Remove from pending invites
    const updatedPending = pending.filter(id => id !== userId);

    // Explicitly update both columns with a new array (avoid mutating the instance array)
    await workspace.update({ auth_users: newAuth, pending_invites: updatedPending });

    console.log(`✅ User ${userId} accepted invite to workspace ${workspaceId}`);
    console.log('auth_users before:', beforeAuth, 'after:', newAuth);

    res.json({
      success: true,
      message: 'Invite accepted. You are now a member of the workspace',
      workspace: {
        id: workspace.workspace_id,
        name: workspace.name,
        authorizedUsers: newAuth
      }
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ success: false, message: 'Error accepting invite', error: error.message });
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
  // invite a user to a workspace by email
  inviteUserToWorkspace,
  getJoinableWorkspaces,
  acceptInvite,
  getPermissions
};