const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Index for performance
WishlistSchema.index({ user: 1 });

// Virtual for item count
WishlistSchema.virtual("itemCount").get(function () {
  return this.products.length;
});

// Method to add product to wishlist
WishlistSchema.methods.addProduct = function (productId) {
  const exists = this.products.find(
    (p) => p.product.toString() === productId.toString()
  );
  if (!exists) {
    this.products.push({ product: productId });
  }
  return this.save();
};

// Method to remove product from wishlist
WishlistSchema.methods.removeProduct = function (productId) {
  this.products = this.products.filter(
    (p) => p.product.toString() !== productId.toString()
  );
  return this.save();
};

module.exports = mongoose.model("Wishlist", WishlistSchema);
