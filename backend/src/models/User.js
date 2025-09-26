const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // Nullable for OAuth users
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  picture: {
    type: DataTypes.STRING, // URL to profile picture
    allowNull: true
  },
  // OAuth fields
  provider: {
    type: DataTypes.ENUM('local', 'google', 'github', 'microsoft'),
    defaultValue: 'local'
  },
  providerId: {
    type: DataTypes.STRING, // OAuth provider's user ID
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  tableName: 'users'
});

module.exports = User;