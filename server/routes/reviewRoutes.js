const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const { auth } = require("../middleware/authMiddleware");

// ADD REVIEW
router.post("/add", auth, async (req, res) => {
  try {
    const { supplierId, rating, comment } = req.body;

    const review = await Review.create({
      userId: req.user.id,
      supplierId,
      rating,
      comment,
    });

    res.json({ message: "Review added", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET REVIEWS FOR SUPPLIER
router.get("/supplier/:id", async (req, res) => {
  try {
    const reviews = await Review.find({ supplierId: req.params.id })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
