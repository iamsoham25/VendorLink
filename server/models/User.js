const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["vendor", "supplier", "customer"],
      default: "vendor",
    },

    shopName: String,
    location: String,
    contactNumber: String,
    image: String,
    rating: { type: Number, default: 4.5 },
  },
  { timestamps: true }
);

// Database Indexes for Performance
UserSchema.index({ role: 1 });
UserSchema.index({ location: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ rating: -1 });

module.exports = mongoose.model("User", UserSchema);
