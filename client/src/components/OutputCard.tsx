import { useState } from "react";
import { type Card } from "@shared/schema";
import { Card as CardUI } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Zap, Languages, ChevronDown, ChevronUp } from "lucide-react";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

interface OutputCardProps {
  card: Card;
  sessionId: string;
}

export function OutputCard({ card, sessionId }: OutputCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const getCardIcon = () => {
    switch (card.type) {
      case "resume":
        return "📄";
      case "jd_match":
        return "🎯";
      case "career_plan":
        return "📊";
      case "cover_letter":
        return "✉️";
      case "bullets":
        return "📝";
      case "interview_prep":
        return "💼";
      default:
        return "📌";
    }
  };

  const getCardColor = () => {
    switch (card.type) {
      case "resume":
        return "border-primary/30 bg-primary/5";
      case "jd_match":
        return "border-accent/30 bg-accent/5";
      case "career_plan":
        return "border-secondary/30 bg-secondary/5";
      default:
        return "border-card-border bg-card";
    }
  };

  const handleDownload = async (format: "docx" | "pdf") => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/tools/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: card.content,
          format,
          filename: `${card.title.replace(/\s+/g, "_")}_${Date.now()}`,
          rtl: true,
        }),
      });

      if (!response.ok) throw new Error("فشل التنزيل");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${card.title.replace(/\s+/g, "_")}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderContent = () => {
    const rawHtml = marked(card.content) as string;
    const cleanHtml = sanitizeHtml(rawHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3"]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["class"],
      },
    });

    const preview = isExpanded ? cleanHtml : cleanHtml.slice(0, 500) + (cleanHtml.length > 500 ? "..." : "");

    return (
      <div
        className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed prose-ul:mr-4 prose-ol:mr-4"
        dangerouslySetInnerHTML={{ __html: preview }}
        dir="rtl"
      />
    );
  };

  return (
    <CardUI
      className={`${getCardColor()} border transition-all`}
      data-testid={`card-${card.type}-${card.id}`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" data-testid={`icon-${card.type}`}>
              {getCardIcon()}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-foreground" data-testid={`title-${card.id}`}>
                {card.title}
              </h3>
              {card.metadata && (
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  {card.metadata.version && (
                    <span data-testid={`version-${card.id}`}>نسخة {card.metadata.version}</span>
                  )}
                  {card.metadata.tone && (
                    <span data-testid={`tone-${card.id}`}>• {card.metadata.tone}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid={`button-expand-${card.id}`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Content */}
        <div className={`${!isExpanded ? "max-h-32 overflow-hidden" : ""}`} data-testid={`content-${card.id}`}>
          {renderContent()}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleDownload("docx")}
            disabled={isDownloading}
            data-testid={`button-download-docx-${card.id}`}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل DOCX</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled
            data-testid={`button-download-pdf-${card.id}`}
            className="gap-2"
            title="ميزة PDF قريباً"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-regenerate-${card.id}`}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة الصياغة</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-stronger-${card.id}`}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>أقوى أفعال</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-tone-${card.id}`}
            className="gap-2"
          >
            <Languages className="w-4 h-4" />
            <span>نبرة نجدية</span>
          </Button>
        </div>
      </div>
    </CardUI>
  );
}
