const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Room = require('../models/Rooms');
const Session = require('../models/Session');

module.exports = {
    createSession,
    addAttendee,
    getSession,
    getSessionsByRoom
};
async function createSession(req, res) {
    const {roomId} = req.params;

    try {        
        const lastSession = await Session.findOne({
            where: {room_id: roomId},
            order: [['session_number', 'DESC']]
        });
        const nextSession = lastSession ? Number(lastSession.session_number) + 1 : 1;
        
       //const nextSession = 1;
        const room = await Room.findByPk(roomId);
        if (!room) {
          return res.status(404).json({success: false, message: 'Room not found'})
        }
        const newSession = await Session.create({
            //id created by generated uuid
            room_id: roomId,
            session_number: nextSession,
        });

        return res.status(201).json({success: true, session: newSession});
    } catch (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({ success: false, message: 'Server error creating session' });
    }
}

async function addAttendee(req, res) {
 try {
    const { sessionId } = req.params;
    /* json created in front end for user */
    const attendee = req.body.attendee; //UUID

    const session = await Session.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const attendees = [...(session.attendees || []), attendee];
    await session.update({
        attendees: attendees
    });

    return res.status(201).json({
      sucess: true,
      attendees: attendees
    });


  

 } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendees',
      error: error.message
    });
  }
}

async function getSession(req, res) {
      try{
        const { sessionId } = req.params;

        const session = await Session.findByPk(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session Entry not found'
            });
        }

        return res.status(200).json(session);

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error fetching attendance entry' });
    }
}
async function getSessionsByRoom(req, res) {
      try{
        const { roomId } = req.params;

        const sessions = await Session.findAll({
            where: {
                room_id: roomId
            }
        });

        if (!sessions) {
            return res.status(404).json({
                success: false,
                message: 'Session Entry not found'
            });
        }

        return res.status(200).json(sessions);

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error fetching attendance entry' });
    }
}