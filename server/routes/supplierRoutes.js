const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Review = require("../models/Review");

// GET ALL SUPPLIERS
router.get("/", async (req, res) => {
  try {
    if (global.useMockDB) {
      // Return mock suppliers sorted by recency
      const sortedSuppliers = (global.mockDB.suppliers || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(sortedSuppliers);
    }

    const suppliers = await User.find({ role: "supplier" }).sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SUPPLIER BY ID
router.get("/:id", async (req, res) => {
  try {
    if (global.useMockDB) {
      const supplier = global.mockDB.suppliers?.find(s => s._id === req.params.id) || 
                       global.mockDB.users?.find(u => u._id === req.params.id && u.role === "supplier");
      if (!supplier) return res.status(404).json({ message: "Supplier not found in mock DB" });

      const products = (global.mockDB.products || []).filter(p => p.supplier === req.params.id);
      return res.json({ supplier, products });
    }

    let supplier = await User.findById(req.params.id);

    // If this id is actually a product id, fallback to product's supplier
    let finalSupplier = supplier;
    if (!finalSupplier) {
      const product = await Product.findById(req.params.id).populate("supplier");
      if (product && product.supplier) {
        finalSupplier = product.supplier;
      }
    }

    if (!finalSupplier) return res.status(404).json({ message: "Supplier not found" });

    const products = await Product.find({ supplier: finalSupplier._id || finalSupplier.id }).sort({ createdAt: -1 });

    const reviews = await Review.find({ supplierId: finalSupplier._id || finalSupplier.id }).lean();
    const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const computedRating = reviews.length > 0 ? Number(ratingSum / reviews.length).toFixed(1) : (finalSupplier.rating || 4.5);

    const enrichedSupplier = {
      ...finalSupplier.toObject?.(),
      ...finalSupplier._doc,
      rating: Number(computedRating),
      reviewCount: reviews.length,
    };

    res.json({ supplier: enrichedSupplier, products, reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
