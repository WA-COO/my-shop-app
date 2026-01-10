const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_12345";

const verifyToken = (req, res, next) => {
  const tokenHeader = req.headers["authorization"];

  if (!tokenHeader) {
    return res.status(403).json({ message: "未提供認證 Token" });
  }

  // Format should be "Bearer <token>"
  const token = tokenHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Token 格式錯誤" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token 無效或已過期" });
    }
    
    // 將解碼後的使用者資訊存入 req.user，供後續路由使用
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
