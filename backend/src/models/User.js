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
  bio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'UTC-5' // Eastern Time default
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
  },
  // Notification settings
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  pushNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  meetingReminders: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  weeklyDigest: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Privacy settings
  profileVisibility: {
    type: DataTypes.ENUM('public', 'team', 'private'),
    allowNull: false,
    defaultValue: 'team'
  },
  showOnlineStatus: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  allowDirectMessages: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  // Appearance settings
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'system'),
    allowNull: false,
    defaultValue: 'system'
  }
  ,
  // Onboarding flag
  onboarding_completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  tableName: 'users'
});

module.exports = User;