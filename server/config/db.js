// config/db.js
const mongoose = require('mongoose');

const connectToDatabase = () => {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
};

module.exports = {
  connectToDatabase
};