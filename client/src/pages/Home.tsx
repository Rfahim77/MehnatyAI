import { useState, useEffect, useRef } from "react";
import { OptionCards } from "@/components/OptionCards";
import { ChatInterface } from "@/components/ChatInterface";
import { type ChatMessage, type Card, type ChatRequest } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(true);

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

  const handleSendMessage = async (message: string, path?: ChatRequest["path"]) => {
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          path,
          sessionId,
        } as ChatRequest),
      });

      if (!response.ok) {
        throw new Error("فشل الاتصال بالخادم");
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
        content: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.",
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

  const handleClearSession = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setMessages([]);
    setCards([]);
    setShowOptions(true);
    localStorage.setItem("career_agent_session_id", newSessionId);
    localStorage.removeItem("career_agent_messages");
    localStorage.removeItem("career_agent_cards");
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {showOptions && messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-7xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                مرحباً! كيف تحب نبدأ؟
              </h1>
              <p className="text-lg text-muted-foreground">
                مساعدك المهني الذكي لبناء مسيرتك المهنية في السعودية
              </p>
            </header>
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
        />
      )}
    </div>
  );
}
