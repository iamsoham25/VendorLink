// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true },

    category: { type: String, required: true },

    price: { type: Number, required: true },

    image: { type: String, default: "" },

    inStock: { type: Boolean, default: true },

    tags: [{ type: String }],

    rating: { type: Number, default: 0 },       // for future use
    ratingCount: { type: Number, default: 0 },  // for future use
  },
  { timestamps: true }
);

// Database Indexes for Performance
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ name: 'text', category: 'text' }); // Text search
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });

module.exports = mongoose.model("Product", productSchema);
