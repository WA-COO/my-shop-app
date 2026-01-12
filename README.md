# Glow & Shine Beauty Store (美妝保養電商平台)

一個結合 **AI 智能導購** 的全端美妝購物平台。使用者可以瀏覽商品、加入購物車、進行綠界金流結帳，並透過 Google Gemini 驅動的聊天機器人獲得個人化的保養建議。

## ✨ 特色功能 (Features)

- **🛍️ 完整購物流程**：商品瀏覽、關鍵字/模糊搜尋、購物車管理、訂單結帳。
- **🤖 AI 美妝顧問 (GlowBot)**：
  - 串接 **Google Gemini API**。
  - 即時讀取後端 MongoDB 庫存，根據使用者膚質/髮質推薦現有商品。
  - 支援串流 (Streaming) 回覆，體驗流暢。
- **💳 金流整合**：整合 **綠界科技 (ECPay)** 第三方支付 (測試環境)。
- **👤 會員系統**：註冊/登入、JWT 驗證、個人膚質資料設定、訂單歷史查詢。
- **🎁 優惠券系統**：根據使用者活動自動發送優惠券。
- **📱 響應式設計**：支援手機與桌面版面 (RWD)。

## 🛠️ 技術棧 (Tech Stack)

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide React.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **AI**: Google Gemini SDK (`@google/genai`).
- **Payment**: ECPay (綠界金流).
- **Image Hosting**: Google Cloud Storage (GCS Buckets).
- **Deployment**: Docker, Google Cloud Run (GCP).
- **Testing**: Vitest, Playwright, Supertest.

## 📂 專案結構 (Project Structure)

本專案採用前後端分離架構：

```
.
├── Dockerfile           # 容器化部署設定
├── README.md            # 專案說明文件
├── client/              # 前端應用程式 (React + Vite)
│   ├── components/      # UI 元件 (ChatBot, Navbar...)
│   ├── contexts/        # Global State (Auth, Cart...)
│   ├── pages/           # 頁面路由
│   ├── services/        # API 服務 (Gemini AI)
│   ├── types.ts         # TypeScript 類型定義
│   ├── constants.ts     # 全域變數與常數
│   ├── tests/           # 單元與整合測試 (Vitest)
│   ├── e2e/            # 端對端測試 (Playwright)
│   ├── index.html       # 入口 HTML
│   ├── index.tsx        # 入口 TypeScript
│   ├── vite.config.ts   # Vite 設定
│   └── ...
└── server/              # 後端 API 伺服器 (Express)
    ├── middleware/      # 權限驗證與邏輯過濾
    ├── models/          # MongoDB Schema
    ├── tests/           # API 整合測試 (Vitest)
    ├── index.js         # 伺服器入口點
    └── seed.js          # 資料庫初始化腳本
```

## 🚀 快速開始 (Getting Started)

### 1. 環境變數設定 (.env)

請在 **`server`** 資料夾內建立 `.env` 檔案，填入以下資訊：

**`server/.env`**:
```env
# Backend Configuration
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/beauty-store
APP_URL=http://localhost:5173

# AI Configuration (Gemini)
GEMINI_API_KEY=your_google_gemini_api_key

# ECPay Configuration (Testing)
ECPAY_MERCHANT_ID=3002607
ECPAY_HASH_KEY=pwFHCqoQZGmho4w6
ECPAY_HASH_IV=EkRm7iFT261dpevs
```

*(注意：前端 `client` 預設會透過 Proxy 連線至後端，因此本地開發時 **不需要** 額外設定前端環境變數)*

### 2. 啟動後端 (Backend)

開啟一個終端機 (Terminal)，進入 `server` 資料夾：

```bash
cd server
npm install

# 初始化資料庫 (匯入預設商品資料)
node seed.js

# 啟動伺服器 (Port 3000)
node index.js
# 或使用 nodemon 進行開發 (若有安裝)
# npx nodemon index.js
```

### 3. 啟動前端 (Frontend)

開啟另一個終端機 (Terminal)，進入 `client` 資料夾：

```bash
cd client
npm install

# 啟動開發伺服器
npm run dev
```

前端頁面將運行於 `http://localhost:5173`。

## 🐳 Docker 部署

本專案包含 `Dockerfile`，可建置包含前後端的完整映像檔。

```bash
# 在專案根目錄執行
docker build -t beauty-store .

# 執行 Container
docker run -p 8080:8080 -e MONGO_URI=... -e GEMINI_API_KEY=... beauty-store
```

## 🧪 自動化測試 (Testing)

建立了三層式自動化測試架構，確保系統穩定性。

### 1. 單元測試 (Unit Tests)
測試前端元件與邏輯。

```bash
cd client
npm test
```

### 2. 後端測試 (Backend Tests)
測試 API 接口與資料庫邏輯。

```bash
cd server
npm test
```

### 3. 端對端測試 (E2E Tests)
模擬真實使用者操作 (需先啟動後端伺服器)。

```bash
cd client
npx playwright test
# 或使用 UI 模式除錯
npx playwright test --ui
```