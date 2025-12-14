const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // 新增會員編號 (例如 USR-17154321)
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  profile: {
    skinType: { type: String, default: '' },
    hairType: { type: String, default: '' }
  },
  coupons: [{
    id: String,
    code: String,
    amount: Number,
    description: String
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);