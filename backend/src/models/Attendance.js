const { DataTypes, DATE } = require('sequelize');
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
    last_entered: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    last_exited: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    total_time: { //in minutes
        type:DataTypes.INTEGER,
        allowNull: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    user_name: {
        type: DataTypes.STRING
    }

},{
    tableName: 'attendance', 
    timestamps: false,
})
module.exports = Attendance;