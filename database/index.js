const mongoose = require('mongoose');
const { dbHost, dbName, dbPort, dbUser, dbPass } = require('../app/config');

// Build MongoDB URI
const uri = `mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}?authSource=admin`;

// Connect to MongoDB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Handle connection
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected successfully');
});

module.exports = db;
