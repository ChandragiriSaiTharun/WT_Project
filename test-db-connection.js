require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing database connection...');
console.log('MongoDB URI exists:', process.env.MONGODB_URI ? 'Yes' : 'No');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
}).then(() => {
  console.log('✅ Database connected successfully!');
  mongoose.connection.close();
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
