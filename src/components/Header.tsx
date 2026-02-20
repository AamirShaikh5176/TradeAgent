import { TrendingUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClear: () => void;
  hasMessages: boolean;
}

export function Header({ onClear, hasMessages }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 glow-primary">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">TradeAgent</h1>
          <p className="text-[11px] text-muted-foreground">AI-powered trading intelligence</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {hasMessages && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-destructive" onClick={onClear}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </header>
  );
}
