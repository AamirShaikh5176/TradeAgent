import { useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { FileText, X, Upload } from "lucide-react";
import { DocumentContext } from "@/lib/streaming";
import { Button } from "@/components/ui/button";

interface Props {
  documents: DocumentContext[];
  onAdd: (doc: DocumentContext) => void;
  onRemove: (name: string) => void;
}

export interface DocumentPanelRef {
  triggerUpload: () => void;
}

export const DocumentPanel = forwardRef<DocumentPanelRef, Props>(({ documents, onAdd, onRemove }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    triggerUpload: () => fileInputRef.current?.click(),
  }));

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      for (const file of Array.from(files)) {
        const text = await file.text();
        const content = text.slice(0, 8000);
        onAdd({ name: file.name, content });
      }
      e.target.value = "";
    },
    [onAdd]
  );

  if (documents.length === 0) return null;

  return (
    <div className="border-t border-border bg-card/30 px-4 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <input ref={fileInputRef} type="file" multiple accept=".txt,.csv,.md,.json" className="hidden" onChange={handleFileUpload} />
        {documents.map((doc) => (
          <div
            key={doc.name}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs"
          >
            <FileText className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate max-w-[120px] text-foreground/80">{doc.name}</span>
            <span className="text-muted-foreground">{(doc.content.length / 1000).toFixed(1)}k</span>
            <button onClick={() => onRemove(doc.name)} className="text-muted-foreground hover:text-destructive ml-0.5">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3 w-3 mr-1" />
          Add file
        </Button>
      </div>
    </div>
  );
});

DocumentPanel.displayName = "DocumentPanel";
