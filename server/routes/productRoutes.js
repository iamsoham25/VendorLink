// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/authMiddleware");
const Product = require("../models/Product");
const User = require("../models/User");

const {
  getProducts,
  getProductById,
  addProduct,
  getSupplierProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// 🔹 Public routes
router.get("/", getProducts);
router.get("/:id", getProductById);

/**
 * @route   GET /api/products/search
 * @desc    Search products with advanced filters
 * @access  Public
 */
router.get("/search", async (req, res) => {
  try {
    const {
      q, // text search query
      category,
      minPrice,
      maxPrice,
      minRating,
      location,
      inStock,
      sortBy,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    const query = {};

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    // Category filter
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // In stock filter
    if (inStock === "true") {
      query.inStock = true;
    }

    // Location filter (requires joining with User model)
    let supplierIds = null;
    if (location) {
      const suppliers = await User.find({
        role: "supplier",
        location: { $regex: location, $options: "i" },
      }).select("_id");
      supplierIds = suppliers.map((s) => s._id);
      query.supplier = { $in: supplierIds };
    }

    // Sorting options
    let sort = { createdAt: -1 }; // default: newest first
    if (sortBy) {
      switch (sortBy) {
        case "price_asc":
          sort = { price: 1 };
          break;
        case "price_desc":
          sort = { price: -1 };
          break;
        case "rating":
          sort = { rating: -1 };
          break;
        case "name":
          sort = { name: 1 };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const products = await Product.find(query)
      .populate("supplier", "name shopName location rating")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Get unique categories for filter options
    const categories = await Product.distinct("category", { supplier: { $exists: true } });

    // Get unique locations from suppliers
    const locations = await User.distinct("location", { role: "supplier" });

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      filters: {
        categories,
        locations,
      },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/products/filters
 * @desc    Get filter options (categories, locations, price range)
 * @access  Public
 */
router.get("/filters", async (req, res) => {
  try {
    // Get unique categories
    const categories = await Product.distinct("category");

    // Get unique locations from suppliers
    const locations = await User.distinct("location", { role: "supplier" });

    // Get price range
    const priceRange = await Product.findOne().sort({ price: -1 }).select("price");
    const minPriceProduct = await Product.findOne().sort({ price: 1 }).select("price");

    res.json({
      success: true,
      filters: {
        categories: categories.filter(Boolean),
        locations: locations.filter(Boolean),
        priceRange: {
          min: minPriceProduct?.price || 0,
          max: priceRange?.price || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// 🔹 Supplier-only routes
router.get("/me/list", auth, getSupplierProducts);
router.post("/", auth, addProduct);
router.put("/:id", auth, updateProduct);
router.delete("/:id", auth, deleteProduct);

module.exports = router;
