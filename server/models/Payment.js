const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for demo purposes
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for demo purposes
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["card", "upi", "wallet", "netbanking", "cod"],
      default: "card",
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpaySignature: {
      type: String,
    },

    response: {
      type: mongoose.Schema.Types.Mixed,
    },

    failureReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
PaymentSchema.index({ order: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model("Payment", PaymentSchema);
