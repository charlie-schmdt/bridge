const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Workspace = require('../models/Workspaces');
const Room = require('../models/Rooms');
const User = require('../models/User');

module.exports = {
    getRooms,
    getRoom,
    createRoom,
    editRoom,
    deleteRoom,
    getRoomMembers,
    updateRoomMembers,
    addRoomMember, 
};

async function getRooms(req, res) {
  const { workspaceId } = req.params;

  try {
    // Step 1: Get the workspace entry
    const workspace = await Workspace.findByPk(workspaceId);

    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Step 2: Ensure room_ids is valid
    const roomIds = workspace.room_ids || [];
    if (roomIds.length === 0) {
      return res.status(200).json({ success: true, rooms: [] });
    }

    // Step 3: Fetch the corresponding rooms
    const rooms = await Room.findAll({
      where: { room_id: { [Op.in]: roomIds } },
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching rooms' });
  }
}

async function getRoom(req, res) {
  const { roomId } = req.params;

  try {
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.status(200).json(room);
  } catch (error) {
    console.error('❌ Error fetching room:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching room' });
  }
}

async function getRoom(req, res) {
  const { roomId } = req.params;

  try {
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.status(200).json(room);
  } catch (error) {
    console.error('❌ Error fetching room:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching room' });
  }
}

async function createRoom(req, res) {
  const { workspaceId, name, description, categories, meetings } = req.body;
  const userId = req.user?.id;

  if (!workspaceId || !name) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Create the room
    const newRoom = await Room.create({
      name,
      description,
      categories,
      workspace_id: workspaceId,
      created_by: userId,
      meetings,
    });

    // Update workspace’s room_ids array
    // 3Safely update room_ids
    let roomIds = workspace.room_ids;
    if (!Array.isArray(roomIds)) {
      console.warn("room_ids was not an array, reinitializing");
      roomIds = [];
    }

    await workspace.update({ room_ids: [...(workspace.room_ids || []), newRoom.room_id] });


    return res.status(201).json({ success: true, room: newRoom });
  } catch (error) {
    console.error('Error creating room:', error);
    return res.status(500).json({ success: false, message: 'Server error creating room' });
  }
}
async function getRoomMembers(req, res) {
  /*
    [(UUID, state)...]
    state:
        in waiting room
        active in call

    check if admin in room using compare

  */
 try {
    const { roomId } = req.params;
    
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const allMembers = [room.room_members];
    return res.status(201).json({
      sucess: true,
      room_members: allMembers
    });

  

 } catch (error) {
    console.error('Error fetching room members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room members',
      error: error.message
    });
  }
}
async function updateRoomMembers(req, res) {
 try {
    const { roomId } = req.params;
    /* json created in front end for user */
    const listOfMembers = req.body;

    
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    await room.update({
      room_members: listOfMembers
    });
 
    console.log(`✅ Room ${roomId} updated successfully`);

    const allMembers = [room.room_members];
    return res.status(201).json({
      sucess: true,
      room_members: allMembers
    });


  

 } catch (error) {
    console.error('Error fetching room members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room members',
      error: error.message
    });
  }
}

async function addRoomMember(req, res) {
 try {
    const { roomId } = req.params;
    /* json created in front end for user */
    const member = req.body.waiting_user;

    
    const room = await Room.findByPk(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const allMembers = [...(room.room_members || []), {
      uuid: member.uuid,
      state: member.state
    }];
    await room.update({
      room_members: allMembers
    });
 
    console.log(`✅ Member added to ${roomId} successfully`);



    return res.status(201).json({
      sucess: true,
      room_members: allMembers
    });


  

 } catch (error) {
    console.error('Error fetching room members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room members',
      error: error.message
    });
  }
}



async function editRoom(req, res) {
  const { roomId } = req.params;
  const { name, description, categories, status, meetings } = req.body;

  try {
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    // Update the room
    await room.update({
      name,
      description,
      categories,
      status,
      meetings,
    });
    return res.status(200).json({ success: true, room });

  } catch (error) {
    console.error('Error editing room:', error);
    return res.status(500).json({ success: false, message: 'Server error editing room' });
  }
}

async function deleteRoom(req, res) {
  const { roomId } = req.params;
  try {
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    await room.destroy();
    return res.status(200).json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting room' });
  }
}