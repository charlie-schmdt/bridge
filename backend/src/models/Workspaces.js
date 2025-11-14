const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Workspace = sequelize.define('Workspace', {
  workspace_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  private: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true 
  },
  owner_real_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  auth_users: {
    type: DataTypes.ARRAY(DataTypes.UUID), // Postgres-only 
    allowNull: true,
  },
  pending_invites: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: []
  },
  room_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID), // Postgres-only
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  authorized_users: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'workspaces'
});

module.exports = Workspace;
