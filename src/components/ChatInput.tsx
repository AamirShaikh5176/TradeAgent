import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  onUploadClick?: () => void;
}

export function ChatInput({ onSend, isLoading, onUploadClick }: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-2 shadow-lg shadow-background/30">
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        )}
        <textarea
          ref={textareaRef}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none scrollbar-thin"
          placeholder="Ask about market trends, strategies, or analysis..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
