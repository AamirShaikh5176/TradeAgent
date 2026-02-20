import { BookOpen } from "lucide-react";

export function SavedAnalyses() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Saved Analyses</h2>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <BookOpen className="h-10 w-10 mb-2 opacity-30" />
        <p className="text-sm">No saved analyses yet</p>
        <p className="text-xs mt-1">Analyses will appear here when saved</p>
      </div>
    </div>
  );
}
