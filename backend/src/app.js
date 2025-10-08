require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize, testConnection } = require('./config/database');
const sfuClient = require('./services/sfuClient');
const signalingSocket = require('./websocket/signalingSocket');
const http = require('http');
const ws = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

const path = require('path');
const fs = require('fs');


// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection
testConnection();

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Basic root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bridge Backend API',
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});



const server = http.createServer(app);
const wss = new ws.WebSocketServer({ server });
sfuClient.initSfuConnection();
signalingSocket.initSignalingSocket(wss);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;