const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const id = '69c89f892466426899a9484f';
    const u = await User.findById(id).lean();
    console.log('user', u);
    const sups = await User.find({ role: 'supplier' }).limit(20).lean();
    console.log('suppliers count', sups.length);
    console.log('supplier IDs:', sups.map(x => x._id));
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
})();