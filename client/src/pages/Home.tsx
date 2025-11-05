import { useState, useEffect, useRef } from "react";
import { OptionCards } from "@/components/OptionCards";
import { ChatInterface } from "@/components/ChatInterface";
import { type ChatMessage, type Card, type ChatRequest } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

export default function Home() {
  const { t, dir } = useLanguage();
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [uploadedResume, setUploadedResume] = useState<any>(null);

  useEffect(() => {
    // Get or create session ID
    let storedSessionId = localStorage.getItem("career_agent_session_id");
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem("career_agent_session_id", storedSessionId);
    }
    setSessionId(storedSessionId);

    // Load persisted messages and cards
    const storedMessages = localStorage.getItem("career_agent_messages");
    const storedCards = localStorage.getItem("career_agent_cards");
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
    if (storedCards) {
      setCards(JSON.parse(storedCards));
    }
  }, []);

  useEffect(() => {
    // Persist messages and cards
    if (messages.length > 0) {
      localStorage.setItem("career_agent_messages", JSON.stringify(messages));
      setShowOptions(false);
    }
    if (cards.length > 0) {
      localStorage.setItem("career_agent_cards", JSON.stringify(cards));
    }
  }, [messages, cards]);

  const handleSendMessage = async (message: string, path?: ChatRequest["path"], resumeJsonOverride?: any) => {
    if (!message.trim() && !path) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const requestBody: ChatRequest = {
        message,
        path,
        sessionId,
      };
      
      // Include resume JSON - either from override or from state
      const resumeToSend = resumeJsonOverride || uploadedResume;
      if (resumeToSend) {
        requestBody.resumeJson = resumeToSend;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(t("chat.errorMessage"));
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        cards: data.cards,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.cards && data.cards.length > 0) {
        setCards(prev => [...prev, ...data.cards]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: t("chat.errorMessage"),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (path: ChatRequest["path"], message: string) => {
    handleSendMessage(message, path);
  };

  const handleResumeUploaded = (resumeJson: any) => {
    console.log("Resume uploaded:", resumeJson);
    setUploadedResume(resumeJson);
    // Automatically send a message to trigger resume review with resume data
    handleSendMessage("تم رفع السيرة الذاتية. يرجى مراجعتها.", "resume_review", resumeJson);
  };

  const handleClearSession = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([]);
    setCards([]);
    setShowOptions(true);
    setUploadedResume(null);
    localStorage.setItem("career_agent_session_id", newSessionId);
    localStorage.removeItem("career_agent_messages");
    localStorage.removeItem("career_agent_cards");
  };

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Branded header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            {!showOptions && messages.length > 0 && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleClearSession}
                data-testid="button-back"
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Logo size={36} />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">Mihnaty AI | مهنتي</h1>
              <p className="text-xs text-muted-foreground">{t("landing.tagline")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {authLoading ? (
              <div className="h-9 w-20 bg-muted rounded-md animate-pulse" data-testid="auth-loading"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8" data-testid="user-avatar">
                  {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.email?.[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={logout}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("auth.logout")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main content with top padding for fixed header */}
      <div className="pt-14">
        {showOptions && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
            <div className="w-full max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {t("appTitle")}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {t("appSubtitle")}
                </p>
              </div>
              <OptionCards onOptionClick={handleOptionClick} />
            </div>
          </div>
        ) : (
          <ChatInterface
            messages={messages}
            cards={cards}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearSession={handleClearSession}
            sessionId={sessionId}
            onResumeUploaded={handleResumeUploaded}
          />
        )}
      </div>
    </div>
  );
}
