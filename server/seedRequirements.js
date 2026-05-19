require("dotenv").config();
const mongoose = require("mongoose");
const Requirement = require("./models/Requirement");
const User = require("./models/User");

const seedRequirements = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");

        // Find a vendor to associate requirements with
        const vendor = await User.findOne({ role: "vendor" });
        if (!vendor) {
            console.error("No vendor found in database. Please run general seed first.");
            process.exit(1);
        }

        const requirements = [
            {
                vendorId: vendor._id,
                title: "Premium Iceberg Lettuce for Burger King",
                vendorName: "Burger King India",
                vendorLocation: "Bangalore, Karnataka",
                material: "Vegetables",
                quantity: "500 kg weekly",
                budget: 85000,
                requiredBy: new Date("2026-03-10"),
                postedDate: new Date("2026-02-28"),
                urgency: "high",
                verified: true,
                description: "Urgent requirement for premium quality iceberg lettuce for our Bangalore clusters. Must be hydroponically grown.",
                requirementsList: "Iceberg Lettuce, Romaine Lettuce"
            },
            {
                vendorId: vendor._id,
                title: "Oat Milk Supply for Starbucks India",
                vendorName: "Starbucks (Tata Alliance)",
                vendorLocation: "Mumbai, Maharashtra",
                material: "Cheese",
                quantity: "1000 Liters monthly",
                budget: 120000,
                requiredBy: new Date("2026-03-15"),
                postedDate: new Date("2026-02-27"),
                urgency: "normal",
                verified: true,
                description: "Seeking a reliable supplier for barista-grade oat milk for our Mumbai stores.",
                requirementsList: "Oat Milk (Barista Edition)"
            },
            {
                vendorId: vendor._id,
                title: "Fresh Baked Buns for Subway India",
                vendorName: "Subway India",
                vendorLocation: "Delhi NCR",
                material: "Buns",
                quantity: "2000 units daily",
                budget: 55000,
                requiredBy: new Date("2026-03-05"),
                postedDate: new Date("2026-02-28"),
                urgency: "high",
                verified: true,
                description: "Daily requirement for fresh baked honey oat and parmesan oregano buns.",
                requirementsList: "Honey Oat, Parmesan Oregano, Italian Plain"
            },
            {
                vendorId: vendor._id,
                title: "Amul Mozzarella for Domino's Pizza",
                vendorName: "Domino's Pizza (Jubilant)",
                vendorLocation: "Chennai, Tamil Nadu",
                material: "Cheese",
                quantity: "1000 kg",
                budget: 250000,
                requiredBy: new Date("2026-03-20"),
                postedDate: new Date("2026-02-25"),
                urgency: "normal",
                verified: true,
                description: "Bulk requirement for Mozzarella cheese for our Chennai hub.",
                requirementsList: "Mozzarella Cheese, Cheese Bursts"
            },
            {
                vendorId: vendor._id,
                title: "Potato Wedges for KFC India",
                vendorName: "KFC India (Devyani)",
                vendorLocation: "Hyderabad, Telangana",
                material: "Fries",
                quantity: "500 kg",
                budget: 40000,
                requiredBy: new Date("2026-03-08"),
                postedDate: new Date("2026-02-28"),
                urgency: "high",
                verified: false,
                description: "Urgent need for seasoned potato wedges for our South India cluster.",
                requirementsList: "Seasoned Potato Wedges"
            },
            {
                vendorId: vendor._id,
                title: "Tomato Ketchup for Haldiram's",
                vendorName: "Haldiram's Foods",
                vendorLocation: "Nagpur, Maharashtra",
                material: "Sauces",
                quantity: "5000 sachets daily",
                budget: 15000,
                requiredBy: new Date("2026-03-12"),
                postedDate: new Date("2026-02-27"),
                urgency: "normal",
                verified: true,
                description: "Looking for customized tomato ketchup sachets for our snack boxes.",
                requirementsList: "Tomato Ketchup Sachets (5g)"
            },
            {
                vendorId: vendor._id,
                title: "Organic Whole Milk for Blue Tokai",
                vendorName: "Blue Tokai Coffee Roasters",
                vendorLocation: "Gurgaon, Haryana",
                material: "Cheese",
                quantity: "200 Liters daily",
                budget: 65000,
                requiredBy: new Date("2026-03-02"),
                postedDate: new Date("2026-02-28"),
                urgency: "high",
                verified: true,
                description: "Priority requirement for organic, non-homogenized whole milk for our Gurgaon specialty cafes.",
                requirementsList: "Whole Milk, Skimmed Milk"
            }
        ];

        await Requirement.deleteMany({});
        await Requirement.insertMany(requirements);
        console.log("Successfully seeded 3 requirements!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding requirements:", error);
        process.exit(1);
    }
};

seedRequirements();
