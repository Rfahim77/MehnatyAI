import type { Express } from "express";
import { createServer, type Server } from "http";
import { CollaborativeEditingServer } from "./websocket";
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
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ChatRequestSchema,
  ParseResumeRequestSchema,
  RewriteBulletsRequestSchema,
  RecommendPathRequestSchema,
  ScoreVsJDRequestSchema,
  ExportRequestSchema,
  validateRequest,
} from "./validation";
import { rateLimiter, getRateLimitErrorMessage } from "./rateLimit";
import { sanitizeInput, sanitizeResumeJson, sanitizeJdText } from "./sanitization";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Auth endpoints - returns user or null (supports optional auth)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.json(null);
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Main chat endpoint (authentication disabled for now)
  app.post("/api/chat", async (req, res) => {
    try {
      // Validate request body
      const validation = validateRequest(ChatRequestSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "خطأ في البيانات المرسلة",
          details: validation.errors,
        });
      }

      let {
        message,
        path,
        sessionId,
        resumeJson,
        targetJob,
        jdText,
        tone,
      } = validation.data;

      // RATE LIMITING - Check before processing AI request
      const rateCheck = rateLimiter.checkLimit(sessionId);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: getRateLimitErrorMessage(rateCheck.minutesUntilReset!),
          minutesUntilReset: rateCheck.minutesUntilReset,
        });
      }

      // SANITIZATION - Sanitize all user inputs before processing
      const sanitizationWarnings: string[] = [];

      // Sanitize chat message (handle optional message)
      const messageSanitization = sanitizeInput(message || "");
      message = messageSanitization.sanitized;
      sanitizationWarnings.push(...messageSanitization.warnings);

      // Sanitize resume JSON if provided
      if (resumeJson) {
        const resumeSanitization = sanitizeResumeJson(resumeJson);
        resumeJson = resumeSanitization.sanitized;
        sanitizationWarnings.push(...resumeSanitization.warnings);
      }

      // Sanitize job description text if provided
      if (jdText) {
        const jdSanitization = sanitizeJdText(jdText);
        jdText = jdSanitization.sanitized;
        sanitizationWarnings.push(...jdSanitization.warnings);
      }

      // Log sanitization warnings if any
      if (sanitizationWarnings.length > 0) {
        console.warn(`[Security] Sanitization warnings for session ${sessionId}:`, sanitizationWarnings);
      }

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

      // Update session with new data if provided (using sanitized data)
      if (resumeJson) {
        await storage.updateSession(sessionId, { resumeJson: resumeJson as any });
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

      // Store user message in session (using sanitized message)
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
      let response = await callLLMWithRetry(messages, { maxTokens: 12288 });
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

  // Extract text from file (requires authentication)
  app.post("/api/tools/extract_text", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع ملف" });
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت" });
      }

      // Validate MIME type
      const allowedMimeTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: "نوع الملف غير مدعوم. الأنواع المسموحة: PDF, DOCX, PNG, JPEG, JPG",
        });
      }

      const result = await extractText(req.file.buffer, req.file.mimetype);

      const response: ExtractTextResponse = {
        text: result.text,
        meta: result.meta,
      };

      res.json(response);
    } catch (error: any) {
      console.error("Extract text error:", error);
      // Return 400 for user errors (invalid files), 500 for server errors
      const isUserError = error.message && (
        error.message.includes("غير صالح") ||
        error.message.includes("غير مدعوم") ||
        error.message.includes("لا يحتوي على نص") ||
        error.message.includes("ليس تالفًا") ||
        error.message.includes("صحة الملف") ||
        error.message.includes("وضوح النص")
      );
      
      const statusCode = isUserError ? 400 : 500;
      const errorMessage = error.message || "فشل استخراج النص من الملف";
      
      res.status(statusCode).json({ error: errorMessage });
    }
  });

  // Parse resume to JSON (requires authentication)
  app.post("/api/tools/parse_resume_json", async (req, res) => {
    try {
      // Validate request body
      const validation = validateRequest(ParseResumeRequestSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "خطأ في البيانات المرسلة",
          details: validation.errors,
        });
      }

      let { text } = validation.data;

      // SANITIZATION - Sanitize extracted text before parsing
      const textSanitization = sanitizeInput(text);
      text = textSanitization.sanitized;
      
      if (textSanitization.warnings.length > 0) {
        console.warn(`[Security] Text sanitization warnings:`, textSanitization.warnings);
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

  // Rewrite bullets in Arabic (requires authentication)
  app.post("/api/tools/rewrite_bullets_ar", async (req, res) => {
    try {
      // Validate request body
      const validation = validateRequest(RewriteBulletsRequestSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "خطأ في البيانات المرسلة",
          details: validation.errors,
        });
      }

      let { resumeJson, targetJob, tone } = validation.data;

      // SANITIZATION - Sanitize resume JSON before processing
      const resumeSanitization = sanitizeResumeJson(resumeJson);
      resumeJson = resumeSanitization.sanitized;
      
      if (resumeSanitization.warnings.length > 0) {
        console.warn(`[Security] Resume sanitization warnings:`, resumeSanitization.warnings);
      }

      const markdown = await rewriteBulletsAr(resumeJson as any, targetJob, tone);

      const response: RewriteBulletsResponse = { markdown };
      res.json(response);
    } catch (error) {
      console.error("Rewrite bullets error:", error);
      res.status(500).json({ error: "فشل إعادة كتابة نقاط الخبرة" });
    }
  });

  // Recommend career path for KSA (requires authentication)
  app.post("/api/tools/recommend_path_ksa", async (req, res) => {
    try {
      // Validate request body
      const validation = validateRequest(RecommendPathRequestSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "خطأ في البيانات المرسلة",
          details: validation.errors,
        });
      }

      let { resumeJson, targetJob } = validation.data;

      // SANITIZATION - Sanitize resume JSON before processing
      const resumeSanitization = sanitizeResumeJson(resumeJson);
      resumeJson = resumeSanitization.sanitized;
      
      if (resumeSanitization.warnings.length > 0) {
        console.warn(`[Security] Resume sanitization warnings:`, resumeSanitization.warnings);
      }

      const planMd = await recommendPathKsa(resumeJson as any, targetJob);

      const response: RecommendPathResponse = { planMd };
      res.json(response);
    } catch (error) {
      console.error("Recommend path error:", error);
      res.status(500).json({ error: "فشل إنشاء خطة المسار الوظيفي" });
    }
  });

  // Score resume vs job description (requires authentication)
  app.post("/api/tools/score_vs_jd", async (req, res) => {
    try {
      // Validate request body
      const validation = validateRequest(ScoreVsJDRequestSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "خطأ في البيانات المرسلة",
          details: validation.errors,
        });
      }

      let { resumeJson, jdText } = validation.data;

      // SANITIZATION - Sanitize inputs before processing
      const resumeSanitization = sanitizeResumeJson(resumeJson);
      resumeJson = resumeSanitization.sanitized;
      
      const jdSanitization = sanitizeJdText(jdText);
      jdText = jdSanitization.sanitized;
      
      const allWarnings = [...resumeSanitization.warnings, ...jdSanitization.warnings];
      if (allWarnings.length > 0) {
        console.warn(`[Security] Sanitization warnings:`, allWarnings);
      }

      const result = await scoreVsJD(resumeJson as any, jdText);

      const response: ScoreVsJDResponse = result;
      res.json(response);
    } catch (error) {
      console.error("Score vs JD error:", error);
      res.status(500).json({ error: "فشل مقارنة السيرة مع وصف الوظيفة" });
    }
  });

  // Export to DOCX/PDF (requires authentication)
  app.post("/api/tools/export", async (req, res) => {
    try {
      // Validate request body
      const validation = validateRequest(ExportRequestSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "خطأ في البيانات المرسلة",
          details: validation.errors,
        });
      }

      const { markdown, format, filename, rtl } = validation.data;

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
  
  // Initialize WebSocket server for collaborative editing
  const wsServer = new CollaborativeEditingServer(httpServer);
  console.log("[WS] Collaborative editing WebSocket server initialized");
  
  return httpServer;
}

// Helper functions for card generation
async function generateResumeReview(resumeJson: any): Promise<string> {
  const prompt = `راجع السيرة الذاتية التالية وقدم تقييماً شاملاً واحترافياً:

${JSON.stringify(resumeJson, null, 2)}

المطلوب (بتنسيق Markdown):

## ✨ نقاط القوة
حدد 3-5 نقاط قوة واضحة في السيرة الذاتية مع أمثلة محددة

## 🔧 نقاط للتحسين
حدد 3-4 مجالات تحتاج للتطوير مع توضيح السبب

## 💡 اقتراحات عملية
قدم 3-5 اقتراحات قابلة للتطبيق فوراً لتحسين السيرة

## 🎯 دعنا نناقش أهدافك
اطرح 2-3 أسئلة تحفيزية لفهم تطلعات المستخدم المهنية وخططه المستقبلية.

استخدم لغة ودية ومحفزة كمدرب مهني متمرس.`;

  return await callLLMWithRetry(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    { maxTokens: 12288 }
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
    { maxTokens: 8192 }
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
    { maxTokens: 8192 }
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
    { maxTokens: 8192 }
  );
}
