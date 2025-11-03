import * as pdf_parse_module from "pdf-parse";
const pdf_parse = (pdf_parse_module as any).default || pdf_parse_module;
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { callLLMWithRetry } from "./llmClient";
import {
  getParseResumePrompt,
  getRewriteBulletsPrompt,
  getRecommendPathPrompt,
  getScoreVsJDPrompt,
  SYSTEM_PROMPT,
} from "./prompts";
import { ResumeJsonSchema, validateResume, type ResumeJson } from "@shared/schema";

export async function extractText(fileBuffer: Buffer, mimeType: string): Promise<{
  text: string;
  meta: { pages?: number; fileType: string; language?: string };
}> {
  try {
    if (mimeType === "application/pdf") {
      const data = await pdf_parse(fileBuffer);
      return {
        text: data.text.trim(),
        meta: {
          pages: data.numpages,
          fileType: "pdf",
        },
      };
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return {
        text: result.value.trim(),
        meta: {
          fileType: "docx",
        },
      };
    } else if (mimeType.startsWith("image/")) {
      const result = await Tesseract.recognize(fileBuffer, "ara+eng", {
        logger: (m) => console.log(m),
      });
      return {
        text: result.data.text.trim(),
        meta: {
          fileType: "image",
          language: result.data.text.match(/[\u0600-\u06FF]/) ? "ara+eng" : "eng",
        },
      };
    } else {
      throw new Error("نوع الملف غير مدعوم");
    }
  } catch (error) {
    console.error("Extract text error:", error);
    throw new Error("فشل استخراج النص من الملف");
  }
}

export async function parseResumeJson(text: string): Promise<{
  resumeJson?: ResumeJson;
  issues: string[];
}> {
  try {
    const prompt = getParseResumePrompt(text);
    const response = await callLLMWithRetry(
      [{ role: "user", content: prompt }],
      { jsonMode: true, maxTokens: 4096 }
    );

    // Parse and validate the JSON
    const parsed = JSON.parse(response);
    const validation = validateResume(parsed);

    if (!validation.ok) {
      return {
        issues: validation.errors,
      };
    }

    return {
      resumeJson: parsed,
      issues: [],
    };
  } catch (error) {
    console.error("Parse resume error:", error);
    return {
      issues: ["فشل تحليل السيرة الذاتية. يرجى التأكد من أن الملف يحتوي على معلومات واضحة."],
    };
  }
}

export async function rewriteBulletsAr(
  resumeJson: ResumeJson,
  targetJob: string,
  tone: string
): Promise<string> {
  try {
    const prompt = getRewriteBulletsPrompt(resumeJson, targetJob, tone);
    const response = await callLLMWithRetry(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      { maxTokens: 4096 }
    );

    return response;
  } catch (error) {
    console.error("Rewrite bullets error:", error);
    throw new Error("فشل إعادة كتابة نقاط الخبرة");
  }
}

export async function recommendPathKsa(
  resumeJson: ResumeJson,
  targetJob: string
): Promise<string> {
  try {
    const prompt = getRecommendPathPrompt(resumeJson, targetJob);
    const response = await callLLMWithRetry(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      { maxTokens: 4096 }
    );

    return response;
  } catch (error) {
    console.error("Recommend path error:", error);
    throw new Error("فشل إنشاء خطة المسار الوظيفي");
  }
}

export async function scoreVsJD(
  resumeJson: ResumeJson,
  jdText: string
): Promise<{
  matchSummary: string;
  gapsMd: string;
}> {
  try {
    const prompt = getScoreVsJDPrompt(resumeJson, jdText);
    const response = await callLLMWithRetry(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      { maxTokens: 4096 }
    );

    // The response is already in markdown format
    return {
      matchSummary: response,
      gapsMd: response,
    };
  } catch (error) {
    console.error("Score vs JD error:", error);
    throw new Error("فشل مقارنة السيرة مع وصف الوظيفة");
  }
}

export async function exportDocx(markdown: string, rtl: boolean = true): Promise<Buffer> {
  try {
    // Convert markdown to HTML first
    const html = marked(markdown) as string;
    const cleanHtml = sanitizeHtml(html, {
      allowedTags: ["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "br"],
    });

    // Parse HTML to create DOCX paragraphs
    const paragraphs: Paragraph[] = [];
    const lines = cleanHtml.split(/<\/?(?:p|h[1-4]|li)>/g).filter(Boolean);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("<")) continue;

      // Detect heading level
      let heading: HeadingLevel | undefined;
      if (trimmed.includes("<h1>")) heading = HeadingLevel.HEADING_1;
      else if (trimmed.includes("<h2>")) heading = HeadingLevel.HEADING_2;
      else if (trimmed.includes("<h3>")) heading = HeadingLevel.HEADING_3;

      // Clean text
      const text = trimmed
        .replace(/<\/?(?:strong|em|br)>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();

      if (text) {
        paragraphs.push(
          new Paragraph({
            text,
            heading,
            alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            bidirectional: rtl,
            spacing: {
              before: 200,
              after: 200,
            },
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: paragraphs,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  } catch (error) {
    console.error("Export DOCX error:", error);
    throw new Error("فشل تصدير الملف");
  }
}
