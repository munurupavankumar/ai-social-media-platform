// routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const postsRoutes = require('./posts');
const analyticsRoutes = require('./analytics');
const scheduleRoutes = require('./schedules');

// A simple test route
router.get('/', (req, res) => {
  res.send('Hello from the Express server!');
});

// Register route modules
router.use('/api', postsRoutes);
router.use('/api', analyticsRoutes);
router.use('/api', scheduleRoutes);

module.exports = router;