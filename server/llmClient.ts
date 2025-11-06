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
  fileData?: {
    mimeType: string;
    data: Buffer;
  };
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
  const conversationParts: Array<{ role: "user" | "model"; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }> = [];
  
  for (const msg of messages) {
    if (msg.role === "system") {
      // For system messages mid-conversation, prepend to NEXT user message
      if (conversationParts.length > 0 && conversationParts[conversationParts.length - 1].role === "user") {
        // If last was user, we have a problem - can't have two user messages in a row
        // Prepend to the last user message instead
        const lastUserMsg = conversationParts[conversationParts.length - 1];
        const firstPart = lastUserMsg.parts[0];
        if (firstPart.text) {
          firstPart.text = msg.content + "\n\n" + firstPart.text;
        }
      } else {
        // Accumulate for next user message
        systemPrompt += (systemPrompt ? "\n\n" : "") + msg.content;
      }
    } else if (msg.role === "user") {
      const userText = (systemPrompt ? systemPrompt + "\n\n" : "") + msg.content;
      systemPrompt = ""; // Reset after using
      
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      
      // Add file data if present (for resume uploads, images, etc.)
      if (msg.fileData) {
        parts.push({
          inlineData: {
            mimeType: msg.fileData.mimeType,
            data: msg.fileData.data.toString('base64')
          }
        });
      }
      
      // Add text content
      parts.push({ text: userText });
      
      conversationParts.push({
        role: "user",
        parts
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

// Apply conversation windowing - only keep last N messages to manage token count
function applyConversationWindowing(messages: LLMMessage[], windowSize: number = 10): LLMMessage[] {
  if (messages.length <= windowSize + 1) { // +1 for system message
    return messages;
  }

  // Always keep system message (first message) if it exists
  const systemMessages = messages.filter(m => m.role === "system");
  const conversationMessages = messages.filter(m => m.role !== "system");

  // Take last N conversation messages
  const windowedConversation = conversationMessages.slice(-windowSize);

  return [...systemMessages, ...windowedConversation];
}

// Estimate token count (rough approximation)
function estimateTokenCount(messages: LLMMessage[]): number {
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  // Rough estimate: 1 token ≈ 4 characters for mixed Arabic/English
  return Math.ceil(totalChars / 4);
}

export async function callLLM(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    applyWindowing?: boolean;
  }
): Promise<string> {
  try {
    // Apply conversation windowing if enabled (default: true)
    const applyWindowing = options?.applyWindowing !== false;
    const windowedMessages = applyWindowing ? applyConversationWindowing(messages, 10) : messages;
    
    const tokenEstimate = estimateTokenCount(windowedMessages);
    console.log(`[LLM] Calling Gemini with ${windowedMessages.length} messages (windowed from ${messages.length}), estimated tokens: ${tokenEstimate}, maxTokens: ${options?.maxTokens || 8192}`);
    
    const geminiMessages = convertMessagesToGeminiFormat(windowedMessages);
    
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
    
    // Return fallback if empty response
    if (!content || content.trim().length === 0) {
      console.error("[LLM] Warning: Empty response from Gemini, using fallback");
      return "عذراً، حدث خطأ في معالجة طلبك. يُرجى المحاولة مرة أخرى.";
    }
    
    return content;
  } catch (error: any) {
    console.error("LLM Error:", error);
    
    // Check if it's a rate limit error
    const isRateLimit = isRateLimitError(error);
    
    // Create structured error with Arabic message
    const structuredError = new Error(
      isRateLimit 
        ? "لقد تجاوزت الحد المسموح من الطلبات للخدمة الذكية. يُرجى المحاولة لاحقاً."
        : "عذراً، حدث خطأ في الاتصال بالخدمة الذكية. يُرجى المحاولة مرة أخرى."
    ) as any;
    
    // Attach metadata for retry logic
    structuredError.originalError = error;
    structuredError.status = error?.status || error?.statusCode;
    structuredError.isRateLimit = isRateLimit;
    structuredError.code = isRateLimit ? 'RATE_LIMIT' : 'LLM_ERROR';
    
    throw structuredError;
  }
}

export async function callLLMWithRetry(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    retries?: number;
    applyWindowing?: boolean;
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
        // For non-rate-limit errors, create an abort error (don't retry)
        const abortError = new Error(error.message) as any;
        abortError.name = 'AbortError';
        throw abortError;
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
