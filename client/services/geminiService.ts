import { API_BASE_URL } from "../constants";
import { UserProfile } from "../types";

export class GeminiService {
  private userProfile: UserProfile | null = null;
  // 我們可以暫存最後一次對話的歷史，若需要更複雜的記憶功能，需要調整後端
  // 這裡為了保持與原 UI 相容，我們主要負責轉發訊息

  constructor() {}

  public async startChat(userProfile?: UserProfile) {
    // 這裡不再初始化 AI 客戶端，僅儲存使用者偏好供後續請求使用
    if (userProfile) {
      this.userProfile = userProfile;
    }
  }

  public async sendMessageStream(message: string): Promise<AsyncIterable<string>> {
    const payload = {
      message,
      userProfile: this.userProfile,
      // history: [] // 如果需要上下文記憶，可以從 ChatBot 元件傳入歷史紀錄
    };

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok || !response.body) {
      throw new Error("Failed to connect to AI server");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 建立一個 Generator 來產生串流文字
    async function* streamGenerator() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // decode the chunk and yield it
          const chunkText = decoder.decode(value, { stream: true });
          yield chunkText;
        }
      } finally {
        reader.releaseLock();
      }
    }

    return streamGenerator();
  }
}

export const geminiService = new GeminiService();
