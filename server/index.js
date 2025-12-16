// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");

// Import Models
const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");

const app = express();
// Cloud Run 會自動注入 PORT 環境變數，預設通常是 8080
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI; 

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("🔗 資料庫連線成功"))
    .catch((err) => console.error("資料庫連線失敗:", err));
} else {
  console.warn("⚠️ 未設定 MONGO_URI，資料庫功能將無法使用");
}

// ==========================================
// ECPay Config
// ==========================================
const APP_URL = process.env.APP_URL || "http://localhost:5173"; 

const ECPayConf = {
  MerchantID: process.env.ECPAY_MERCHANT_ID || "3002607",
  HashKey: process.env.ECPAY_HASH_KEY || "pwFHCqoQZGmho4w6",
  HashIV: process.env.ECPAY_HASH_IV || "EkRm7iFT261dpevs",
  Gateway: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  ReturnURL: `${APP_URL}/api/payment/return`, 
  ClientBackURL: `${APP_URL}/#/orders`, 
};

// --- 綠界加密輔助函式 ---
function generateCheckMacValue(params) {
  const keys = Object.keys(params).sort();
  let rawStr = `HashKey=${ECPayConf.HashKey}`;
  keys.forEach((key) => {
    rawStr += `&${key}=${params[key]}`;
  });
  rawStr += `&HashIV=${ECPayConf.HashIV}`;

  let encodedStr = encodeURIComponent(rawStr).toLowerCase();

  encodedStr = encodedStr
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%20/g, "+");

  const sha256 = crypto.createHash("sha256").update(encodedStr).digest("hex");
  return sha256.toUpperCase();
}

// --- API Routes ---

// 1. 取得所有產品
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. 登入
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: "帳號或密碼錯誤" });
    }

    res.json({
      message: "登入成功",
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        profile: user.profile,
        coupons: user.coupons,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 3. 註冊
app.post("/api/register", async (req, res) => {
  try {
    const { email, name, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "此信箱已被註冊" });
    }

    const userId = `USR-${Date.now().toString().slice(-6)}${Math.floor(
      Math.random() * 90 + 10
    )}`;
    const newUser = await User.create({
      userId,
      email,
      name,
      password,
      profile: { skinType: "", hairType: "" },
      coupons: [],
    });

    res.status(201).json({
      message: "註冊成功",
      user: {
        id: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        coupons: [],
      },
    });
  } catch (error) {
    res.status(500).json({ message: "伺服器錯誤" });
  }
});

// 4. 更新個人檔案
app.put("/api/users/profile", async (req, res) => {
  try {
    const { email, skinType, hairType } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "找不到使用者" });

    const isFirstTime =
      !user.profile.skinType &&
      !user.profile.hairType &&
      (skinType || hairType);

    user.profile.skinType = skinType;
    user.profile.hairType = hairType;

    let message = "個人資料已更新";
    if (isFirstTime) {
      user.coupons.push({
        id: `CPN-${Date.now()}`,
        code: "WELCOME100",
        amount: 100,
        description: "會員資料填寫禮",
      });
      message = "資料已儲存！已發送 $100 折價券 🎉";
    }

    await user.save();
    res.json({
      message,
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        profile: user.profile,
        coupons: user.coupons,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "更新失敗" });
  }
});

// 5. 消耗折價券
app.post("/api/users/coupon/use", async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "找不到使用者" });

    const newCoupons = user.coupons.filter((c) => c.code !== code);
    if (newCoupons.length === user.coupons.length) {
      return res.status(400).json({ message: "無效的折價券" });
    }

    user.coupons = newCoupons;
    await user.save();
    res.json({ message: "折價券已使用", coupons: user.coupons });
  } catch (error) {
    res.status(500).json({ message: "操作失敗" });
  }
});

// 6. 新增折價券
app.post("/api/users/coupon/add", async (req, res) => {
  try {
    const { email, code, amount, description } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "找不到使用者" });

    user.coupons.push({
      id: `CPN-${Date.now()}`,
      code,
      amount: Number(amount),
      description: description || "活動贈品",
    });
    await user.save();
    res.json({ message: "發送成功", coupons: user.coupons });
  } catch (error) {
    res.status(500).json({ message: "發送失敗" });
  }
});

// 7. 建立訂單
app.post("/api/orders", async (req, res) => {
  try {
    const orderData = req.body;
    const merchantTradeNo = `ORD${Date.now()}`;

    const newOrder = await Order.create({
      orderId: merchantTradeNo,
      userId: orderData.userId || "guest",
      userEmail: orderData.userEmail || "guest",
      items: orderData.items,
      subtotal: orderData.subtotal || 0,
      discount: orderData.discount || 0,
      total: orderData.total,
      shippingFee: orderData.shippingFee,
      shippingDetails: orderData.shippingDetails,
      status: "pending",
    });

    res.status(201).json({
      message: "訂單建立成功",
      orderId: newOrder.orderId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "訂單建立失敗" });
  }
});

// 8. 查詢訂單
app.get("/api/orders/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const orders = await Order.find({ userEmail: email }).sort({
      date: -1, 
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "無法取得訂單資料" });
  }
});

// 9. 綠界 - 產生表單
app.post("/api/payment/checkout", async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ message: "找不到訂單" });
    }

    const date = new Date();
    const tradeDate =
      date.getFullYear() +
      "/" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "/" +
      ("0" + date.getDate()).slice(-2) +
      " " +
      ("0" + date.getHours()).slice(-2) +
      ":" +
      ("0" + date.getMinutes()).slice(-2) +
      ":" +
      ("0" + date.getSeconds()).slice(-2);

    const baseParams = {
      MerchantID: ECPayConf.MerchantID,
      MerchantTradeNo: order.orderId,
      MerchantTradeDate: tradeDate,
      PaymentType: "aio",
      TotalAmount: order.total.toString(),
      TradeDesc: "GlowAndShineBeauty",
      ItemName: "美妝保養商品一批",
      ReturnURL: ECPayConf.ReturnURL,
      ClientBackURL: ECPayConf.ClientBackURL,
      ChoosePayment: "ALL",
      EncryptType: "1",
    };

    const checkMacValue = generateCheckMacValue(baseParams);
    const finalParams = { ...baseParams, CheckMacValue: checkMacValue };

    const html = `
      <form id="ecpay-form" action="${ECPayConf.Gateway}" method="POST">
        ${Object.keys(finalParams)
          .map(
            (key) =>
              `<input type="hidden" name="${key}" value="${finalParams[key]}" />`
          )
          .join("")}
      </form>
      <script>document.getElementById("ecpay-form").submit();</script>
    `;

    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send("建立付款請求失敗");
  }
});

// 10. 綠界 - 接收結果
app.post("/api/payment/return", async (req, res) => {
  try {
    console.log("綠界回傳:", req.body);
    const { RtnCode, MerchantTradeNo } = req.body;

    if (RtnCode === "1") {
      await Order.findOneAndUpdate(
        { orderId: MerchantTradeNo },
        {
          status: "paid",
          paidAt: new Date(),
        }
      );
      res.send("1|OK");
    } else {
      res.send("0|ErrorMessage");
    }
  } catch (error) {
    console.error(error);
    res.send("0|Error");
  }
});

// 11. 提供前端 Gemini API Key (解決 GCP 部署時環境變數無法注入前端的問題)
app.get("/api/config/genai", (req, res) => {
  // 修改：優先讀取 GEMINI_API_KEY，如果沒有則讀取 API_KEY (相容舊設定)
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Server missing GEMINI_API_KEY or API_KEY env var");
    return res.status(500).json({ message: "Server API Key not found" });
  }
  res.json({ apiKey });
});

// ==========================================
// 🚀 Production 靜態檔案設定
// ==========================================
if (process.env.NODE_ENV === 'production') {
  // Dockerfile 將 dist 複製到了 /app/dist
  // 而 server 執行在 /app/server
  // 所以相對路徑是 ../dist
  const distPath = path.join(__dirname, '../dist');
  
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// 監聽 0.0.0.0 以確保 Cloud Run 健康檢查通過
app.listen(PORT, "0.0.0.0", () => {
  console.log(`後端伺服器運作中: http://0.0.0.0:${PORT}`);
});