const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected");

        const userData = {
            name: "John Vendor",
            username: "john_vendor",
            email: "john@example.com",
            password: "password123",
            role: "vendor",
            preferences: {
                categories: ["Vegetables", "Dairy", "Spices"],
                priceRange: { min: 10, max: 1000 },
                location: "Mumbai"
            }
        };

        try {
            await User.create(userData);
            console.log("Success");
        } catch (e) {
            console.log("Error type:", typeof e);
            console.log("Error name:", e.name);
            console.log("Error message:", e.message);
            if (e.errors) {
                Object.keys(e.errors).forEach(key => {
                    console.log(`Field '${key}': ${e.errors[key].message}`);
                });
            } else {
                console.log("Full error:", JSON.stringify(e, null, 2));
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

test();
