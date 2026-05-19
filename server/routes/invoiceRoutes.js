const express = require("express");
const PDFDocument = require("pdfkit");
const Order = require("../models/Order");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("vendorId", "name email")
      .populate("supplierId", "name shopName location");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");

    doc.pipe(res);

    doc.fontSize(22).text("VendorLink Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${order.createdAt.toDateString()}`);
    doc.moveDown();

    doc.fontSize(16).text("Vendor Details");
    doc.fontSize(12).text(`Name: ${order.vendorId.name}`);
    doc.text(`Email: ${order.vendorId.email}`);
    doc.moveDown();

    doc.fontSize(16).text("Supplier Details");
    doc.fontSize(12).text(`Supplier: ${order.supplierId.shopName || order.supplierId.name}`);
    doc.text(`Location: ${order.supplierId.location}`);
    doc.moveDown();

    doc.fontSize(16).text("Items");
    order.items.forEach((i) => {
      doc.fontSize(12).text(`${i.name} × ${i.qty} — ₹${i.price * i.qty}`);
    });

    doc.moveDown();
    doc.fontSize(16).text(`Total Amount: ₹${order.totalAmount}`);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
