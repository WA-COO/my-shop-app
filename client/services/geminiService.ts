import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { API_BASE_URL } from "../constants";
import { UserProfile, Product } from "../types";

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private chatSession: Chat | null = null;

  constructor() {
    // 不要在 Constructor 直接初始化，因為生產環境 process.env 變數可能為空
  }

  // 初始化方法：確保取得 API Key
  private async initAI() {
    if (this.ai) return;

    // 修改：同時支援 GEMINI_API_KEY 和 API_KEY
    // 注意：這裡讀取的是前端 Build 時注入的變數 (Local 開發通常會有)
    let apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    // 如果前端環境變數沒有 Key (例如 Production 環境)，則嘗試從後端獲取
    if (!apiKey) {
      try {
        const response = await fetch(`${API_BASE_URL}/config/genai`);
        if (response.ok) {
          const data = await response.json();
          apiKey = data.apiKey;
        }
      } catch (error) {
        console.error("Failed to fetch API Key from server:", error);
      }
    }

    if (!apiKey) {
      throw new Error("Missing Gemini API Key. Please check server configuration (GEMINI_API_KEY).");
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  public async startChat(userProfile?: UserProfile) {
    // 確保 AI 實例已初始化
    await this.initAI();

    if (!this.ai) throw new Error("AI Initialization Failed");

    let productContext = "";

    try {
      // 1. Fetch live products from Backend API
      const response = await fetch(`${API_BASE_URL}/products`);
      if (response.ok) {
        const products: Product[] = await response.json();
        
        if (products.length > 0) {
          productContext = products.map(p => 
            `- 商品名稱: ${p.name} (ID: ${p.id})\n  價格: $${p.price}\n  類別: ${p.category}\n  描述: ${p.description}\n  特色: ${p.features?.join(', ')}`
          ).join('\n\n');
        } else {
          productContext = "Currently, the store inventory is empty.";
        }
      } else {
        console.warn("AI failed to fetch live products via API.");
        productContext = "System Error: Unable to retrieve product list.";
      }
    } catch (error) {
      console.error("GeminiService Fetch Error:", error);
      productContext = "System Error: Unable to connect to product database.";
    }

    // 2. Build personalized instruction based on user profile
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

    this.chatSession = this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
    });
  }

  public async sendMessageStream(message: string): Promise<AsyncIterable<string>> {
    // 確保 AI 實例已初始化
    await this.initAI();

    if (!this.chatSession) {
      await this.startChat();
    }

    if (!this.chatSession) {
        throw new Error("Failed to initialize chat session");
    }

    const result = await this.chatSession.sendMessageStream({ message });
    
    // Generator to yield text chunks
    async function* textGenerator(stream: AsyncIterable<GenerateContentResponse>) {
      for await (const chunk of stream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    }

    return textGenerator(result);
  }
}

export const geminiService = new GeminiService();