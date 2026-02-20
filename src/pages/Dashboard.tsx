import { useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { Sidebar, View } from "@/components/Sidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatInput } from "@/components/ChatInput";
import { DocumentPanel, DocumentPanelRef } from "@/components/DocumentPanel";
import { MarketsView } from "@/components/MarketsView";
import { AssetDetail } from "@/components/AssetDetail";
import { PortfolioView } from "@/components/PortfolioView";
import { AlertsView } from "@/components/AlertsView";
import { WatchlistView } from "@/components/WatchlistView";
import { SavedAnalyses } from "@/components/SavedAnalyses";
import { Header } from "@/components/Header";

const Dashboard = () => {
  const [view, setView] = useState<View>("chat");
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; symbol: string; name: string; type: string; currency?: string } | null>(null);
  const { messages, isLoading, sendMessage, clearMessages, documents, addDocument, removeDocument } = useChat();
  const docPanelRef = useRef<DocumentPanelRef>(null);

  const handleSelectAsset = (asset: { id: string; symbol: string; name: string; type: string; currency?: string }) => {
    setSelectedAsset(asset);
  };

  const handleAnalyze = (prompt: string) => {
    setView("chat");
    setSelectedAsset(null);
    sendMessage(prompt);
  };

  const renderContent = () => {
    if (selectedAsset && (view === "markets" || view === "watchlist")) {
      return <AssetDetail asset={selectedAsset} onBack={() => setSelectedAsset(null)} onAnalyze={handleAnalyze} />;
    }

    switch (view) {
      case "chat":
        return (
          <div className="flex flex-1 flex-col min-w-0 h-full">
            <Header onClear={clearMessages} hasMessages={messages.length > 0} />
            <ChatPanel messages={messages} isLoading={isLoading} onSend={sendMessage} />
            <DocumentPanel ref={docPanelRef} documents={documents} onAdd={addDocument} onRemove={removeDocument} />
            <div className="border-t border-border bg-background/80 backdrop-blur-sm p-3">
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                onUploadClick={() => docPanelRef.current?.triggerUpload()}
              />
            </div>
          </div>
        );
      case "markets":
        return <MarketsView onSelectAsset={handleSelectAsset} />;
      case "watchlist":
        return <WatchlistView onSelectAsset={handleSelectAsset} />;
      case "portfolio":
        return <PortfolioView />;
      case "alerts":
        return <AlertsView />;
      case "history":
        return <SavedAnalyses />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar active={view} onNavigate={(v) => { setView(v); setSelectedAsset(null); }} />
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
