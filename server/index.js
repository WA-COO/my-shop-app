// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { GoogleGenAI } = require("@google/genai"); // Import Gemini SDK

// Import Models
const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Gemini Client (Backend Side)
// 優先讀取 GEMINI_API_KEY，相容 API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
let ai = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.error("❌ Server missing GEMINI_API_KEY. AI features will not work.");
}

// 健康檢查路由
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

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

// 11. 【新功能】Gemini Chat API (Backend Stream)
app.post("/api/chat", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ message: "AI Service Not Configured" });
  }

  const { message, userProfile, history } = req.body;

  try {
    // A. 讀取最新產品庫存
    const products = await Product.find();
    let productContext = "";
    if (products.length > 0) {
      productContext = products.map(p => 
        `- 商品名稱: ${p.name} (ID: ${p.id})\n  價格: $${p.price}\n  類別: ${p.category}\n  描述: ${p.description}\n  特色: ${p.features?.join(', ')}`
      ).join('\n\n');
    } else {
      productContext = "Currently, the store inventory is empty.";
    }

    // B. 建構 Prompt
    let personalContext = "";
    if (userProfile && (userProfile.skinType || userProfile.hairType)) {
       const skin = userProfile.skinType ? `User Skin Type: ${userProfile.skinType}` : "Unknown";
       const hair = userProfile.hairType ? `User Hair Type: ${userProfile.hairType}` : "Unknown";
       personalContext = `\nUSER PROFILE:\n- Skin: ${skin}\n- Hair: ${hair}\n\nINSTRUCTION: Prioritize products that match the user's skin and hair type.`;
    }

    const systemInstruction = `
      You are "GlowBot", the professional AI beauty consultant for "Glow & Shine" store.
      
      === CURRENT INVENTORY (LIVE DATABASE) ===
      ${productContext}
      =========================================

      ${personalContext}

      === RESPONSE RULES ===
      1. **Tone**: Warm, professional, encouraging (use emojis like 🌸, ✨).
      2. **Length**: Keep responses concise (under 4 sentences) unless explaining a detailed routine.
      3. **Language**: Traditional Chinese (繁體中文).
      4. **Product Recommendations**: 
         - Only recommend products listed in the CURRENT INVENTORY above.
         - When you mention a specific product, you MUST append its ID in this hidden tag format: <<<ID>>>.
         - Example: "我非常推薦您試試 **極致保濕精華** <<<p1>>>，它能深層補水。"
      5. If the inventory is empty or the user asks about products not sold here, politely inform them we don't carry that item.
    `;

    // C. 啟動 Chat Session
    // 這裡我們每次建立新 Session，若要支援上下文，前端需傳入 history (Content[])
    // 為了簡單起見，我們這裡假設是一次性回答，或依賴前端傳送完整的對話 (若前端有實作)
    // 但因為本案例主要為「產品諮詢」，單輪對話 + System Prompt 通常足夠。
    // 若要支援歷史紀錄，可使用 history 參數初始化 chats.create
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history || []
    });

    // D. 發送訊息並處理串流回應
    const result = await chat.sendMessageStream({ message });

    // 設定 Headers 支援串流
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    
    res.end();

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    res.status(500).write("抱歉，我現在有點忙碌，請稍後再試。");
    res.end();
  }
});


// ==========================================
// 🚀 Production 靜態檔案設定
// ==========================================
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  
  if (fs.existsSync(distPath)) {
    console.log(`✅ 靜態檔案目錄存在: ${distPath}`);
    app.use(express.static(distPath));

    app.get('/*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.error(`❌ 找不到靜態檔案目錄: ${distPath}。請確認 Docker Build 流程。`);
  }
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`後端伺服器運作中: http://0.0.0.0:${PORT}`);
});