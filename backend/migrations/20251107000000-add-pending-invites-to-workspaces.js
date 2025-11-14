'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add pending_invites column to workspaces table
    await queryInterface.addColumn('workspaces', 'pending_invites', {
      type: Sequelize.ARRAY(Sequelize.UUID),
      allowNull: true,
      defaultValue: []
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('workspaces', 'pending_invites');
  }
};
