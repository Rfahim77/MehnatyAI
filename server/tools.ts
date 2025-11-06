// Lazy-loaded heavy dependencies (loaded only when needed)
// - docx: Only loaded when exporting to DOCX format
// - puppeteer: Only loaded when exporting to PDF format
//
// NOTE: Text extraction from PDF/DOCX/images is now handled by Gemini AI directly
// (see extractTextWithAI function) - no more pdf-parse, mammoth, or tesseract dependencies!

import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { callLLMWithRetry, type LLMMessage } from "./llmClient";
import {
  getParseResumePrompt,
  getRewriteBulletsPrompt,
  getRecommendPathPrompt,
  getScoreVsJDPrompt,
  SYSTEM_PROMPT,
} from "./prompts";
import { ResumeJsonSchema, validateResume, type ResumeJson } from "@shared/schema";

// AI-powered text extraction - sends file directly to Gemini for analysis
export async function extractTextWithAI(fileBuffer: Buffer, mimeType: string): Promise<{
  text: string;
  meta: { fileType: string; language?: string };
}> {
  try {
    // Map MIME types to file type descriptions
    const fileTypeMap: Record<string, string> = {
      "application/pdf": "PDF",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
      "image/png": "PNG image",
      "image/jpeg": "JPEG image",
      "image/webp": "WEBP image"
    };

    const fileType = fileTypeMap[mimeType] || "document";

    // Send file directly to Gemini for text extraction
    const messages: LLMMessage[] = [
      {
        role: "system",
        content: `أنت مساعد ذكي متخصص في استخراج النص من الملفات. مهمتك استخراج كل النص المرئي من الملف المرفق بدقة تامة.

قواعد الاستخراج:
١. استخرج كل النص بالضبط كما هو مكتوب في الملف
٢. حافظ على التنسيق والفقرات والقوائم
٣. إذا كان الملف يحتوي على جداول، استخرج محتواها بشكل منظم
٤. إذا كان الملف صورة، استخدم OCR لاستخراج النص
٥. لا تضف أي تعليقات أو ملاحظات، فقط النص المستخرج

يجب أن يكون الرد: النص المستخرج من الملف فقط، بدون أي إضافات.`
      },
      {
        role: "user",
        content: `استخرج كل النص من ملف ${fileType} المرفق:`,
        fileData: {
          mimeType,
          data: fileBuffer
        }
      }
    ];

    const extractedText = await callLLMWithRetry(messages, {
      temperature: 0.1, // Low temperature for accurate extraction
      maxTokens: 16384, // Allow for long documents
      applyWindowing: false // Don't window for file extraction
    });

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("الملف لا يحتوي على نص قابل للاستخراج");
    }

    return {
      text: extractedText.trim(),
      meta: {
        fileType: fileType.toLowerCase(),
        language: "ar" // Assume Arabic/mixed for now
      }
    };
  } catch (error: any) {
    console.error("AI text extraction error:", error);
    throw new Error("فشل استخراج النص من الملف. يُرجى التأكد من صحة الملف والمحاولة مرة أخرى");
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
    // Lazy-load docx library only when needed
    const { Document, Packer, Paragraph, AlignmentType, HeadingLevel } = await import("docx");
    
    // Convert markdown to HTML first
    const html = marked(markdown) as string;
    const cleanHtml = sanitizeHtml(html, {
      allowedTags: ["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "br"],
    });

    // Parse HTML to create DOCX paragraphs
    const paragraphs: any[] = [];
    const lines = cleanHtml.split(/<\/?(?:p|h[1-4]|li)>/g).filter(Boolean);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("<")) continue;

      // Detect heading level
      let heading: any;
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

export async function exportPdf(markdown: string, rtl: boolean = true): Promise<Buffer> {
  let browser;
  try {
    // Lazy-load puppeteer only when needed
    const puppeteer = (await import("puppeteer")).default;
    
    const html = marked(markdown) as string;
    const cleanHtml = sanitizeHtml(html, {
      allowedTags: ["h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "br"],
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html ${rtl ? 'dir="rtl" lang="ar"' : ''}>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap');
          
          body {
            font-family: 'IBM Plex Sans Arabic', 'Arial', sans-serif;
            direction: ${rtl ? 'rtl' : 'ltr'};
            text-align: ${rtl ? 'right' : 'left'};
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          
          h1, h2, h3, h4 {
            font-weight: 600;
            margin-top: 20px;
            margin-bottom: 10px;
            color: #1a1a1a;
          }
          
          h1 { font-size: 24px; }
          h2 { font-size: 20px; }
          h3 { font-size: 18px; }
          
          p {
            margin-bottom: 10px;
          }
          
          ul, ol {
            margin-bottom: 10px;
            padding-${rtl ? 'right' : 'left'}: 30px;
          }
          
          li {
            margin-bottom: 5px;
          }
          
          strong {
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        ${cleanHtml}
      </body>
      </html>
    `;

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("Export PDF error:", error);
    throw new Error("فشل تصدير الملف كـ PDF");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
