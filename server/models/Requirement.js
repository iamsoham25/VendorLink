const mongoose = require("mongoose");

const requirementSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: { type: String, required: true },
    vendorName: { type: String, required: true },
    vendorLocation: { type: String, required: true },
    material: { type: String, required: true },
    quantity: { type: String, required: true },
    budget: { type: Number, required: true },
    requiredBy: { type: Date, required: true },
    postedDate: { type: Date, default: Date.now },
    urgency: { type: String, enum: ["low", "normal", "high"], default: "normal" },
    verified: { type: Boolean, default: false },
    description: { type: String, required: true },
    requirementsList: { type: String }, // Comma separated items
    status: { type: String, enum: ["open", "closed"], default: "open" }
}, { timestamps: true });

module.exports = mongoose.model("Requirement", requirementSchema);
