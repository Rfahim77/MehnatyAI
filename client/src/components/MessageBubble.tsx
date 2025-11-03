import { type ChatMessage } from "@shared/schema";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const renderContent = () => {
    if (isUser) {
      return <p className="whitespace-pre-wrap">{message.content}</p>;
    }

    // For assistant messages, render markdown
    const rawHtml = marked(message.content) as string;
    const cleanHtml = sanitizeHtml(rawHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2", "h3"]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["class"],
      },
    });

    return (
      <div
        className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed prose-ul:mr-4 prose-ol:mr-4"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
        dir="rtl"
      />
    );
  };

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.role}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1" data-testid="avatar-assistant">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}
      
      <div
        className={`rounded-2xl px-6 py-4 max-w-3xl ${
          isUser
            ? "bg-primary text-primary-foreground border border-primary-border"
            : "bg-card text-card-foreground border border-card-border"
        }`}
        data-testid={`bubble-${message.role}`}
      >
        {renderContent()}
        <div className={`text-xs mt-2 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {new Date(message.timestamp).toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1" data-testid="avatar-user">
          <User className="w-5 h-5 text-primary" />
        </div>
      )}
    </div>
  );
}
