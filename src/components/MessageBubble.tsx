import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/lib/streaming";
import { TrendingUp, Copy, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary/15 border border-primary/20 px-4 py-3">
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 group">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 mt-0.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm prose-invert max-w-none
            prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
            prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-3
            prose-strong:text-primary prose-strong:font-semibold
            prose-code:text-accent prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs
            prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-xl
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-ul:my-2 prose-li:my-0.5
            prose-table:border-collapse prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:text-muted-foreground prose-th:border prose-th:border-border
            prose-td:px-3 prose-td:py-2 prose-td:text-sm prose-td:border prose-td:border-border
          ">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-secondary transition-colors"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
