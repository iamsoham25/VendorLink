// server/models/Order.js
const mongoose = require("mongoose");

// One line item in an order
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for demo purposes
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      default: 1,
    },
    image: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Who placed the order (vendor)
    vendorId: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for demo purposes
      required: true,
    },

    // Which supplier will fulfil the order
    supplierId: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for demo purposes
      required: true,
    },

    // Order items
    items: [orderItemSchema],

    // Total amount of this order
    totalAmount: {
      type: Number,
      required: true,
    },

    // Status managed by supplier
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet", "netbanking", "cod"],
      default: "card",
    },

    // Delivery address
    deliveryAddress: {
      fullName: String,
      phoneNumber: String,
      streetAddress: String,
      city: String,
      state: String,
      pincode: String,
    },
  },
  { timestamps: true }
);

// Database Indexes for Performance
orderSchema.index({ vendorId: 1, createdAt: -1 });
orderSchema.index({ supplierId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
