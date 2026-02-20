import { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatMessage } from "@/lib/streaming";
import { TrendingUp, Zap, BarChart3, FileText, Globe, Sparkles } from "lucide-react";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend?: (msg: string) => void;
}

const suggestions = [
  { icon: TrendingUp, text: "Analyze Bitcoin momentum and key signals", color: "text-primary" },
  { icon: BarChart3, text: "Compare ETH vs SOL performance this month", color: "text-accent" },
  { icon: Globe, text: "What's driving Nifty 50 and S&P 500 today?", color: "text-info" },
  { icon: Zap, text: "Build a risk-adjusted portfolio strategy", color: "text-warning" },
  { icon: Sparkles, text: "Top 5 undervalued stocks to watch", color: "text-primary" },
  { icon: FileText, text: "Explain support & resistance trading", color: "text-accent" },
];

export function ChatPanel({ messages, isLoading, onSend }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 glow-primary">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-1">What can I help you analyze?</h2>
          <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
            Ask about any market, get AI-powered analysis, or explore trading strategies.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full max-w-2xl mt-2">
          {suggestions.map((s) => (
            <button
              key={s.text}
              onClick={() => onSend?.(s.text)}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 hover:bg-card/80 px-3.5 py-3 text-left transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 group"
            >
              <s.icon className={`h-4 w-4 ${s.color} shrink-0 mt-0.5 group-hover:scale-110 transition-transform`} />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">{s.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-start gap-3 mb-6">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <TrendingUp className="h-3.5 w-3.5 text-primary animate-pulse" />
            </div>
            <div className="rounded-xl bg-card/50 border border-border px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
