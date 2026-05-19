const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
    requirementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Requirement",
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    vendorName: { type: String },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    supplierName: { type: String, required: true },
    pricePerUnit: { type: String, required: true },
    availableQuantity: { type: String, required: true },
    deliveryTimeline: { type: String, required: true },
    additionalNotes: { type: String },
    status: { type: String, enum: ["sent", "accepted", "rejected"], default: "sent" },
    sentAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Proposal", proposalSchema);
