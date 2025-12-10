const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
     id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    session_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Sessions',
            key: 'id',
        },
    },
    user_info: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    last_entered: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    last_exited: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    total_time: { //in minutes
        type:DataTypes.INTEGER,
        allowNull: true
    }

})
module.exports = Attendance;