const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // 為了對應前端 id
  name: { type: String, required: true },
  category: { type: String, required: true }, // skincare, makeup, hair
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  gallery: [String], // 新增：額外的商品展示圖片 (例如質地圖、情境圖)
  features: [String] // 直接存陣列，不用像 SQL 轉 JSON
});

module.exports = mongoose.model('Product', productSchema);