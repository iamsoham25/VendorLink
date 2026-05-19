require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const plain = await User.find({ password: { $not: /^\$2/ } });
    console.log('plain users', plain.map(u => u.email));
    for (const u of plain) {
      u.password = await bcrypt.hash(u.password, 10);
      await u.save();
      console.log('hashed', u.email);
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
})();
