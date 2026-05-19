# VendorLink - B2B Food & Raw Material Marketplace

VendorLink is a comprehensive B2B platform designed to connect street food vendors with raw material suppliers. It features a robust marketplace, a recommendation system, real-time inventory tracking, and AI-powered price prediction.

---

## 🚀 How to Run VendorLink (Detailed Steps)

Follow these steps to get the project running on a new device from scratch.

### 1. Prerequisites
Ensure you have **Node.js** and **npm** installed on your machine.
- [Download Node.js](https://nodejs.org/) (Recommended version: 18.x or higher)

### 2. Project Setup
Open your terminal (Command Prompt, PowerShell, or Terminal) and navigate to the project directory.

```bash
cd VendorLink_Project-main
```

### 3. Install Dependencies
Navigate into the `server` folder and install the required backend packages.

```bash
cd server
npm install
```

### 4. Environment Configuration
The project needs a `.env` file in the `server` directory to manage settings. You can create one manually or copy from the example.

**Create a file named `.env` in the `server` folder with the following content:**
```env
PORT=5000
MONGODB_URI=
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5000
NODE_ENV=development
```
*(Note: Leaving `MONGODB_URI` empty will cause the server to use its built-in **Mock Database**, which is perfect for testing without a database setup.)*

### 5. Start the Application
Run the following command while still in the `server` directory:

```bash
npm run dev
```

### 6. Access the Application
Once the server starts (you'll see a message like `Server running on port 5000`), open your web browser and go to:

**[http://localhost:5000](http://localhost:5000)**

---

## 🔑 Demo Credentials
Use these accounts to explore the different roles in VendorLink:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Vendor** | `john@example.com` | `password123` |
| **Supplier** | `alice@restaurant.com` | `password123` |
| **Customer** | `bob@shop.com` | `password123` |

---

## 🛠️ Project Structure
- **/server**: Node.js/Express backend, API routes, controllers, and models.
- **/frontend**: Static HTML, CSS, and Vanilla JavaScript for the user interface.
- **/ml_price_api**: Placeholder for the AI/ML price prediction logic.
- **DOCUMENTATION_INDEX.md**: Detailed guides for specific features.

---

## 🔮 Future Roadmap & Improvements
Here are some suggestions for taking this project to the next level:

### 🌟 High Priority
1. **Real-Time Chat**: Implement the WebSocket-based messaging system between vendors and suppliers.
2. **Real Database Integration**: Connect to a MongoDB Atlas cluster for persistent data storage.
3. **Payment Gateway**: Integrate Stripe or Razorpay for actual transaction processing.
4. **Enhanced Search**: Add advanced filtering (by distance, rating, or price) in the marketplace.

### 🍱 User Experience
5. **Vendor Verification**: Add a process for suppliers to upload business documents for a "Verified" badge.
6. **Delivery Tracking**: Integrate a maps API to show real-time order status.
7. **Mobile App**: Convert the web app into a Progressive Web App (PWA) or a React Native mobile app.

### 🧠 AI & Advanced Features
8. **Demand Forecasting**: Use historic order data to predict future inventory needs for vendors.
9. **Smart Notifications**: Push notifications for price drops on watched items.

---

Developed with ❤️ for the VendorLink Community.
