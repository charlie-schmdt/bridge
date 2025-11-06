'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_workspace_favorites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.UUID, // ← Changed from STRING to UUID
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      workspace_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'workspace_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      favorited_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint to prevent duplicate favorites
    await queryInterface.addConstraint('user_workspace_favorites', {
      fields: ['user_id', 'workspace_id'],
      type: 'unique',
      name: 'unique_user_workspace_favorite'
    });

    // Add indexes for performance
    await queryInterface.addIndex('user_workspace_favorites', ['user_id'], {
      name: 'idx_user_favorites_user_id'
    });

    await queryInterface.addIndex('user_workspace_favorites', ['workspace_id'], {
      name: 'idx_user_favorites_workspace_id'
    });

    await queryInterface.addIndex('user_workspace_favorites', ['favorited_at'], {
      name: 'idx_user_favorites_favorited_at'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex('user_workspace_favorites', 'idx_user_favorites_user_id');
    await queryInterface.removeIndex('user_workspace_favorites', 'idx_user_favorites_workspace_id');
    await queryInterface.removeIndex('user_workspace_favorites', 'idx_user_favorites_favorited_at');
    
    // Remove unique constraint
    await queryInterface.removeConstraint('user_workspace_favorites', 'unique_user_workspace_favorite');
    
    // Drop the table
    await queryInterface.dropTable('user_workspace_favorites');
  }
};