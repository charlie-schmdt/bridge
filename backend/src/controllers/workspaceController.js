const jwt = require('jsonwebtoken');
const { Op } = require('sequelize'); // Add this import
const Workspace = require('../models/Workspaces');
const User = require('../models/User');

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
      }, // Only public workspaces
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

const createWorkspace = async (req, res) => {
    try {
        const { name, description, isPrivate, ownerId } = req.body;
        console.log('Creating workspace with data:', req.body);
        console.log('Owner ID:', ownerId);
        
        const newWorkspace = await Workspace.create({
            name,
            description,
            private: isPrivate,
            owner_real_id: ownerId,
            auth_users: [],
            room_ids: {}
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
    
    await workspace.update({
      auth_users: updatedAuthUsers
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
        ownerId: workspace.owner_real_id
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

// Get workspaces where user is a member
const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching workspaces for user: ${userId}`);
    
    // Fetch all workspaces and filter in JavaScript (simpler and more reliable)
    const allWorkspaces = await Workspace.findAll();
    
    // Filter workspaces where user is owner or in auth_users array
    const userWorkspaces = allWorkspaces.filter(workspace => {
      const authUsers = workspace.auth_users || [];
      const isOwner = workspace.owner_real_id === userId;
      const isMember = authUsers.includes(userId);
      
      console.log(`Workspace ${workspace.name}:`, {
        owner: workspace.owner_real_id,
        authUsers,
        userId,
        isOwner,
        isMember
      });
      
      return isOwner || isMember;
    });

    const formattedWorkspaces = userWorkspaces.map(workspace => ({
      id: workspace.workspace_id,
      name: workspace.name,
      description: workspace.description,
      isPrivate: workspace.private,
      authorizedUsers: workspace.auth_users || [],
      ownerId: workspace.owner_real_id,
      createdAt: workspace.created_at
    }));

    console.log(`✅ Found ${formattedWorkspaces.length} workspaces for user ${userId}`);
    console.log('User workspaces:', formattedWorkspaces.map(ws => ws.name));
    
    res.json(formattedWorkspaces);
    
  } catch (error) {
    console.error('Error fetching user workspaces:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user workspaces',
      error: error.message 
    });
  }
};

module.exports = {
  getWorkspaces,
  createWorkspace,
  joinWorkspace,
  getUserWorkspaces
};