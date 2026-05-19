require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log('total users', users.length);
    const hashed = users.filter(u => typeof u.password === 'string' && u.password.startsWith('$2'));
    console.log('hashed count', hashed.length);
    hashed.forEach(u => console.log('hashed ->', u.email, u.password));
    const plain = users.filter(u => !(typeof u.password === 'string' && u.password.startsWith('$2')));
    console.log('plain count', plain.length);
    plain.forEach(u => console.log('plain ->', u.email, u.password));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
})();
