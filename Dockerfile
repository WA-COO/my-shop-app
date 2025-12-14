# ----------------------------------------------------
# 1. 建置前端與後端依賴 (Builder Stage)
# ----------------------------------------------------
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # 步驟 A: 複製並安裝後端依賴
    # 複製 server/ 的 package.json 到根目錄 /app/，用於安裝後端依賴
    COPY server/package.json ./ 
    RUN npm install
    # 註解: 這樣做會將後端依賴安裝到 /app/node_modules
    
    # 步驟 B: 複製前端 package.json 並安裝依賴
    # 複製 client/ 的 package.json 到 /app/client/
    COPY client/package.json ./client/
    # 進入 client/ 安裝前端依賴到 /app/client/node_modules
    WORKDIR /app/client
    RUN npm install
    # 工作目錄回到根目錄
    WORKDIR /app
    
    # 步驟 C: 複製所有程式碼
    # 複製 client/ 和 server/ 資料夾
    COPY client/ ./client/
    COPY server/ ./server/
    
    # 步驟 D: 執行前端建置
    WORKDIR /app/client
    RUN npm run build 
    
    # ----------------------------------------------------
    # 2. 執行環境 (Production Stage) - 運行後端 Express
    # ----------------------------------------------------
    FROM node:20-alpine
    # 設定最終執行目錄
    WORKDIR /app
    
    # 修正 1：複製後端依賴 (位於 /app/node_modules)
    # Express 運行時需要這些模組
    COPY --from=builder /app/node_modules ./node_modules 
    
    # 修正 2：複製後端程式碼
    COPY server ./server
    
    # 修正 3：複製打包好的前端檔案
    # 來源: /app/client/dist (建置結果)
    # 目的地: /app/dist (供 Express 伺服器提供服務)
    COPY --from=builder /app/client/dist ./dist
    
    # 設定環境變數
    ENV NODE_ENV=production
    ENV PORT=8080
    
    # 開放 Port
    EXPOSE 8080
    
    # 啟動伺服器 (指向 server/index.js)
    CMD ["node", "server/index.js"]