const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    room_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Rooms',
            key: 'id',
        },
    },
    session_number: {
        type: DataTypes.INTEGER,
        allowNUll: false,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    attendees: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
      defaultValue: []
    }
}, {
    tableName: 'sessions', 
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['room_id', 'session_number'],
      }
    ]
  }
);

module.exports = Session;