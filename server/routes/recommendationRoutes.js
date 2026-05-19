/**
 * Recommendation Routes
 * API endpoints for vendor recommendation system
 */

const express = require("express");
const router = express.Router();
const {
  getRecommendedVendors,
  getVendorWithContext,
  getRecommendationStats,
} = require("../controllers/recommendationController");

/**
 * GET /api/recommend/:userId
 * Get top 5 recommended vendors for a user
 * Query params: limit (default: 5)
 * Returns: Array of vendors sorted by recommendation score
 */
router.get("/:userId", getRecommendedVendors);

/**
 * GET /api/recommend/stats/:userId
 * Get recommendation statistics and user preference profile
 * Returns: User's order history, favorite categories, price range
 */
router.get("/stats/:userId", getRecommendationStats);

/**
 * GET /api/recommend/:userId/vendor/:vendorId
 * Get vendor details with recommendation context
 * Returns: Vendor info + breakdown of content & collaborative scores
 */
router.get("/:userId/vendor/:vendorId", getVendorWithContext);

module.exports = router;
