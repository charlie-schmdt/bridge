'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('qa_questions', {
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
      question: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending' // 'pending' or 'completed'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Index for efficient room queries
    await queryInterface.addIndex('qa_questions', ['room_id'], {
      name: 'idx_qa_questions_room_id'
    });

    // Index for filtering by status
    await queryInterface.addIndex('qa_questions', ['status'], {
      name: 'idx_qa_questions_status'
    });

    // Composite index for room + status queries
    await queryInterface.addIndex('qa_questions', ['room_id', 'status'], {
      name: 'idx_qa_questions_room_status'
    });

    // Index for time-based queries
    await queryInterface.addIndex('qa_questions', ['created_at'], {
      name: 'idx_qa_questions_created_at'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('qa_questions', 'idx_qa_questions_room_id');
    await queryInterface.removeIndex('qa_questions', 'idx_qa_questions_status');
    await queryInterface.removeIndex('qa_questions', 'idx_qa_questions_room_status');
    await queryInterface.removeIndex('qa_questions', 'idx_qa_questions_created_at');
    
    // Drop the table
    await queryInterface.dropTable('qa_questions');
  }
};
