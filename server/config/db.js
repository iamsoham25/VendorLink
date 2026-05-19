// config/db.js
const mongoose = require("mongoose");
const mockDB = require("./mockDB");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log("⚠️  MONGODB_URI missing in .env, using mock database");
      global.useMockDB = true;
      global.mockDB = mockDB;
      console.log("✔ Mock database initialized with sample data");
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for Atlas
    });

    console.log(`✔ MongoDB Atlas connected: ${conn.connection.host}`);
    console.log(`  Database: ${conn.connection.name}`);
    global.useMockDB = false;

    // Listen for disconnection events
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected — falling back to mock database");
      global.useMockDB = true;
      global.mockDB = mockDB;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✔ MongoDB reconnected — switching back to Atlas");
      global.useMockDB = false;
    });

  } catch (err) {
    console.log("⚠️  MongoDB connection failed:", err.message);
    console.log("📦 Falling back to mock database for demonstration");
    global.useMockDB = true;
    global.mockDB = mockDB;
    console.log("✔ Mock database initialized with sample data");
  }
};

module.exports = connectDB;
