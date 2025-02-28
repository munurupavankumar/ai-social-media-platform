// app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import config
const { connectToDatabase } = require('./config/db');

// Import routes
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');
console.log('TWITTER_APP_KEY:', process.env.TWITTER_APP_KEY ? 'set' : 'not set');
console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID ? 'set' : 'not set');

app.use(cors());

// Connect to MongoDB
connectToDatabase();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve video files statically for Facebook and Instagram
app.use('/videos', express.static(path.join(__dirname, '..', 'flask_service', 'downloads')));

// Register all routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
  console.log(`Express server is running on http://localhost:${port}`);
});