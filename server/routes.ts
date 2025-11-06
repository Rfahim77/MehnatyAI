import type { Express } from "express";
import { createServer, type Server } from "http";
import { CollaborativeEditingServer } from "./websocket";
import multer from "multer";
import { storage } from "./storage";
import { callLLMWithRetry, type LLMMessage } from "./llmClient";
import { SYSTEM_PROMPT, getChatPrompt } from "./prompts";
import {
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
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import UAParser from "ua-parser-js";

// Configure multer for file uploads with enhanced safety
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit as recommended
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يُرجى رفع PDF أو DOCX أو صورة فقط.'));
    }
  },
});

// Crawler detection
function isCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  const crawlerPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
    'whatsapp', 'telegrambot', 'applebot', 'discordbot'
  ];
  const ua = userAgent.toLowerCase();
  return crawlerPatterns.some(pattern => ua.includes(pattern));
}

// Generate prerendered HTML for crawlers
function getPrerenderedLanding(): string {
  return `<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Mehnaty AI | مدرّب مهني يعتمد على الذكاء الاصطناعي: مراجعة السيرة، تخصيص للأدوار، خطة مهارات ٣–٦ أشهر، وتجهيز للمقابلات—بالعربية" />
  <meta name="theme-color" content="#0F5132" />
  
  <!-- Open Graph / Social Media -->
  <meta property="og:title" content="Mehnaty AI | مهنتي" />
  <meta property="og:description" content="مدرّب مهني يعتمد على الذكاء الاصطناعي. استخدم الذكاء الاصطناعي لتعزيز مسارك بالعربية" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ar_SA" />
  <meta property="og:image" content="https://mehnaty.io/icons/icon-512x512.png" />
  <meta property="og:url" content="https://mehnaty.io/" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Mehnaty AI | مهنتي" />
  <meta name="twitter:description" content="مدرّب مهني يعتمد على الذكاء الاصطناعي" />
  <meta name="twitter:image" content="https://mehnaty.io/icons/icon-512x512.png" />
  
  <link rel="canonical" href="https://mehnaty.io/" />
  <link rel="manifest" href="/manifest.json" />
  
  <title>Mehnaty AI | مهنتي - مدرّب مهني يعتمد على الذكاء الاصطناعي</title>
</head>
<body>
  <main>
    <h1>مهنتي | <bdi dir="ltr">Mehnaty AI</bdi></h1>
    <h2>مدرّب مهني يعتمد على الذكاء الاصطناعي</h2>
    <p>استخدم الذكاء الاصطناعي لتعزيز مسارك: نراجع سيرتك، نخصّصها للوظيفة، ونبني خطة مهارات ٣–٦ أشهر — بالعربية</p>
    
    <h3>المسارات المهنية المتوفرة:</h3>
    <ul>
      <li>مراجعة السيرة الذاتية - تحليل شامل مع نقاط التحسين</li>
      <li>تفصيل لوظيفة - تخصيص سيرتك لوصف وظيفي محدد</li>
      <li>تدريب على المقابلة - محاكاة مقابلات مع أسئلة واقعية</li>
      <li>خطة المهارات - خطة عمل ٣–٦ أشهر لسد فجوات المهارات</li>
      <li>إنشاء سيرة ذاتية - بناء سيرة احترافية من الصفر</li>
      <li>رسالة تغطية - كتابة رسالة تغطية مخصصة</li>
      <li>تحليل فجوة المهارات - تقييم مهاراتك مقابل متطلبات السوق</li>
      <li>التخطيط المهني - استراتيجية طويلة المدى لمسارك المهني</li>
    </ul>
    
    <p><strong>مجاني تمامًا</strong> - جميع المزايا متاحة للجميع بدون حدود</p>
    
    <a href="/home">ابدأ الآن كضيف</a>
  </main>
</body>
</html>`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Disable x-powered-by header
  app.disable('x-powered-by');
  
  // www → apex redirect (must be first)
  app.use((req, res, next) => {
    const host = req.get('host');
    if (host && host.startsWith('www.')) {
      const newHost = host.replace('www.', '');
      return res.redirect(301, `${req.protocol}://${newHost}${req.originalUrl}`);
    }
    next();
  });
  
  // Security hardening with helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "wss://*"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
  
  // Global rate limiting
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'لقد تجاوزت الحد المسموح من الطلبات. يُرجى المحاولة بعد قليل.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/', globalLimiter);
  
  // Setup Replit Auth
  await setupAuth(app);
  
  // Crawler detection and prerendered landing
  app.get('/', (req, res, next) => {
    const userAgent = req.get('user-agent') || '';
    if (isCrawler(userAgent)) {
      return res.status(200).set({ 'Content-Type': 'text/html' }).send(getPrerenderedLanding());
    }
    next();
  });

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

  // Get user profile (requires authentication)
  app.get('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return only profile-relevant fields
      res.json({
        phone: user.phone,
        linkedinUrl: user.linkedinUrl,
        currentRole: user.currentRole,
        yearsExperience: user.yearsExperience,
        industry: user.industry,
        skills: user.skills,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user profile (requires authentication)
  app.post('/api/auth/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { phone, linkedinUrl, currentRole, yearsExperience, industry, skills } = req.body;

      // Update user profile fields
      await storage.updateUserProfile(userId, {
        phone,
        linkedinUrl,
        currentRole,
        yearsExperience,
        industry,
        skills,
      });

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Link session to authenticated user (session migration)
  app.post('/api/auth/link-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Link the guest session to the authenticated user
      await storage.linkSessionToUser(sessionId, userId);

      res.json({ success: true, message: "Session linked successfully" });
    } catch (error) {
      console.error("Error linking session:", error);
      res.status(500).json({ message: "Failed to link session" });
    }
  });

  // Get user's sessions (for authenticated users to discover existing sessions)
  app.get('/api/auth/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserSessions(userId);
      
      res.json({ 
        success: true, 
        sessions: sessions.map(s => ({
          id: s.id,
          createdAt: s.createdAt,
          lastActivity: s.lastActivity
        }))
      });
    } catch (error) {
      console.error("Error fetching user sessions:", error);
      res.status(500).json({ message: "Failed to fetch user sessions" });
    }
  });

  // Fetch session data (messages and cards) for authenticated users or guests
  app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Fetch session data from database
      const messages = await storage.getSessionMessages(sessionId);
      const cards = await storage.getSessionCards(sessionId);

      res.json({ 
        success: true, 
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        })),
        cards 
      });
    } catch (error) {
      console.error("Error fetching session data:", error);
      res.status(500).json({ message: "Failed to fetch session data" });
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

      // Validate file size (5MB max as per security recommendation)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "حجم الملف كبير جداً. الحد الأقصى ٥ ميجابايت" });
      }

      // Magic-number validation: Detect actual file type from content
      const { fileTypeFromBuffer } = await import('file-type');
      const detectedType = await fileTypeFromBuffer(req.file.buffer);
      
      // Allowed file types with their magic number signatures
      const allowedTypes = new Map([
        ['application/pdf', ['pdf']],
        ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['docx']],
        ['image/png', ['png']],
        ['image/jpeg', ['jpg', 'jpeg']],
        ['image/webp', ['webp']],
      ]);

      // Validate that file has a detectable signature
      if (!detectedType) {
        return res.status(400).json({
          error: "لا يمكن التعرف على نوع الملف. الملف قد يكون تالفاً أو فارغاً",
        });
      }

      // Find the MIME type that matches the detected file signature
      let detectedMimeType: string | null = null;
      for (const [mime, extensions] of Array.from(allowedTypes.entries())) {
        if (extensions.includes(detectedType.ext)) {
          detectedMimeType = mime;
          break;
        }
      }

      // Reject if detected file type is not in allowed list
      if (!detectedMimeType) {
        return res.status(400).json({
          error: `نوع الملف غير مدعوم (تم الكشف عن: ${detectedType.ext}). الأنواع المسموحة: PDF، DOCX، PNG، JPEG، WEBP`,
        });
      }

      // CRITICAL: Ensure declared MIME matches detected MIME to prevent spoofing
      if (req.file.mimetype !== detectedMimeType) {
        return res.status(400).json({
          error: `نوع الملف المُعلن (${req.file.mimetype}) لا يطابق المحتوى الفعلي (${detectedMimeType}). تم رفض الملف لأسباب أمنية`,
        });
      }

      // Use AI-powered text extraction (sends file directly to Gemini)
      const { extractTextWithAI } = await import("./tools");
      const result = await extractTextWithAI(req.file.buffer, req.file.mimetype);

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
