# ----------------------------------------------------
# 1. 建置前端與後端依賴 (Builder Stage)
# ----------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# 複製根目錄 package.json (用於後端依賴)
# 假設所有依賴都在根目錄的 package.json 中
COPY package*.json ./
RUN npm install

# 複製前端 package.json (如果前端有獨立的 package.json)
# 🚨 根據您的結構，如果 client/ 下有 package.json，請將下面兩行解除註釋
COPY client/package*.json ./client/
RUN npm install --prefix ./client

# 複製所有程式碼
COPY . .

# 執行前端建置 (Vite Build)
# 🚨 必須在 client/ 目錄下執行建置命令
WORKDIR /app/client
RUN npm run build 

# ----------------------------------------------------
# 2. 執行環境 (Production Stage) - 運行後端 Express
# ----------------------------------------------------
FROM node:20-alpine
WORKDIR /app

# 修正 1：複製根目錄的 node_modules (後端 Express 所需)
COPY --from=builder /app/node_modules ./node_modules 

# 修正 2：複製後端程式碼
COPY server ./server

# 修正 3：複製打包好的前端檔案 (位於 client/dist)
# 我們需要將 client/dist 複製到根目錄下的 dist，供後端存取
COPY --from=builder /app/client/dist ./dist

# 複製 package.json (讓 Express 存取，如果需要)
COPY package*.json ./

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8080

# 開放 Port
EXPOSE 8080

# 修正 4：啟動伺服器 (工作目錄回到根目錄，啟動 server/index.js)
WORKDIR /app
CMD ["node", "server/index.js"]