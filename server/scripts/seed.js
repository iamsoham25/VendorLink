const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Product = require("../models/Product");
const Vendor = require("../models/Vendor");
const Order = require("../models/Order");
const mockDB = require("../config/mockDB");

const seedDatabase = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB!");

        // Clear existing data
        console.log("Clearing existing data...");
        const userDel = await User.deleteMany({});
        console.log(`Deleted ${userDel.deletedCount} users.`);
        const prodDel = await Product.deleteMany({});
        console.log(`Deleted ${prodDel.deletedCount} products.`);
        const vendDel = await Vendor.deleteMany({});
        console.log(`Deleted ${vendDel.deletedCount} vendors.`);
        const orderDel = await Order.deleteMany({});
        console.log(`Deleted ${orderDel.deletedCount} orders.`);
        console.log("Data cleared!");

        // Map to store mock ID to real ObjectId
        const userMap = {};
        const productMap = {};

        // Seed Users
        console.log("Seeding Users...");
        const usedEmails = new Set();
        for (const mockUser of mockDB.users) {
            try {
                const { _id, ...userData } = mockUser;

                // hash the password so seeded records are secure
                if (userData.password) {
                    const bcrypt = require('bcryptjs');
                    userData.password = await bcrypt.hash(userData.password, 10);
                }

                let email = userData.email;
                let counter = 1;
                while (usedEmails.has(email)) {
                    email = userData.email.replace("@", `${counter}@`);
                    counter++;
                }
                userData.email = email;
                usedEmails.add(email);

                if (!userData.name && userData.fullName) {
                    userData.name = userData.fullName;
                } else if (!userData.name) {
                    userData.name = userData.username || "Unknown User";
                }

                const newUser = await User.create(userData);
                userMap[_id] = newUser._id;
            } catch (userErr) {
                console.error(`Error creating user ${mockUser.username}:`, userErr.message);
                if (userErr.errors) {
                    Object.keys(userErr.errors).forEach(key => {
                        console.error(`  Field '${key}': ${userErr.errors[key].message}`);
                    });
                }
                throw userErr;
            }
        }
        console.log(`Seeded ${Object.keys(userMap).length} users.`);

        // Seed Vendors (Some are also Users in this design, it's a bit mixed)
        console.log("Seeding Vendors...");
        for (const mockVendor of mockDB.vendors) {
            try {
                const { _id, ...vendorData } = mockVendor;
                // Vendor model expects vendorName, but mock has shopName
                vendorData.vendorName = vendorData.shopName || "Unknown Shop";
                vendorData.contact = vendorData.phone || "0000000000";

                await Vendor.create(vendorData);
            } catch (vendorErr) {
                console.error(`Error creating vendor ${mockVendor.shopName}:`, vendorErr.message);
                throw vendorErr;
            }
        }
        console.log("Vendors seeded.");

        // Seed Products
        console.log("Seeding Products...");
        for (const mockProduct of mockDB.products) {
            try {
                const { _id, supplier, ...productData } = mockProduct;
                // Map supplier mock ID to real ObjectId
                productData.supplier = userMap[supplier] || userMap['user2']; // fallback to Alice

                const newProduct = await Product.create(productData);
                productMap[_id] = newProduct._id;
            } catch (prodErr) {
                console.error(`Error creating product ${mockProduct.name}:`, prodErr.message);
                throw prodErr;
            }
        }
        console.log(`Seeded ${Object.keys(productMap).length} products.`);

        // Seed Orders
        console.log("Seeding Orders...");
        for (const mockOrder of mockDB.orders) {
            try {
                const { _id, userId, vendorId, items, totalPrice, status: mockStatus, ...orderData } = mockOrder;

                // Map vendorId (which is the buyer in this context usually) and supplierId
                // In mock, vendorId is the target vendor shop, but Order model expects User references
                const buyerId = userMap[userId] || userMap['user1'];
                const supplierId = userMap['user2']; // Alice is the supplier in mock products

                const mappedItems = items.map(item => ({
                    productId: productMap['prod1'], // simple mapping for mock
                    name: item.productName,
                    price: item.price,
                    quantity: item.quantity
                }));

                // Capitalize status to match enum: "Pending", "Processing", "Shipped", "Delivered", "Cancelled"
                let status = mockStatus || "Pending";
                status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

                await Order.create({
                    vendorId: buyerId,
                    supplierId: supplierId,
                    items: mappedItems,
                    totalAmount: totalPrice || 0,
                    ...orderData,
                    status: status
                });
            } catch (orderErr) {
                console.error(`Error creating order for user ${mockOrder.userId}:`, orderErr.message);
                throw orderErr;
            }
        }
        console.log("Orders seeded.");

        console.log("Database seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding database:", err);
        process.exit(1);
    }
};

seedDatabase();
