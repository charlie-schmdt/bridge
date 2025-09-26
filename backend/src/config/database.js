const { Sequelize } = require('sequelize');


const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  // Alternative SSL configuration for Neon
  ssl: true,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5, // Reduced for Neon free tier
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection function
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
  }
};

module.exports = { sequelize, testConnection };