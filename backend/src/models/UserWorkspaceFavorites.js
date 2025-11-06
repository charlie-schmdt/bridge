const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); 

const UserWorkspaceFavorites = sequelize.define('UserWorkspaceFavorites', {
  id: {
    type: DataTypes.INTEGER, 
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  workspace_id: {
    type: DataTypes.UUID, 
    allowNull: false,
    references: {
      model: 'workspaces',
      key: 'workspace_id'
    }
  },
  favorited_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_workspace_favorites',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'workspace_id']
    }
  ]
});

module.exports = UserWorkspaceFavorites;