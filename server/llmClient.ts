import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
// Reference: blueprint:javascript_openai_ai_integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
    console.log(`[LLM] Calling with ${messages.length} messages, maxTokens: ${options?.maxTokens || 8192}`);
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      max_completion_tokens: options?.maxTokens || 8192,
      ...(options?.jsonMode && { response_format: { type: "json_object" } }),
    });

    const content = response.choices[0]?.message?.content || "";
    console.log(`[LLM] Response length: ${content.length} characters`);
    if (!content) {
      console.error("[LLM] Warning: Empty response from OpenAI");
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
  const retries = options?.retries || 3;
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      return await callLLM(messages, options);
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError || new Error("فشل الاتصال بالخدمة الذكية");
}
