'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'timezone', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'UTC-5' // Eastern Time default
    });

    await queryInterface.addColumn('users', 'emailNotifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'pushNotifications', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'meetingReminders', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'weeklyDigest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('users', 'profileVisibility', {
      type: Sequelize.ENUM('public', 'team', 'private'),
      allowNull: false,
      defaultValue: 'team'
    });

    await queryInterface.addColumn('users', 'showOnlineStatus', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'allowDirectMessages', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('users', 'theme', {
      type: Sequelize.ENUM('light', 'dark', 'system'),
      allowNull: false,
      defaultValue: 'system'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'bio');
    await queryInterface.removeColumn('users', 'timezone');
    await queryInterface.removeColumn('users', 'emailNotifications');
    await queryInterface.removeColumn('users', 'pushNotifications');
    await queryInterface.removeColumn('users', 'meetingReminders');
    await queryInterface.removeColumn('users', 'weeklyDigest');
    await queryInterface.removeColumn('users', 'profileVisibility');
    await queryInterface.removeColumn('users', 'showOnlineStatus');
    await queryInterface.removeColumn('users', 'allowDirectMessages');
    await queryInterface.removeColumn('users', 'theme');
  }
};