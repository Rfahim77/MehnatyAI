import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload } from "lucide-react";
import { FileUploadDialog } from "@/components/FileUploadDialog";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  sessionId: string;
}

export function ChatInput({ onSendMessage, isLoading, sessionId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <>
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowUpload(true)}
          disabled={isLoading}
          data-testid="button-upload"
          title="رفع ملف"
          className="flex-shrink-0"
        >
          <Upload className="w-5 h-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك هنا..."
            className="resize-none min-h-[44px] max-h-[120px] pr-4 pl-12 rounded-3xl border-input"
            disabled={isLoading}
            data-testid="input-message"
            dir="rtl"
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="icon"
          className="flex-shrink-0"
          data-testid="button-send"
          title="إرسال"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      <FileUploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        sessionId={sessionId}
      />
    </>
  );
}
