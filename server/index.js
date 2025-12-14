// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs"); // 引入 fs 模組，用於檢查 dist 資料夾

// Import Models
const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");

const app = express();

// 修正 1：將備用端口從 3000 改為 8080，確保 Cloud Run 啟動成功
const PORT = process.env.PORT || 8080;

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
    // 雖然這裡會 console.error，但最好確保應用程式不會因為連線失敗而終止
    .catch((err) => console.error("⚠️ 資料庫連線失敗，請檢查 MONGO_URI 和 IP 白名單:", err)); 
} else {
  console.warn("⚠️ 未設定 MONGO_URI 環境變數，資料庫功能將無法使用");
}

// ==========================================
// ECPay Config (使用 APP_URL 環境變數作為回傳網址)
// ==========================================
// 部署到 Cloud Run 後，必須將 APP_URL 設定為公開網址
const APP_URL = process.env.APP_URL;
const FALLBACK_URL = APP_URL || "http://localhost:8080"; // 本地測試時使用 8080

const ECPayConf = {
  MerchantID: process.env.ECPAY_MERCHANT_ID || "3002607",
  HashKey: process.env.ECPAY_HASH_KEY || "pwFHCqoQZGmho4w6",
  HashIV: process.env.ECPAY_HASH_IV || "EkRm7iFT261dpevs",
  Gateway: "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5",
  ReturnURL: `${FALLBACK_URL}/api/payment/return`,
  ClientBackURL: `${FALLBACK_URL}/#/orders`, // 修改為 hash router 路徑
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
    if (!MONGO_URI) throw new Error("資料庫未連線");
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. 登入
app.post("/api/login", async (req, res) => {
  try {
    if (!MONGO_URI) throw new Error("資料庫未連線");
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
    if (!MONGO_URI) throw new Error("資料庫未連線");
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
    if (!MONGO_URI) throw new Error("資料庫未連線");
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
    if (!MONGO_URI) throw new Error("資料庫未連線");
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
    if (!MONGO_URI) throw new Error("資料庫未連線");
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
    if (!MONGO_URI) throw new Error("資料庫未連線");
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

// 8. 查詢訂單 (修正排序邏輯)
app.get("/api/orders/:email", async (req, res) => {
  try {
    if (!MONGO_URI) throw new Error("資料庫未連線");
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
    if (!MONGO_URI) throw new Error("資料庫未連線");
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

// ==========================================
// 🚀 Production 靜態檔案設定
// ==========================================
// 使用 fs 檢查 dist 資料夾是否存在，以確定是否運行在生產模式
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  // 1. 提供 React 靜態檔案
  app.use(express.static(distPath));

  // 修正 2：將 app.get('*', ...) 改為 app.get('/*', ...)，避免 path-to-regexp 錯誤
  // 2. 所有非 API 的請求，都回傳 index.html (讓 React Router 接手)
  app.get('/*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`後端伺服器運作中: http://localhost:${PORT}`);
});