import { useState, useCallback } from "react";
import { ChatMessage, DocumentContext, streamChat } from "@/lib/streaming";
import { toast } from "@/hooks/use-toast";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentContext[]>([]);

  const addDocument = useCallback((doc: DocumentContext) => {
    setDocuments((prev) => [...prev, doc]);
  }, []);

  const removeDocument = useCallback((name: string) => {
    setDocuments((prev) => prev.filter((d) => d.name !== name));
  }, []);

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || isLoading) return;
      const userMsg: ChatMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      let assistantSoFar = "";
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      await streamChat({
        messages: [...messages, userMsg],
        documents,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          setIsLoading(false);
          toast({ variant: "destructive", title: "Error", description: err });
        },
      });
    },
    [messages, documents, isLoading]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages, documents, addDocument, removeDocument };
}
