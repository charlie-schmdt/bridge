const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

module.exports = {
    createAttendance,
    updateAttendance,
    getAllSession,
    findByUS,
    getAttendance
};

async function createAttendance(req, res) {
    const {sessionId} = req.params;
    const body = req.body;
    const userId= req.body.user_id;
    const userName = req.body.user_name;
    const lastEntered = req.body.last_entered;
    try {
        const session = await Session.findByPk(sessionId);

        const newAttendance = await Attendance.create({
            //id created by generated uuid
            session_id: sessionId,
            user_id: userId,
            user_name: userName,
            last_entered: lastEntered
        });

        return res.status(201).json({success: true, attendance: newAttendance});
    } catch (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({ success: false, message: 'Server error creating session' });        
    }
};

async function updateAttendance(req, res) {
    try {
        const { attendanceId } = req.params;
        const updateType = req.body.update_type
        const lex = req.body.last_exited;
        const time = req.body.total_time;
        const len = req.body.last_entered;
        console.log('result: %s, %d', lex, time)
       
        const attendance = await Attendance.findByPk(attendanceId);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        let new_att = null;
        if (updateType === "rejoined") {
            new_att= await attendance.update({
                last_entered: len
            });
        }
        else if (updateType === "left") {
            new_att= await attendance.update({
                last_exited: lex,
                total_time: time
            });
        }
        return res.status(201).json({
            sucess: true,
            attendance: new_att
        });
            
    } catch (error) {
        
    }
    
};

/*
    TODO: get stats for last_entered and total time to update total_time
*/

async function getAttendance(req, res) {
    try{
        console.log("BY ATTENDANCE ID\n");
        const { attendanceId } = req.params;

        const attendance = await Attendance.findByPk(attendanceId);
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance Entry not found'
            });
        }

        return res.status(200).json(attendance);

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error fetching attendance entry' });
    }
};

async function getAllSession(req, res) {
        try{
        const { sessionId } = req.params;

        const attendees = await Attendance.findAll({
            where: {
                session_id: sessionId
            }
        });

        if (!attendees) {
            return res.status(404).json({
                success: false,
                message: 'Attendance Entry not found'
            });
        }

        return res.status(200).json(attendees);

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error fetching attendance entry' });
    }
};

async function findByUS(req, res) {
    try{
        const {sessionId, userId} = req.params;
        
        const attendance = await Attendance.findOne({
            user_id: userId,
            session_id: sessionId
        })
        if (!attendance) {
            console.log("NOT FOUND")
            return res.status(404).json({
                success: false,
                message: 'Attendance Entry not found'
            });
        }
        else {
            console.log("FOUND!: ", attendance)
        }

        return res.status(200).json(attendance);

    } catch (error) {
        console.log("ERROR somewhere")
        return res.status(500).json({ success: false, message: 'Server error fetching attendance entry' });
    }
};
