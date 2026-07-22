const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB successfully');
  } catch (err) {
    console.error('DB connection failed:', err.message);
    process.exit(1); // don't let the server run against a dead DB
  }
};

module.exports = connectDB;