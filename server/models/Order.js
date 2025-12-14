const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: String }, // 新增會員編號 (如果是 Guest 則為 null 或 guest)
  userEmail: { type: String, required: true },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  subtotal: Number, // 新增小計
  discount: Number, // 新增折扣金額
  shippingFee: Number,
  total: Number,    // 總金額 (totalAmount)
  status: { type: String, default: 'pending' },
  // 明確定義結構，確保有收件人姓名
  shippingDetails: {
    lastName: String,
    firstName: String,
    phone: String,
    city: String,
    address: String,
    paymentMethod: String
  },
  date: { type: Date, default: Date.now }, // 原本的 date 其實應該是 createdAt
  paidAt: Date,      // 新增
  shippedAt: Date,   // 新增
  completedAt: Date, // 新增
});

module.exports = mongoose.model('Order', orderSchema);