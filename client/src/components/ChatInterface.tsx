import { useState, useEffect, useRef } from "react";
import { ChatMessage as ChatMsg, type Card } from "@shared/schema";
import { MessageBubble } from "@/components/MessageBubble";
import { OutputCard } from "@/components/OutputCard";
import { ChatInput } from "@/components/ChatInput";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatInterfaceProps {
  messages: ChatMsg[];
  cards: Card[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearSession: () => void;
  sessionId: string;
  onResumeUploaded?: (resumeJson: any) => void;
}

export function ChatInterface({
  messages,
  cards,
  isLoading,
  onSendMessage,
  onClearSession,
  sessionId,
  onResumeUploaded,
}: ChatInterfaceProps) {
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground" data-testid="header-title">
              {t("appTitle")}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="header-subtitle">
              {t("appSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSession}
              data-testid="button-clear-session"
              title={t("chat.newChat")}
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4" data-testid="messages-container">
        <div className="space-y-6 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
              <div className="text-6xl mb-4">💼</div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {t("chat.emptyTitle")}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {t("chat.emptyDescription")}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="animate-fade-in">
              <MessageBubble message={message} />
              {message.cards && message.cards.length > 0 && (
                <div className="mt-4 space-y-4">
                  {message.cards.map((card) => (
                    <OutputCard key={card.id} card={card} sessionId={sessionId} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start" data-testid="loading-indicator">
              <div className="bg-card border border-card-border rounded-2xl px-6 py-4 max-w-3xl">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{t("chat.typing")}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-border p-4">
        <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} sessionId={sessionId} onResumeUploaded={onResumeUploaded} />
      </div>
    </div>
  );
}
