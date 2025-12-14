# 1. 建置前端與依賴 (Builder Stage)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# 安裝所有依賴
RUN npm install
COPY . .
# 執行 Vite Build (產生 dist 資料夾)
RUN npm run build

# 2. 執行環境 (Production Stage)
FROM node:20-alpine
WORKDIR /app

# 修正 1：僅複製生產環境所需的依賴 (而不是重新執行 npm install)
# 確保 node_modules 已經存在於 /app/node_modules
COPY --from=builder /app/node_modules ./node_modules 

# 修正 2：複製後端程式碼 (包含 server/index.js)
COPY server ./server

# 複製打包好的前端檔案
COPY --from=builder /app/dist ./dist

# 複製其他必要檔案 (metadata.json)
COPY metadata.json ./

# 複製 package.json (如果後端有動態載入依賴，這個比較安全)
COPY package*.json ./ 

# 設定環境變數 (您的這部分是正確的)
ENV NODE_ENV=production
ENV PORT=8080

# 開放 Port
EXPOSE 8080

# 啟動伺服器 (指向 server/index.js)
CMD ["node", "server/index.js"]