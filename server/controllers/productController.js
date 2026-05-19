// controllers/productController.js
const Product = require("../models/Product");

// 🔹 Public: get all products
exports.getProducts = async (req, res) => {
  try {
    // If using mock DB, return mock data for development/demo
    if (global.useMockDB) {
      return res.json(global.mockDB.products || []);
    }

    const products = await Product.find()
      .populate(
        "supplier",
        "name email shopName location rating contactNumber image"
      )
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Public: get one product by id
exports.getProductById = async (req, res) => {
  try {
    if (global.useMockDB) {
      const product = global.mockDB.products.find(p => p._id === req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      return res.json(product);
    }

    const p = await Product.findById(req.params.id).populate(
      "supplier",
      "name email"
    );
    if (!p) return res.status(404).json({ message: "Product not found" });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Supplier-only: add product
exports.addProduct = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({ message: "Only suppliers can add products" });
    }

    const { name, price, image, category, inStock, tags } = req.body;

    if (global.useMockDB) {
      const newProduct = {
        _id: "prod_" + Date.now(),
        supplier: req.user.id,
        name,
        price: parseFloat(price),
        image,
        category,
        inStock: inStock !== undefined ? inStock : true,
        tags: Array.isArray(tags) ? tags : [],
        createdAt: new Date()
      };
      global.mockDB.products.push(newProduct);
      return res.status(201).json(newProduct);
    }

    const product = await Product.create({
      supplier: req.user.id,
      name,
      price,
      image,
      category,
      inStock: inStock !== undefined ? inStock : true,
      tags: Array.isArray(tags) ? tags : [],
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Supplier-only: get own products
exports.getSupplierProducts = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res
        .status(403)
        .json({ message: "Only suppliers can view their products" });
    }

    if (global.useMockDB) {
      const products = global.mockDB.products.filter(p => p.supplier === req.user.id);
      return res.json(products);
    }

    const products = await Product.find({ supplier: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Supplier-only: update own product
exports.updateProduct = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res
        .status(403)
        .json({ message: "Only suppliers can update products" });
    }

    if (global.useMockDB) {
      const index = global.mockDB.products.findIndex(p => p._id === req.params.id && p.supplier === req.user.id);
      if (index === -1) return res.status(404).json({ message: "Product not found or not owned by you" });
      global.mockDB.products[index] = { ...global.mockDB.products[index], ...req.body };
      return res.json(global.mockDB.products[index]);
    }

    const updated = await Product.findOneAndUpdate(
      { _id: req.params.id, supplier: req.user.id },
      req.body,
      { new: true }
    );

    if (!updated)
      return res
        .status(404)
        .json({ message: "Product not found or not owned by you" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Supplier-only: delete own product
exports.deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res
        .status(403)
        .json({ message: "Only suppliers can delete products" });
    }

    if (global.useMockDB) {
      const index = global.mockDB.products.findIndex(p => p._id === req.params.id && p.supplier === req.user.id);
      if (index === -1) return res.status(404).json({ message: "Product not found or not owned by you" });

      global.mockDB.products.splice(index, 1);
      return res.json({ message: "Product deleted" });
    }

    const deleted = await Product.findOneAndDelete({
      _id: req.params.id,
      supplier: req.user.id,
    });

    if (!deleted)
      return res
        .status(404)
        .json({ message: "Product not found or not owned by you" });

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
