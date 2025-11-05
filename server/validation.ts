import { z } from "zod";
import { ResumeJsonSchema } from "@shared/schema";

export const ChatRequestSchema = z.object({
  message: z.string().max(5000, "الرسالة طويلة جداً").optional().default(""),
  path: z.enum([
    "resume_review",
    "career_chat",
    "future_plan",
    "tailor_to_job",
    "interview",
    "cover_letter",
    "skills_gap",
    "build_from_zero"
  ]).optional(),
  sessionId: z.string().min(1, "معرف الجلسة مطلوب"),
  resumeJson: ResumeJsonSchema.optional(),
  targetJob: z.string().max(200).optional(),
  jdText: z.string().max(10000).optional(),
  tone: z.string().max(50).optional(),
}).refine(data => data.message || data.path, {
  message: "يجب تقديم رسالة أو اختيار مسار وظيفي",
});

export const ParseResumeRequestSchema = z.object({
  text: z.string().min(1, "النص مطلوب").max(50000, "النص طويل جداً"),
});

export const RewriteBulletsRequestSchema = z.object({
  resumeJson: ResumeJsonSchema,
  targetJob: z.string().min(1, "الوظيفة المستهدفة مطلوبة").max(200, "اسم الوظيفة طويل جداً"),
  tone: z.string().min(1, "النبرة مطلوبة").max(50, "النبرة طويلة جداً"),
});

export const RecommendPathRequestSchema = z.object({
  resumeJson: ResumeJsonSchema,
  targetJob: z.string().min(1, "الوظيفة المستهدفة مطلوبة").max(200, "اسم الوظيفة طويل جداً"),
});

export const ScoreVsJDRequestSchema = z.object({
  resumeJson: ResumeJsonSchema,
  jdText: z.string().min(1, "وصف الوظيفة مطلوب").max(10000, "وصف الوظيفة طويل جداً"),
});

export const ExportRequestSchema = z.object({
  markdown: z.string().min(1, "المحتوى مطلوب").max(100000, "المحتوى طويل جداً"),
  format: z.enum(["docx", "pdf"], {
    errorMap: () => ({ message: "صيغة التصدير يجب أن تكون docx أو pdf" })
  }),
  filename: z.string().min(1, "اسم الملف مطلوب").max(200, "اسم الملف طويل جداً"),
  rtl: z.boolean().optional(),
});

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const field = err.path.join(".");
        return field ? `${field}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["خطأ في التحقق من البيانات"] };
  }
}
