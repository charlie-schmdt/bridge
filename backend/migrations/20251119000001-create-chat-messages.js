'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      room_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'rooms',
          key: 'room_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user_picture: {
        type: Sequelize.STRING,
        allowNull: true
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('chat_messages', ['room_id'], {
      name: 'idx_chat_messages_room_id'
    });

    await queryInterface.addIndex('chat_messages', ['user_id'], {
      name: 'idx_chat_messages_user_id'
    });

    await queryInterface.addIndex('chat_messages', ['created_at'], {
      name: 'idx_chat_messages_created_at'
    });

    // Composite index for efficient room + time queries
    await queryInterface.addIndex('chat_messages', ['room_id', 'created_at'], {
      name: 'idx_chat_messages_room_created'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_room_id');
    await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_user_id');
    await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_created_at');
    await queryInterface.removeIndex('chat_messages', 'idx_chat_messages_room_created');
    
    // Drop the table
    await queryInterface.dropTable('chat_messages');
  }
};
