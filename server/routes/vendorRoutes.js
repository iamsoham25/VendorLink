const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");

// Add Vendor
router.post("/add", async (req, res) => {
    try {
        if (global.useMockDB) {
            const vendor = { _id: `vendor_${Date.now()}`, ...req.body, createdAt: new Date() };
            if (!global.mockDB.vendors) global.mockDB.vendors = [];
            global.mockDB.vendors.push(vendor);
            return res.json({ message: "Vendor added successfully", vendor });
        }

        const vendor = new Vendor(req.body);
        await vendor.save();
        res.json({ message: "Vendor added successfully", vendor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all vendors
router.get("/all", async (req, res) => {
    try {
        if (global.useMockDB) {
            return res.json(global.mockDB.vendors || []);
        }

        const vendors = await Vendor.find();
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get vendor by ID
router.get("/:id", async (req, res) => {
    try {
        if (global.useMockDB) {
            const vendor = global.mockDB.vendors?.find(v => v._id === req.params.id);
            if (!vendor) return res.status(404).json({ error: "Vendor not found" });
            return res.json(vendor);
        }

        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) return res.status(404).json({ error: "Vendor not found" });
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete vendor
router.delete("/:id", async (req, res) => {
    try {
        if (global.useMockDB) {
            global.mockDB.vendors = global.mockDB.vendors?.filter(v => v._id !== req.params.id) || [];
            return res.json({ message: "Vendor deleted" });
        }

        await Vendor.findByIdAndDelete(req.params.id);
        res.json({ message: "Vendor deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
