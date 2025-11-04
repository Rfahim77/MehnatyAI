import { GoogleGenAI } from "@google/genai";
import pRetry from "p-retry";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access without requiring your own API key.
// Reference: blueprint:javascript_gemini_ai_integrations
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Helper function to check if error is rate limit or quota violation
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// Convert LLMMessage format to Gemini format
function convertMessagesToGeminiFormat(messages: LLMMessage[]) {
  // Gemini expects alternating user/model turns after system message
  // We need to merge system messages and handle the conversation properly
  
  let systemPrompt = "";
  const conversationParts: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  
  for (const msg of messages) {
    if (msg.role === "system") {
      // Accumulate system messages
      systemPrompt += (systemPrompt ? "\n\n" : "") + msg.content;
    } else if (msg.role === "user") {
      conversationParts.push({
        role: "user",
        parts: [{ text: msg.content }]
      });
    } else if (msg.role === "assistant") {
      conversationParts.push({
        role: "model",
        parts: [{ text: msg.content }]
      });
    }
  }
  
  // If we have a system prompt, prepend it to the first user message
  if (systemPrompt && conversationParts.length > 0 && conversationParts[0].role === "user") {
    conversationParts[0].parts[0].text = systemPrompt + "\n\n" + conversationParts[0].parts[0].text;
  } else if (systemPrompt && conversationParts.length === 0) {
    // If there's only a system message, treat it as a user message
    conversationParts.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
  }
  
  return conversationParts;
}

export async function callLLM(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  try {
    console.log(`[LLM] Calling Gemini with ${messages.length} messages, maxTokens: ${options?.maxTokens || 8192}`);
    
    const geminiMessages = convertMessagesToGeminiFormat(messages);
    
    const config: any = {
      maxOutputTokens: options?.maxTokens || 8192,
    };
    
    if (options?.jsonMode) {
      config.responseMimeType = "application/json";
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: geminiMessages,
      config,
    });

    const content = response.text || "";
    console.log(`[LLM] Response length: ${content.length} characters`);
    if (!content) {
      console.error("[LLM] Warning: Empty response from Gemini");
    }
    return content;
  } catch (error) {
    console.error("LLM Error:", error);
    throw new Error("فشل الاتصال بالخدمة الذكية");
  }
}

export async function callLLMWithRetry(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    retries?: number;
  }
): Promise<string> {
  const retries = options?.retries || 7;
  
  return await pRetry(
    async () => {
      try {
        return await callLLM(messages, options);
      } catch (error: any) {
        // Check if it's a rate limit error
        if (isRateLimitError(error)) {
          throw error; // Rethrow to trigger p-retry
        }
        // For non-rate-limit errors, throw immediately (don't retry)
        throw new pRetry.AbortError(error);
      }
    },
    {
      retries,
      minTimeout: 2000,
      maxTimeout: 128000,
      factor: 2,
    }
  );
}
