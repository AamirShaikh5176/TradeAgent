import { useState } from "react";
import {
  MessageSquare, BarChart3, Briefcase, Bell, BookOpen, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type View = "chat" | "markets" | "portfolio" | "alerts" | "history" | "watchlist";

interface Props {
  active: View;
  onNavigate: (view: View) => void;
}

const items: { icon: typeof MessageSquare; label: string; view: View }[] = [
  { icon: MessageSquare, label: "Chat", view: "chat" },
  { icon: BarChart3, label: "Markets", view: "markets" },
  { icon: Star, label: "Watchlist", view: "watchlist" },
  { icon: Briefcase, label: "Portfolio", view: "portfolio" },
  { icon: Bell, label: "Alerts", view: "alerts" },
  { icon: BookOpen, label: "History", view: "history" },
];

export function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="flex flex-col w-16 border-r border-border bg-sidebar-background shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-border">
        <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center glow-primary">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-3">
        {items.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-xl text-[10px] font-medium transition-all",
              active === item.view
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            title={item.label}
          >
            <item.icon className="h-4.5 w-4.5 mb-0.5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
