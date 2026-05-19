// controllers/authController.js
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mockDB = require("../config/mockDB");

function sanitizeUser(user) {
  if (!user) return null;
  const clean = user.toObject ? user.toObject() : { ...user };
  if (clean.password) delete clean.password;
  return clean;
}

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, vendorName, category, location, contact } = req.body;

    console.log("📝 Registration attempt:", { email, role, useMockDB: global.useMockDB });

    // Check mock DB if enabled
    if (global.useMockDB) {
      console.log("⚠️  Using MOCK DATABASE for registration");
      const existing = global.mockDB.users.find(u => u.email === email);
      if (existing) {
        return res.status(400).json({ message: "User already exists" });
      }

      const newUser = {
        _id: `user_${Date.now()}`,
        name,
        email,
        password,
        role,
        createdAt: new Date()
      };
      global.mockDB.users.push(newUser);

      // If vendor, also create vendor document in mock DB
      if (role === "vendor" && vendorName && category && location && contact) {
        const newVendor = {
          _id: `vendor_${Date.now()}`,
          vendorName,
          category,
          location,
          contact,
          userId: newUser._id,
          createdAt: new Date()
        };
        if (!global.mockDB.vendors) global.mockDB.vendors = [];
        global.mockDB.vendors.push(newVendor);
        console.log("✅ Vendor added to MOCK DB:", newVendor._id);
      }

      return res.status(201).json({
        message: "User registered successfully",
        user: newUser,
      });
    }

    // Use real database
    console.log("✅ Using MONGODB for registration");
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      role,
    });
    console.log("✅ User created in MongoDB:", newUser._id);

    // If vendor, also create vendor document
    if (role === "vendor" && vendorName && category && location && contact) {
      const newVendor = await Vendor.create({
        vendorName,
        category,
        location,
        contact,
        userId: newUser._id
      });
      console.log("✅ Vendor created in MongoDB:", newVendor._id);
    }

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("❌ Registration error:", err.message);
    res.status(500).json({ error: err.message });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check mock DB if enabled
    if (global.useMockDB) {
      const user = global.mockDB.users.find(u => u.email === email && u.role === role);
      if (!user) {
        return res.status(400).json({ message: "Invalid email or role" });
      }

      // Simple password check for mock DB (no bcrypt)
      if (user.password !== password) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Login success",
        token,
        user: {
          _id: user._id,
          name: user.name || user.username,
          email: user.email,
          role: user.role
        },
      });
    }

    // Use real database — find by email only first, then verify role & password
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "No account found with this email. Please sign up first." });

    if (user.role !== role)
      return res.status(400).json({ message: `This account is registered as a ${user.role}. Please select the correct role.` });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password. Please try again." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const safeUser = sanitizeUser(user);
    safeUser.id = safeUser._id;
    res.status(200).json({
      message: "Login success",
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  res.status(200).json(sanitizeUser(req.user));
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const { name, email, shopName, location, contactNumber, image } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim();
    if (shopName !== undefined) updates.shopName = shopName.trim();
    if (location !== undefined) updates.location = location.trim();
    if (contactNumber !== undefined) updates.contactNumber = contactNumber.trim();
    if (image !== undefined) updates.image = image;

    if (updates.email && updates.email !== req.user.email) {
      if (global.useMockDB) {
        const existing = mockDB.users.find((u) => u.email === updates.email && u._id !== req.user._id);
        if (existing) {
          return res.status(400).json({ message: "Email already in use" });
        }
      } else {
        const existing = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
        if (existing) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
    }

    if (global.useMockDB) {
      const user = mockDB.users.find((u) => u._id === req.user._id || u._id === req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      Object.assign(user, updates);
      return res.status(200).json({ message: "Profile updated", user: sanitizeUser(user) });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) user[key] = value;
    });

    const updatedUser = await user.save();
    res.status(200).json({ message: "Profile updated", user: sanitizeUser(updatedUser) });
  } catch (err) {
    console.error("❌ Profile update error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
