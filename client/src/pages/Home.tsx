import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { OptionCards } from "@/components/OptionCards";
import { ChatInterface } from "@/components/ChatInterface";
import { type ChatMessage, type Card, type ChatRequest, type ChatResponse, type ResumeJson } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, ArrowLeft, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export default function Home() {
  const { t, dir, language } = useLanguage();
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [showOptions, setShowOptions] = useState(true);
  const [uploadedResume, setUploadedResume] = useState<ResumeJson | null>(null);

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
    if (messages.length > 0) {
      localStorage.setItem("career_agent_messages", JSON.stringify(messages));
      setShowOptions(false);
    }
    if (cards.length > 0) {
      localStorage.setItem("career_agent_cards", JSON.stringify(cards));
    }
  }, [messages, cards]);

  const chatMutation = useMutation({
    mutationFn: async (requestBody: ChatRequest) => {
      const response = await apiRequest("POST", "/api/chat", requestBody);
      return await response.json() as ChatResponse;
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        cards: data.cards,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.cards?.length) {
        setCards(prev => [...prev, ...(data.cards || [])]);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: t("chat.errorMessage"),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        variant: "destructive",
        title: "خطأ في الإرسال",
        description: error instanceof Error ? error.message : t("chat.errorMessage"),
      });
    },
  });

  const handleSendMessage = (message: string, path?: ChatRequest["path"], resumeJsonOverride?: ResumeJson) => {
    if (!message.trim() && !path) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);

    const requestBody: ChatRequest = {
      message,
      path,
      sessionId,
    };
    
    const resumeToSend = resumeJsonOverride || uploadedResume;
    if (resumeToSend) {
      requestBody.resumeJson = resumeToSend;
    }

    chatMutation.mutate(requestBody);
  };

  const handleOptionClick = (path: ChatRequest["path"], message: string) => {
    handleSendMessage(message, path);
  };

  const handleResumeUploaded = (resumeJson: ResumeJson) => {
    console.log("Resume uploaded:", resumeJson);
    setUploadedResume(resumeJson);
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      {(user as any).profileImageUrl && <AvatarImage src={(user as any).profileImageUrl} />}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(user as any).email?.[0]?.toUpperCase() || (user as any).firstName?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {(user as any).firstName && (user as any).lastName
                          ? `${(user as any).firstName} ${(user as any).lastName}`
                          : language === "ar" ? "مستخدم" : "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {(user as any).email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")} data-testid="menu-item-profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>{language === "ar" ? "الملف الشخصي" : "Profile"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="menu-item-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("auth.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={login}
                data-testid="button-signin-header"
              >
                {t("auth.login")}
              </Button>
            )}
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
            isLoading={chatMutation.isPending}
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
