// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

const { registerUser, loginUser, getCurrentUser, updateCurrentUser } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);
router.put("/me", protect, updateCurrentUser);

// GET all suppliers
router.get("/all-suppliers", async (req, res) => {
  try {
    const suppliers = await User.find({ role: "supplier" }).select("-password");
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
