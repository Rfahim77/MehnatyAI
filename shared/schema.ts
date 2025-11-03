import { z } from "zod";
import { pgTable, varchar, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Resume JSON Schema - strict structure for parsing CVs
export const ResumeJsonSchema = z.object({
  name: z.string().min(1).max(120),
  contact: z.object({
    phone: z.string().optional().default(""),
    email: z.string().optional().default(""),
    city: z.string().optional().default("الرياض"),
    links: z.array(z.string()).default([])
  }),
  summary: z.string().optional().default(""),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string().optional().default(""),
    city: z.string().optional().default(""),
    start: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    end: z.string().regex(/^(\d{4}-(0[1-9]|1[0-2])|present)$/),
    bullets: z.array(z.string()).default([]),
    skills: z.array(z.string()).default([])
  })).default([]),
  education: z.array(z.object({
    degree: z.string(),
    field: z.string().optional().default(""),
    school: z.string().optional().default(""),
    year: z.string().regex(/^\d{4}$/)
  })).default([]),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.object({
    name: z.string(),
    level: z.enum(["Native", "C2", "C1", "B2", "B1", "A2", "A1"])
  })).default([{ name: "العربية", level: "Native" }]),
  certifications: z.array(z.string()).default([])
});

export type ResumeJson = z.infer<typeof ResumeJsonSchema>;

// Session data structure
export interface Session {
  id: string;
  resumeJson?: ResumeJson;
  tone?: string;
  targetJob?: string;
  jdText?: string;
  cards: Card[];
  messages?: ChatMessage[];
  language: "ar" | "en";
  createdAt: number;
  lastActivity: number;
}

// Card types for pinned outputs
export type CardType = "resume" | "jd_match" | "career_plan" | "cover_letter" | "bullets" | "interview_prep";

export interface Card {
  id: string;
  type: CardType;
  title: string;
  content: string; // Markdown content
  metadata?: {
    version?: number;
    tone?: string;
    targetJob?: string;
  };
  createdAt: number;
}

// Chat message structure
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  cards?: Card[];
}

// API request/response types
export interface ChatRequest {
  message: string;
  path?: "resume_review" | "career_chat" | "future_plan" | "tailor_to_job" | "interview" | "cover_letter" | "skills_gap" | "build_from_zero";
  sessionId: string;
  resumeJson?: ResumeJson;
  targetJob?: string;
  jdText?: string;
  tone?: string;
}

export interface ChatResponse {
  reply: string;
  cards?: Card[];
  session: {
    id: string;
    resumeJson?: ResumeJson;
    targetJob?: string;
    tone?: string;
  };
}

export interface ExtractTextRequest {
  // File uploaded as multipart/form-data
}

export interface ExtractTextResponse {
  text: string;
  meta: {
    pages?: number;
    fileType: string;
    language?: string;
  };
}

export interface ParseResumeRequest {
  text: string;
}

export interface ParseResumeResponse {
  resumeJson?: ResumeJson;
  issues: string[]; // Arabic error messages
}

export interface RewriteBulletsRequest {
  resumeJson: ResumeJson;
  targetJob: string;
  tone: string;
}

export interface RewriteBulletsResponse {
  markdown: string;
}

export interface RecommendPathRequest {
  resumeJson: ResumeJson;
  targetJob: string;
}

export interface RecommendPathResponse {
  planMd: string;
}

export interface ScoreVsJDRequest {
  resumeJson: ResumeJson;
  jdText: string;
}

export interface ScoreVsJDResponse {
  matchSummary: string;
  gapsMd: string;
}

export interface ExportRequest {
  markdown: string;
  format: "docx" | "pdf";
  filename: string;
  rtl?: boolean;
}

// Validation helper with Arabic messages
export function validateResume(data: any): { ok: boolean; errors: string[] } {
  try {
    ResumeJsonSchema.parse(data);
    return { ok: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join(".");
        switch (err.code) {
          case "invalid_type":
            return `خطأ في الحقل "${path}": نوع البيانات غير صحيح`;
          case "too_small":
            return `خطأ في الحقل "${path}": القيمة قصيرة جداً`;
          case "too_big":
            return `خطأ في الحقل "${path}": القيمة طويلة جداً`;
          case "invalid_string":
            if (err.validation === "regex") {
              return `خطأ في الحقل "${path}": التنسيق غير صحيح (مثال: 2024-01)`;
            }
            return `خطأ في الحقل "${path}": نص غير صالح`;
          default:
            return `خطأ في الحقل "${path}": ${err.message}`;
        }
      });
      return { ok: false, errors };
    }
    return { ok: false, errors: ["خطأ غير متوقع في التحقق من البيانات"] };
  }
}

// Career path types for KSA market
export interface KSARole {
  titleAr: string;
  titleEn: string;
  level: "entry" | "junior" | "mid" | "senior";
  responsibilities: string[];
  keywords: string[];
}

export const KSA_COMMON_ROLES: KSARole[] = [
  {
    titleAr: "خدمة العملاء",
    titleEn: "Customer Service Representative",
    level: "entry",
    responsibilities: ["الرد على استفسارات العملاء", "حل المشكلات", "إدارة الشكاوى"],
    keywords: ["communication", "problem-solving", "CRM"]
  },
  {
    titleAr: "إدخال بيانات",
    titleEn: "Data Entry Specialist",
    level: "entry",
    responsibilities: ["إدخال البيانات بدقة", "التحقق من البيانات", "إعداد التقارير"],
    keywords: ["typing", "accuracy", "Microsoft Excel"]
  },
  {
    titleAr: "مساعد إداري",
    titleEn: "Administrative Assistant",
    level: "entry",
    responsibilities: ["تنظيم المواعيد", "إدارة المراسلات", "الدعم الإداري"],
    keywords: ["organization", "Microsoft Office", "scheduling"]
  },
  {
    titleAr: "محلل بيانات مبتدئ",
    titleEn: "Junior Data Analyst",
    level: "junior",
    responsibilities: ["تحليل البيانات", "إعداد التقارير", "استخدام SQL"],
    keywords: ["SQL", "Excel", "Power BI", "data analysis"]
  },
  {
    titleAr: "تسويق رقمي",
    titleEn: "Digital Marketing Associate",
    level: "junior",
    responsibilities: ["إدارة وسائل التواصل الاجتماعي", "الإعلانات الرقمية", "تحليل الأداء"],
    keywords: ["social media", "Google Ads", "content creation", "analytics"]
  }
];

// Database Tables (Drizzle ORM)
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  resumeJson: jsonb("resume_json").$type<ResumeJson>(),
  tone: varchar("tone", { length: 50 }),
  targetJob: varchar("target_job", { length: 255 }),
  jdText: text("jd_text"),
  language: varchar("language", { length: 2 }).notNull().default("ar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActivity: timestamp("last_activity").notNull().defaultNow()
});

export const messages = pgTable("messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().references(() => sessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

export const cards = pgTable("cards", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().references(() => sessions.id, { onDelete: "cascade" }),
  messageId: varchar("message_id", { length: 255 }).references(() => messages.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const savedResumes = pgTable("saved_resumes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().references(() => sessions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  resumeJson: jsonb("resume_json").notNull().$type<ResumeJson>(),
  version: integer("version").notNull().default(1),
  targetRole: varchar("target_role", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Insert schemas
export const insertSessionSchema = createInsertSchema(sessions).omit({ createdAt: true, lastActivity: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ timestamp: true });
export const insertCardSchema = createInsertSchema(cards).omit({ createdAt: true });
export const insertSavedResumeSchema = createInsertSchema(savedResumes).omit({ createdAt: true, updatedAt: true });

// Types
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SelectSession = typeof sessions.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type SelectMessage = typeof messages.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type SelectCard = typeof cards.$inferSelect;
export type InsertSavedResume = z.infer<typeof insertSavedResumeSchema>;
export type SelectSavedResume = typeof savedResumes.$inferSelect;
