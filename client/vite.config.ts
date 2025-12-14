import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// 修正 ESM 環境下沒有 __dirname 的問題
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // 載入環境變數 (通常 Docker 建置時不會有 .env，這裡主要是為了本地開發)
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 5173,
        host: '0.0.0.0', // 允許 Docker 或外部連線
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        // 為了避免 undefined 造成 build 錯誤，這裡加個安全判斷
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // 修正 alias 指向
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
      }
    };
});