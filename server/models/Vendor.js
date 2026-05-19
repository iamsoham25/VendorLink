const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
    vendorName: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    contact: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, default: 4.5 },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Vendor", vendorSchema);
