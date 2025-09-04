"use client"
import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import ChatItem from "@/components/ChatItem";

type UiMessage = { id: string; role: "user" | "assistant"; content: string };

function ShareContent() {
  const params = useParams();
  const sessionId = params['session-id'] as string;
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!sessionId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/chat-history/${sessionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('No chat history found for this session');
          } else {
            setError('Failed to load chat history');
          }
          return;
        }
        
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Failed to load chat history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatHistory();
  }, [sessionId]);

  if (isLoading) {
    return (
      <main className="h-full flex flex-col items-center pt-10">
        <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat history...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="h-full flex flex-col items-center pt-10">
        <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <p className="text-gray-500 text-sm mt-2">Please check the session ID and try again.</p>
          </div>
        </div>
      </main>
    );
  }

  if (messages.length === 0) {
    return (
      <main className="h-full flex flex-col items-center pt-10">
        <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="text-gray-400 text-xl mb-4">💬</div>
            <p className="text-gray-600">No messages found in this conversation.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full flex flex-col items-center">
      <div className="w-full max-w-4xl mx-auto relative flex flex-col gap-3 h-full">
        <div className="flex-1 px-4 pt-10">
          <ChatItem messages={messages} isLoading={false} canReact={false} />
        </div>
      </div>
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <main className="h-full flex flex-col items-center pt-10">
        <div className="w-full max-w-4xl mx-auto relative flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <ShareContent />
    </Suspense>
  );
}
