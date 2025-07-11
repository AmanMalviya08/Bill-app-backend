// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); // Removed deprecated options
    console.log(`👍 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`👎 MongoDB Error: ${error.message} `);
    process.exit(1);
  }
};

module.exports = connectDB;
