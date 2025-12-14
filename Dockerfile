# ==========================================
# Stage 1: 前端建置 (Frontend Build)
# ==========================================
FROM node:20-alpine as build-stage

# 設定工作目錄為 /app/client
WORKDIR /app/client

# 1. 先複製 package.json 安裝依賴 (利用 Docker Cache 加速)
COPY client/package*.json ./
RUN npm install

# 2. 複製前端所有程式碼
COPY client/ .

# 3. 執行建置 (產出 dist 資料夾)
# 注意：Vite 編譯時會嘗試讀取 API_KEY，若無 .env 則為空字串，
# 這通常沒問題，因為您的程式碼有做 fallback 處理。
RUN npm run build

# ==========================================
# Stage 2: 後端運行 (Backend Runtime)
# ==========================================
FROM node:20-alpine as production-stage

# 設定工作目錄為 /app
WORKDIR /app

# 1. 複製後端 package.json 到 /app/server
COPY server/package*.json ./server/

# 切換到後端目錄安裝依賴
WORKDIR /app/server
RUN npm install --production

# 2. 複製後端所有程式碼
COPY server/ .

# 3. 關鍵步驟：將 Stage 1 建置好的前端檔案 (dist) 複製過來
# server/index.js 預設會去讀取 ../dist，所以我們將它複製到 /app/dist
COPY --from=build-stage /app/client/dist ../dist

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8080

# 開放連接埠 (Cloud Run 預設為 8080)
EXPOSE 8080

# 啟動後端伺服器
CMD ["node", "index.js"]