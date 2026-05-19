const Order = require("../models/Order");
const Product = require("../models/Product");

exports.createOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);

    const totalPrice = product.price * quantity;

    const order = await Order.create({
      vendor: req.user.id,
      product: productId,
      quantity,
      totalPrice,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.supplierAnalytics = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("product");

    const supplierOrders = orders.filter(
      (o) => o.product.supplier.toString() === req.user.id
    );

    const totalOrders = supplierOrders.length;

    const revenue = supplierOrders.reduce(
      (sum, o) => sum + o.totalPrice, 0
    );

    res.json({ totalOrders, revenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
