const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmdirect';

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    
    console.log('✓ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.warn('⚠ MongoDB connection failed:', error.message);
    console.warn('Using in-memory fallback mode. Install and run MongoDB for persistence.');
    return false;
  }
};

module.exports = connectDB;

