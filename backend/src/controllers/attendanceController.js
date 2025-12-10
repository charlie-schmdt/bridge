const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

module.exports = {
    createAttendance,
    updateAttendance,

};

async function createAttendance(req, res) {
    const {sessionId} = req.params;
    const userInfo = res.body.user_info; //should be jsonb
    const lastEntered = res.body.last_entered;
    const {ui, le} = res.body;
    console.log("🔥 UI: ", ui, "LE: ", le );
    /*
        TODO: test how user Info shows up
    */
    try {
        const session = await Session.findByPk();
        const newAttendance = await Attendance.create({
            //id created by generated uuid
            session_id: sessionId,
            userInfo: userInfo,
            last_entered: lastEntered
        });

        return res.status(201).json({success: true, attendance: newAttendance});
    } catch (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({ success: false, message: 'Server error creating session' });        
    }
}

async function updateAttendance(req, res) {
    try {
        const { attendanceId } = req.params;
        /*
            TODO:
                update last entered, exited, and time
        */
        const attendance = await Attendance.findByPk(attendanceId);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
    } catch (error) {
        
    }
    
}