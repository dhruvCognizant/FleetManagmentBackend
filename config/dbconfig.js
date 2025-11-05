const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async (url) => {
  try {
  await mongoose.connect(url, {
  useNewUrlParser: true
});

    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

module.exports = connectDB;
