const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options work for both local MongoDB and Atlas
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    const host = conn.connection.host;
    const isAtlas = host.includes('mongodb.net');
    console.log(`✅ MongoDB Connected: ${host}${isAtlas ? ' (Atlas)' : ' (Local)'}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
    });
  } catch (err) {
    console.error(`❌ MongoDB Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
