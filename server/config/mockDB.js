// config/mockDB.js - Mock database for testing without MongoDB
// This creates in-memory mock data structures that mimic MongoDB models

const mockDB = {
  // Mock Users collection
  users: [
    {
      _id: "user1",
      username: "john_vendor",
      name: "John Vendor",
      email: "john@example.com",
      password: "password123",
      role: "vendor",
      preferences: {
        categories: ["Vegetables", "Dairy", "Spices"],
        priceRange: { min: 10, max: 1000 },
        location: "Mumbai"
      },
      createdAt: new Date()
    },
    {
      _id: "user2",
      username: "alice_restaurant",
      name: "Alice Restaurant",
      email: "alice@restaurant.com",
      password: "password123",
      role: "supplier",
      preferences: {
        categories: ["Meat", "Vegetables", "Grains"],
        priceRange: { min: 50, max: 5000 },
        location: "Delhi"
      },
      createdAt: new Date()
    },
    {
      _id: "user3",
      username: "bob_shop",
      name: "Bob Shop",
      email: "bob@shop.com",
      password: "password123",
      role: "vendor",
      preferences: {
        categories: ["Dairy", "Grains", "Fruits"],
        priceRange: { min: 20, max: 2000 },
        location: "Bangalore"
      },
      createdAt: new Date()
    },
    {
      _id: "user4",
      username: "john_customer",
      name: "John Customer",
      email: "john@example.com",
      password: "password123",
      role: "customer",
      preferences: {
        categories: ["Vegetables", "Dairy", "Spices"],
        priceRange: { min: 10, max: 1000 },
        location: "Mumbai"
      },
      createdAt: new Date()
    },
    {
      _id: "user5",
      username: "alice_customer",
      name: "Alice Customer",
      email: "alice@restaurant.com",
      password: "password123",
      role: "customer",
      preferences: {
        categories: ["Meat", "Vegetables", "Grains"],
        priceRange: { min: 50, max: 5000 },
        location: "Delhi"
      },
      createdAt: new Date()
    },
    {
      _id: "user6",
      username: "bob_customer",
      name: "Bob Customer",
      email: "bob@shop.com",
      password: "password123",
      role: "customer",
      preferences: {
        categories: ["Dairy", "Grains", "Fruits"],
        priceRange: { min: 20, max: 2000 },
        location: "Bangalore"
      },
      createdAt: new Date()
    }
  ],

  // Mock Vendors collection
  vendors: [
    {
      _id: "vendor1",
      shopName: "Fresh Vegetables Direct",
      email: "fresh@veg.com",
      phone: "9876543210",
      category: "Vegetables",
      location: "Mumbai",
      address: "123 Market Street, Mumbai",
      rating: 4.5,
      totalOrders: 150,
      responseTime: "2 hours",
      priceRange: { min: 10, max: 500 },
      description: "Direct from farms, fresh produce delivered daily",
      imageUrl: "https://via.placeholder.com/300",
      createdAt: new Date()
    },
    {
      _id: "vendor2",
      shopName: "Premium Dairy Farm",
      email: "dairy@farm.com",
      phone: "9876543211",
      category: "Dairy",
      location: "Mumbai",
      address: "456 Dairy Lane, Mumbai",
      rating: 4.7,
      totalOrders: 220,
      responseTime: "1 hour",
      priceRange: { min: 50, max: 1000 },
      description: "Pure, organic dairy products from certified farms",
      imageUrl: "https://via.placeholder.com/300",
      createdAt: new Date()
    },
    {
      _id: "vendor3",
      shopName: "Spice King",
      email: "spices@king.com",
      phone: "9876543212",
      category: "Spices",
      location: "Mumbai",
      address: "789 Spice Market, Mumbai",
      rating: 4.3,
      totalOrders: 180,
      responseTime: "3 hours",
      priceRange: { min: 20, max: 800 },
      description: "Authentic Indian spices, bulk orders available",
      imageUrl: "https://via.placeholder.com/300",
      createdAt: new Date()
    },
    {
      _id: "vendor4",
      shopName: "Organic Fruits Hub",
      email: "fruits@organic.com",
      phone: "9876543213",
      category: "Fruits",
      location: "Delhi",
      address: "321 Fruit Bazaar, Delhi",
      rating: 4.6,
      totalOrders: 200,
      responseTime: "1.5 hours",
      priceRange: { min: 30, max: 900 },
      description: "Seasonal, organic fruits delivered fresh",
      imageUrl: "https://via.placeholder.com/300",
      createdAt: new Date()
    },
    {
      _id: "vendor5",
      shopName: "Grain Wholesale",
      email: "grains@wholesale.com",
      phone: "9876543214",
      category: "Grains",
      location: "Bangalore",
      address: "654 Wholesale Center, Bangalore",
      rating: 4.4,
      totalOrders: 160,
      responseTime: "2.5 hours",
      priceRange: { min: 25, max: 700 },
      description: "Wholesale prices on all grains and cereals",
      imageUrl: "https://via.placeholder.com/300",
      createdAt: new Date()
    },
    {
      _id: "vendor6",
      shopName: "Meat Masters",
      email: "meat@masters.com",
      phone: "9876543215",
      category: "Meat",
      location: "Delhi",
      address: "987 Butcher Lane, Delhi",
      rating: 4.5,
      totalOrders: 140,
      responseTime: "2 hours",
      priceRange: { min: 100, max: 2000 },
      description: "Premium quality meat, hygienically processed",
      imageUrl: "https://via.placeholder.com/300",
      createdAt: new Date()
    }
  ],

  // Mock Suppliers collection (for supplier marketplace)
  suppliers: [
    {
      _id: "supplier1",
      businessName: "Safal (Mother Dairy)",
      name: "Safal Foods",
      email: "safal@motherdairy.com",
      phone: "+91 11-2747-3747",
      role: "supplier",
      businessType: "Producer",
      location: "Delhi NCR",
      city: "Delhi",
      products: ["Fresh Potatoes", "Iceberg Lettuce", "Tomatoes", "Onions", "Pickles"],
      capacity: 500,
      leadTime: "1 day",
      rating: 4.6,
      reviewCount: 892,
      verified: true,
      available: true,
      specialties: "FSSAI Certified, Daily Fresh, 100+ Outlets",
      website: "www.motherdairy.com",
      createdAt: new Date()
    },
    {
      _id: "supplier2",
      businessName: "Amul",
      name: "Amul Dairy",
      email: "amul@amul.com",
      phone: "+91 2692-258-041",
      role: "supplier",
      businessType: "Manufacturer",
      location: "Anand, Gujarat",
      city: "Anand",
      products: ["Cheddar Cheese Slices", "Mozzarella", "American Cheese", "Butter", "Cream"],
      capacity: 2000,
      leadTime: "2-3 days",
      rating: 4.8,
      reviewCount: 2341,
      verified: true,
      available: true,
      specialties: "Largest Dairy Cooperative, ISO Certified, 50+ Years",
      website: "www.amul.com",
      createdAt: new Date()
    },
    {
      _id: "supplier3",
      businessName: "Ramesh Kumar - Local Vegetable Farmer",
      name: "Ramesh Kumar",
      email: "ramesh.farmer@gmail.com",
      phone: "+91 9448234567",
      role: "supplier",
      businessType: "Farmer",
      location: "Bangalore Rural, Karnataka",
      city: "Bangalore",
      products: ["Fresh Potatoes", "Tomatoes", "Onions", "Lettuce", "Coriander"],
      capacity: 100,
      leadTime: "1 day",
      rating: 4.4,
      reviewCount: 67,
      verified: true,
      available: true,
      specialties: "Organic Farming, Direct from Farm, No Pesticides",
      supportType: "Small Farmer Support",
      createdAt: new Date()
    },
    {
      _id: "supplier4",
      businessName: "Britannia Industries",
      name: "Britannia Bakery",
      email: "contact@britannia.co.in",
      phone: "+91 80-6624-2000",
      role: "supplier",
      businessType: "Bakery",
      location: "Bangalore, Karnataka",
      city: "Bangalore",
      products: ["Burger Buns", "Sesame Seed Buns", "Brioche Buns", "Whole Wheat Buns"],
      capacity: 1500,
      leadTime: "1 day",
      rating: 4.5,
      reviewCount: 1567,
      verified: true,
      available: true,
      specialties: "100+ Years Heritage, National Distribution",
      website: "www.britannia.co.in",
      createdAt: new Date()
    },
    {
      _id: "supplier5",
      businessName: "Godrej Tyson Foods",
      name: "Godrej Tyson",
      email: "info@godrejtyson.com",
      phone: "+91 22-6172-8000",
      role: "supplier",
      businessType: "Processor",
      location: "Mumbai, Maharashtra",
      city: "Mumbai",
      products: ["Chicken Patties", "Veggie Patties", "Bacon Strips", "Sausages"],
      capacity: 800,
      leadTime: "2 days",
      rating: 4.4,
      reviewCount: 743,
      verified: true,
      available: true,
      specialties: "FSSAI Approved, Cold Chain Logistics",
      website: "www.godrejtyson.com",
      createdAt: new Date()
    }
  ],
  orders: [
    {
      _id: "order1",
      userId: "user1",
      vendorId: "vendor1",
      items: [{ productName: "Tomatoes", quantity: 5, price: 50 }],
      totalPrice: 50,
      status: "delivered",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "order2",
      userId: "user1",
      vendorId: "vendor2",
      items: [{ productName: "Milk", quantity: 2, price: 100 }],
      totalPrice: 100,
      status: "delivered",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "order3",
      userId: "user1",
      vendorId: "vendor3",
      items: [{ productName: "Turmeric", quantity: 1, price: 150 }],
      totalPrice: 150,
      status: "delivered",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "order4",
      userId: "user2",
      vendorId: "vendor2",
      items: [{ productName: "Butter", quantity: 3, price: 200 }],
      totalPrice: 200,
      status: "delivered",
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "order5",
      userId: "user2",
      vendorId: "vendor6",
      items: [{ productName: "Chicken", quantity: 2, price: 400 }],
      totalPrice: 400,
      status: "delivered",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "order6",
      userId: "user3",
      vendorId: "vendor5",
      items: [{ productName: "Rice", quantity: 10, price: 250 }],
      totalPrice: 250,
      status: "delivered",
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "order7",
      userId: "user3",
      vendorId: "vendor4",
      items: [{ productName: "Apples", quantity: 5, price: 200 }],
      totalPrice: 200,
      status: "delivered",
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "order8",
      userId: "user1",
      vendorId: "vendor2",
      items: [{ productName: "Yogurt", quantity: 4, price: 120 }],
      totalPrice: 120,
      status: "delivered",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ],

  // Mock Reviews collection
  reviews: [
    {
      _id: "review1",
      userId: "user1",
      vendorId: "vendor1",
      rating: 5,
      comment: "Fresh vegetables, excellent quality",
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "review2",
      userId: "user1",
      vendorId: "vendor2",
      rating: 5,
      comment: "Best dairy products in the market",
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "review3",
      userId: "user2",
      vendorId: "vendor6",
      rating: 4,
      comment: "Good quality meat, fast delivery",
      createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
    },
    {
      _id: "review4",
      userId: "user3",
      vendorId: "vendor5",
      rating: 4,
      comment: "Affordable grains, reliable vendor",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  ],

  // Mock Payments collection (used when no real DB available)
  payments: [],

  // Mock Products collection
  products: [
    {
      _id: "prod1",
      supplier: "user2",
      name: "Organic Whole Wheat",
      price: 120,
      category: "Grains",
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
      inStock: true,
      createdAt: new Date()
    },
    {
      _id: "prod2",
      supplier: "user2",
      name: "Farm Fresh Milk",
      price: 65,
      category: "Dairy",
      image: "https://images.unsplash.com/photo-1563636619-e910f01859ec?auto=format&fit=crop&w=800&q=80",
      inStock: true,
      createdAt: new Date()
    }
  ],

  // Helper methods to simulate Mongoose operations
  async findUserById(userId) {
    return this.users.find(u => u._id === userId);
  },

  async findVendorById(vendorId) {
    return this.vendors.find(v => v._id === vendorId);
  },

  async findAllVendors() {
    return this.vendors;
  },

  async findOrdersByUserId(userId) {
    return this.orders.filter(o => o.userId === userId);
  },

  async findOrdersByVendorId(vendorId) {
    return this.orders.filter(o => o.vendorId === vendorId);
  },

  async findReviewsByVendorId(vendorId) {
    return this.reviews.filter(r => r.vendorId === vendorId);
  },

  async findReviewsByUserId(userId) {
    return this.reviews.filter(r => r.userId === userId);
  },

  async findPaymentByRazorpayId(rid) {
    return this.payments.find(p => p.razorpayOrderId === rid);
  },

  async findPaymentByOrderId(oid) {
    return this.payments.find(p => p.order === oid);
  }
};

module.exports = mockDB;
