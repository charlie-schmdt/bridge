const jwt = require('jsonwebtoken');
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

module.exports = {
  getWorkspaces,
  createWorkspace
};