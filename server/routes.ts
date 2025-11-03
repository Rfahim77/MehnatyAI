import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { callLLMWithRetry, type LLMMessage } from "./llmClient";
import { SYSTEM_PROMPT, getChatPrompt } from "./prompts";
import {
  extractText,
  parseResumeJson,
  rewriteBulletsAr,
  recommendPathKsa,
  scoreVsJD,
  exportDocx,
  exportPdf,
} from "./tools";
import {
  type ChatRequest,
  type ChatResponse,
  type ExtractTextResponse,
  type ParseResumeResponse,
  type RewriteBulletsRequest,
  type RewriteBulletsResponse,
  type RecommendPathRequest,
  type RecommendPathResponse,
  type ScoreVsJDRequest,
  type ScoreVsJDResponse,
  type ExportRequest,
  type Session,
  type Card,
  type ChatMessage,
  type CardType,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Main chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        message,
        path,
        sessionId,
        resumeJson,
        targetJob,
        jdText,
        tone,
      } = req.body as ChatRequest;

      // Get or create session
      let session = await storage.getSession(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          cards: [],
          language: "ar",
          createdAt: Date.now(),
          lastActivity: Date.now(),
          messages: [],
        };
        await storage.createSession(session);
      }

      // Update session with new data if provided
      if (resumeJson) {
        await storage.updateSession(sessionId, { resumeJson });
        session = await storage.getSession(sessionId);
      }
      if (targetJob) {
        await storage.updateSession(sessionId, { targetJob });
        session = await storage.getSession(sessionId);
      }
      if (jdText) {
        await storage.updateSession(sessionId, { jdText });
        session = await storage.getSession(sessionId);
      }
      if (tone) {
        await storage.updateSession(sessionId, { tone });
        session = await storage.getSession(sessionId);
      }

      // Store user message in session
      const userMessage: ChatMessage = {
        id: randomUUID(),
        role: "user",
        content: message,
        timestamp: Date.now(),
      };
      await storage.addMessageToSession(sessionId, userMessage);

      // Refetch session to get updated messages including the new one
      const sessionWithNewMessage = await storage.getSession(sessionId);

      // Build conversation history for LLM (now includes the current message)
      const conversationHistory: LLMMessage[] = sessionWithNewMessage!.messages?.map(msg => ({
        role: msg.role,
        content: msg.content,
      })) || [];

      // Build context for LLM
      const pathContext = getChatPrompt(path);
      const sessionContext = sessionWithNewMessage!.resumeJson
        ? `\n\nالسيرة الذاتية الحالية للمستخدم متوفرة في الجلسة.`
        : "";

      // System message with context
      const systemMessage = SYSTEM_PROMPT + (pathContext ? `\n\n${pathContext}` : "") + sessionContext;

      // Call LLM with full conversation history (including current message)
      const messages: LLMMessage[] = [
        { role: "system", content: systemMessage },
        ...conversationHistory,
      ];

      console.log(`[Chat] Sending ${messages.length} messages to LLM for path: ${path || 'none'}`);
      let response = await callLLMWithRetry(messages, { maxTokens: 2048 });
      console.log(`[Chat] Received response length: ${response.length}`);
      
      // Fallback if LLM returns empty response
      if (!response || response.trim().length === 0) {
        console.error("[Chat] Empty response from LLM, using fallback");
        response = "عذراً، حدث خطأ في معالجة طلبك. يُرجى المحاولة مرة أخرى أو إعادة صياغة السؤال.";
      }

      // Store assistant message
      const assistantMessage: ChatMessage = {
        id: randomUUID(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      await storage.addMessageToSession(sessionId, assistantMessage);

      // Generate cards based on the pathway and session data
      const cards: Card[] = [];
      const updatedSession = await storage.getSession(sessionId);

      // Pathway-specific card generation
      if (path && updatedSession) {
        try {
          switch (path) {
            case "resume_review":
              if (updatedSession.resumeJson) {
                const reviewMd = await generateResumeReview(updatedSession.resumeJson);
                const card: Card = {
                  id: randomUUID(),
                  type: "resume",
                  title: "مراجعة السيرة الذاتية",
                  content: reviewMd,
                  metadata: { version: 1 },
                  createdAt: Date.now(),
                };
                cards.push(card);
                await storage.addCardToSession(sessionId, card);
              }
              break;

            case "tailor_to_job":
              if (updatedSession.resumeJson && updatedSession.jdText) {
                // Generate JD match analysis card
                const scoreMd = await scoreVsJD(updatedSession.resumeJson, updatedSession.jdText);
                const matchCard: Card = {
                  id: randomUUID(),
                  type: "jd_match",
                  title: "تحليل التطابق مع الوظيفة",
                  content: scoreMd.matchSummary,
                  metadata: { targetJob: updatedSession.targetJob },
                  createdAt: Date.now(),
                };
                cards.push(matchCard);
                await storage.addCardToSession(sessionId, matchCard);

                // Generate rewritten bullets card if we have target job and tone
                if (updatedSession.targetJob) {
                  const toneToUse = updatedSession.tone || "professional";
                  const rewrittenMd = await rewriteBulletsAr(
                    updatedSession.resumeJson,
                    updatedSession.targetJob,
                    toneToUse
                  );
                  const bulletsCard: Card = {
                    id: randomUUID(),
                    type: "bullets",
                    title: "نقاط الخبرة المعاد صياغتها",
                    content: rewrittenMd,
                    metadata: { targetJob: updatedSession.targetJob, tone: toneToUse },
                    createdAt: Date.now(),
                  };
                  cards.push(bulletsCard);
                  await storage.addCardToSession(sessionId, bulletsCard);
                }
              }
              break;

            case "future_plan":
              if (updatedSession.resumeJson && updatedSession.targetJob) {
                const planMd = await recommendPathKsa(updatedSession.resumeJson, updatedSession.targetJob);
                const card: Card = {
                  id: randomUUID(),
                  type: "career_plan",
                  title: `خطة المسار الوظيفي - ${updatedSession.targetJob}`,
                  content: planMd,
                  metadata: { targetJob: updatedSession.targetJob },
                  createdAt: Date.now(),
                };
                cards.push(card);
                await storage.addCardToSession(sessionId, card);
              }
              break;

            case "cover_letter":
              if (updatedSession.resumeJson && updatedSession.targetJob) {
                const coverLetterMd = await generateCoverLetter(
                  updatedSession.resumeJson,
                  updatedSession.targetJob
                );
                const card: Card = {
                  id: randomUUID(),
                  type: "cover_letter",
                  title: "خطاب التعريف",
                  content: coverLetterMd,
                  metadata: { targetJob: updatedSession.targetJob },
                  createdAt: Date.now(),
                };
                cards.push(card);
                await storage.addCardToSession(sessionId, card);
              }
              break;

            case "skills_gap":
              if (updatedSession.resumeJson && updatedSession.targetJob) {
                const gapsMd = await analyzeSkillsGap(updatedSession.resumeJson, updatedSession.targetJob);
                const card: Card = {
                  id: randomUUID(),
                  type: "career_plan",
                  title: "تحليل فجوات المهارات",
                  content: gapsMd,
                  metadata: { targetJob: updatedSession.targetJob },
                  createdAt: Date.now(),
                };
                cards.push(card);
                await storage.addCardToSession(sessionId, card);
              }
              break;

            case "interview":
              if (updatedSession.resumeJson && updatedSession.targetJob) {
                const interviewMd = await generateInterviewPrep(
                  updatedSession.resumeJson,
                  updatedSession.targetJob
                );
                const card: Card = {
                  id: randomUUID(),
                  type: "interview_prep",
                  title: "تحضير المقابلة",
                  content: interviewMd,
                  metadata: { targetJob: updatedSession.targetJob },
                  createdAt: Date.now(),
                };
                cards.push(card);
                await storage.addCardToSession(sessionId, card);
              }
              break;

            case "build_from_zero":
              // For building from scratch, conversation helps gather info
              // No card needed until resume data is collected
              break;
          }
        } catch (error) {
          console.error("Error generating cards:", error);
          // Continue without cards if generation fails
        }
      }

      const chatResponse: ChatResponse = {
        reply: response,
        cards: cards.length > 0 ? cards : undefined,
        session: {
          id: sessionId,
          resumeJson: updatedSession?.resumeJson,
          targetJob: updatedSession?.targetJob,
          tone: updatedSession?.tone,
        },
      };

      res.json(chatResponse);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({
        error: "حدث خطأ أثناء معالجة الرسالة",
      });
    }
  });

  // Extract text from file
  app.post("/api/tools/extract_text", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع ملف" });
      }

      const result = await extractText(req.file.buffer, req.file.mimetype);

      const response: ExtractTextResponse = {
        text: result.text,
        meta: result.meta,
      };

      res.json(response);
    } catch (error) {
      console.error("Extract text error:", error);
      res.status(500).json({ error: "فشل استخراج النص من الملف" });
    }
  });

  // Parse resume to JSON
  app.post("/api/tools/parse_resume_json", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "النص مطلوب" });
      }

      const result = await parseResumeJson(text);

      const response: ParseResumeResponse = {
        resumeJson: result.resumeJson,
        issues: result.issues,
      };

      res.json(response);
    } catch (error) {
      console.error("Parse resume error:", error);
      res.status(500).json({ error: "فشل تحليل السيرة الذاتية" });
    }
  });

  // Rewrite bullets in Arabic
  app.post("/api/tools/rewrite_bullets_ar", async (req, res) => {
    try {
      const { resumeJson, targetJob, tone } = req.body as RewriteBulletsRequest;

      if (!resumeJson || !targetJob || !tone) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      }

      const markdown = await rewriteBulletsAr(resumeJson, targetJob, tone);

      const response: RewriteBulletsResponse = { markdown };
      res.json(response);
    } catch (error) {
      console.error("Rewrite bullets error:", error);
      res.status(500).json({ error: "فشل إعادة كتابة نقاط الخبرة" });
    }
  });

  // Recommend career path for KSA
  app.post("/api/tools/recommend_path_ksa", async (req, res) => {
    try {
      const { resumeJson, targetJob } = req.body as RecommendPathRequest;

      if (!resumeJson || !targetJob) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      }

      const planMd = await recommendPathKsa(resumeJson, targetJob);

      const response: RecommendPathResponse = { planMd };
      res.json(response);
    } catch (error) {
      console.error("Recommend path error:", error);
      res.status(500).json({ error: "فشل إنشاء خطة المسار الوظيفي" });
    }
  });

  // Score resume vs job description
  app.post("/api/tools/score_vs_jd", async (req, res) => {
    try {
      const { resumeJson, jdText } = req.body as ScoreVsJDRequest;

      if (!resumeJson || !jdText) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      }

      const result = await scoreVsJD(resumeJson, jdText);

      const response: ScoreVsJDResponse = result;
      res.json(response);
    } catch (error) {
      console.error("Score vs JD error:", error);
      res.status(500).json({ error: "فشل مقارنة السيرة مع وصف الوظيفة" });
    }
  });

  // Export to DOCX/PDF
  app.post("/api/tools/export", async (req, res) => {
    try {
      const { markdown, format, filename, rtl } = req.body as ExportRequest;

      if (!markdown || !format || !filename) {
        return res.status(400).json({ error: "جميع الحقول مطلوبة" });
      }

      if (format === "pdf") {
        const buffer = await exportPdf(markdown, rtl);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
        res.send(buffer);
      } else {
        const buffer = await exportDocx(markdown, rtl);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}.docx"`);
        res.send(buffer);
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "فشل تصدير الملف" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for card generation
async function generateResumeReview(resumeJson: any): Promise<string> {
  const prompt = `راجع السيرة الذاتية التالية وقدم تقييماً شاملاً:

${JSON.stringify(resumeJson, null, 2)}

المطلوب (بتنسيق Markdown):
## نقاط القوة
## نقاط للتحسين
## اقتراحات عملية`;

  return await callLLMWithRetry(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    { maxTokens: 2048 }
  );
}

async function generateCoverLetter(resumeJson: any, targetJob: string): Promise<string> {
  const prompt = `اكتب خطاب تعريف مخصص بالعربية للوظيفة: "${targetJob}"

بناءً على السيرة: ${resumeJson.name} - ${resumeJson.experience.map((e: any) => e.title).join(", ")}

المطلوب: خطاب احترافي بالعربية، 3-4 فقرات، يبرز الخبرات ذات الصلة.`;

  return await callLLMWithRetry(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    { maxTokens: 2048 }
  );
}

async function analyzeSkillsGap(resumeJson: any, targetJob: string): Promise<string> {
  const prompt = `حلل فجوات المهارات للانتقال إلى وظيفة: "${targetJob}"

المهارات الحالية: ${resumeJson.skills.join(", ")}

المطلوب (Markdown):
## المهارات المطلوبة
## الفجوات الحالية
## خطة سد الفجوات (موارد تعليمية محددة)`;

  return await callLLMWithRetry(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    { maxTokens: 2048 }
  );
}

async function generateInterviewPrep(resumeJson: any, targetJob: string): Promise<string> {
  const prompt = `قدم تحضير شامل للمقابلة للوظيفة: "${targetJob}"

خبرة المرشح: ${resumeJson.experience.map((e: any) => `${e.title} في ${e.company}`).join(", ")}
المهارات: ${resumeJson.skills.join(", ")}

المطلوب (Markdown):
## أسئلة المقابلة المتوقعة
## نصائح للإجابة
## نقاط القوة التي يجب إبرازها`;

  return await callLLMWithRetry(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    { maxTokens: 2048 }
  );
}
