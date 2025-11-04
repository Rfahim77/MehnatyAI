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
  const statusCode = error?.status || error?.statusCode || 0;
  
  return (
    statusCode === 429 ||
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.includes("RESOURCE_EXHAUSTED") ||
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
      // For system messages mid-conversation, prepend to NEXT user message
      if (conversationParts.length > 0 && conversationParts[conversationParts.length - 1].role === "user") {
        // If last was user, we have a problem - can't have two user messages in a row
        // Prepend to the last user message instead
        const lastUserMsg = conversationParts[conversationParts.length - 1];
        lastUserMsg.parts[0].text = msg.content + "\n\n" + lastUserMsg.parts[0].text;
      } else {
        // Accumulate for next user message
        systemPrompt += (systemPrompt ? "\n\n" : "") + msg.content;
      }
    } else if (msg.role === "user") {
      const userText = (systemPrompt ? systemPrompt + "\n\n" : "") + msg.content;
      systemPrompt = ""; // Reset after using
      conversationParts.push({
        role: "user",
        parts: [{ text: userText }]
      });
    } else if (msg.role === "assistant") {
      conversationParts.push({
        role: "model",
        parts: [{ text: msg.content }]
      });
    }
  }
  
  // If we have leftover system prompt and no user messages, treat it as a user message
  if (systemPrompt && conversationParts.length === 0) {
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
    
    if (options?.temperature !== undefined) {
      config.temperature = options.temperature;
    }
    
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
  } catch (error: any) {
    console.error("LLM Error:", error);
    // Preserve original error for retry logic
    const isRateLimit = isRateLimitError(error);
    const arabicError = new Error("فشل الاتصال بالخدمة الذكية") as any;
    // Attach original error metadata for retry detection
    arabicError.originalError = error;
    arabicError.status = error?.status || error?.statusCode;
    arabicError.isRateLimit = isRateLimit;
    throw arabicError;
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
        // Check if it's a rate limit error (using attached metadata)
        const isRateLimit = error?.isRateLimit || isRateLimitError(error?.originalError || error);
        
        if (isRateLimit) {
          console.log("[LLM] Rate limit detected, will retry...");
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
      onFailedAttempt: (error) => {
        console.log(`[LLM] Retry attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
      }
    }
  );
}
