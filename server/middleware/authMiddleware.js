// server/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mockDB = require("../config/mockDB");

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) return res.status(401).json({ error: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = null;

    if (!global.useMockDB) {
      // Use real MongoDB Atlas
      try {
        user = await User.findById(decoded.id).select("-password");
      } catch (dbErr) {
        console.log("[Auth] DB lookup failed:", dbErr.message);
      }
    }

    // Fallback to mock DB if using mock mode or real DB lookup failed
    if (!user && (global.useMockDB || !user)) {
      user = await mockDB.findUserById(decoded.id);
    }

    if (!user) {
      // Also check vendors in mock DB
      user = await mockDB.findVendorById(decoded.id);
    }

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth] Token failed:", err.message);
    res.status(401).json({ error: "Token failed" });
  }
};

exports.auth = exports.protect;

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: "Forbidden: insufficient role" });
  }
  next();
};
