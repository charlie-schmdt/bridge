const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
  room_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4, // generates UUID automatically
  },
  workspace_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'workspaces', // name of the table, not the model
      key: 'workspace_id',
    },
    onDelete: 'CASCADE',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'active',
  },
  meeting_info: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  open: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  categories: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
  },
  meetings: {
    type: DataTypes.JSONB, // <- stores arrays/objects natively
    allowNull: true,
    defaultValue: [],
  },

  
}, {
  timestamps: false,
  tableName: 'rooms',
});

module.exports = Room;
