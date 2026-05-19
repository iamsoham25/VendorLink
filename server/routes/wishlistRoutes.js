const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const { auth } = require("../middleware/authMiddleware");

/**
 * @route   GET /api/wishlist
 * @desc    Get user's wishlist
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate("products.product", "name category price image inStock rating");

    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
      wishlist = await Wishlist.findById(wishlist._id)
        .populate("products.product", "name category price image inStock rating");
    }

    res.json({
      success: true,
      wishlist: wishlist.products,
      count: wishlist.products.length,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   POST /api/wishlist/:productId
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post("/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
    }

    // Check if already in wishlist
    const exists = wishlist.products.find(
      (p) => p.product.toString() === productId
    );
    if (exists) {
      return res.status(400).json({ success: false, error: "Product already in wishlist" });
    }

    // Add product
    wishlist.products.push({ product: productId });
    await wishlist.save();

    // Populate and return
    wishlist = await Wishlist.findById(wishlist._id)
      .populate("products.product", "name category price image inStock rating");

    res.json({
      success: true,
      message: "Product added to wishlist",
      wishlist: wishlist.products,
      count: wishlist.products.length,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   DELETE /api/wishlist/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete("/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, error: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.product.toString() !== productId
    );
    await wishlist.save();

    res.json({
      success: true,
      message: "Product removed from wishlist",
      count: wishlist.products.length,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   DELETE /api/wishlist
 * @desc    Clear entire wishlist
 * @access  Private
 */
router.delete("/", auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, error: "Wishlist not found" });
    }

    wishlist.products = [];
    await wishlist.save();

    res.json({
      success: true,
      message: "Wishlist cleared",
      count: 0,
    });
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/**
 * @route   GET /api/wishlist/check/:productId
 * @desc    Check if product is in wishlist
 * @access  Private
 */
router.get("/check/:productId", auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.json({ success: true, inWishlist: false });
    }

    const inWishlist = wishlist.products.some(
      (p) => p.product.toString() === productId
    );

    res.json({ success: true, inWishlist });
  } catch (error) {
    console.error("Error checking wishlist:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
