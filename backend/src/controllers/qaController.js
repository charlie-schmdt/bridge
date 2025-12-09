const { sequelize } = require('../config/database');
const Room = require('../models/Rooms');

module.exports = {
  getQAQuestions,
  submitQuestion,
  updateQuestionStatus,
};

async function getQAQuestions(req, res) {
  const { roomId } = req.params;

  try {
    // Verify room exists
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Fetch all Q&A questions for this room
    const [questions] = await sequelize.query(`
      SELECT * FROM qa_questions
      WHERE room_id = :roomId
      ORDER BY created_at ASC
    `, {
      replacements: { roomId },
      type: sequelize.QueryTypes.SELECT
    });

    return res.status(200).json({ success: true, questions: questions || [] });
  } catch (error) {
    console.error('Error fetching Q&A questions:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching questions' });
  }
}

async function submitQuestion(req, res) {
  const { roomId } = req.params;
  const { question } = req.body;
  const userId = req.user?.id;
  const userName = req.user?.name;
  const userPicture = req.user?.picture;

  if (!question || !question.trim()) {
    return res.status(400).json({ success: false, message: 'Question text is required' });
  }

  if (question.length > 500) {
    return res.status(400).json({ success: false, message: 'Question must be 500 characters or less' });
  }

  try {
    // Verify room exists
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Insert the question (Supabase realtime will handle the INSERT event)
    const [result] = await sequelize.query(`
      INSERT INTO qa_questions (id, room_id, user_id, user_name, user_picture, question, status, created_at, updated_at)
      VALUES (uuid_generate_v4(), :roomId, :userId, :userName, :userPicture, :question, 'pending', NOW(), NOW())
      RETURNING *
    `, {
      replacements: {
        roomId,
        userId,
        userName,
        userPicture,
        question: question.trim()
      },
      type: sequelize.QueryTypes.INSERT
    });

    return res.status(201).json({ success: true, question: result[0] });
  } catch (error) {
    console.error('Error submitting question:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting question' });
  }
}

async function updateQuestionStatus(req, res) {
  const { roomId, questionId } = req.params;
  const { status } = req.body;
  const userId = req.user?.id;

  if (!status || !['pending', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be "pending" or "completed"' });
  }

  try {
    // Verify room exists and user is the owner
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if user is room owner
    if (room.created_by !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the room owner can mark questions as completed' 
      });
    }

    // Update the question status
    const updateFields = status === 'completed' 
      ? 'status = :status, completed_at = NOW(), completed_by = :userId, updated_at = NOW()'
      : 'status = :status, completed_at = NULL, completed_by = NULL, updated_at = NOW()';

    const [result] = await sequelize.query(`
      UPDATE qa_questions
      SET ${updateFields}
      WHERE id = :questionId AND room_id = :roomId
      RETURNING *
    `, {
      replacements: {
        questionId,
        roomId,
        status,
        userId
      },
      type: sequelize.QueryTypes.UPDATE
    });

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    return res.status(200).json({ success: true, question: result[0] });
  } catch (error) {
    console.error('Error updating question status:', error);
    return res.status(500).json({ success: false, message: 'Server error updating question' });
  }
}
