const { Sequelize } = require('sequelize');
const config = require('../config/database');
const User  = require('./User');
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'postgres',
});

const db = {
  Sequelize,
  sequelize,
  // Add your models here
  // Example: User: require('./User')(sequelize, Sequelize),
};

// Sync all models with the database
sequelize.sync()
  .then(() => {
    console.log('Database & tables created!');
  });

module.exports = {db, User};