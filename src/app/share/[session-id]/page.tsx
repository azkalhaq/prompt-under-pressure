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
  const [copySuccess, setCopySuccess] = useState(false);
  const [userPromptsCopySuccess, setUserPromptsCopySuccess] = useState(false);
  const [aiResponsesCopySuccess, setAiResponsesCopySuccess] = useState(false);

  // Get AI name from environment variable
  const aiName = process.env.NEXT_PUBLIC_AI_NAME || 'LLM/Agent/AI';

  // Function to format chat history for copying
  const formatChatHistory = (messages: UiMessage[]) => {
    return messages.map(message => {
      const role = message.role === 'user' ? 'User' : aiName;
      return `${role}: ${message.content}`;
    }).join('\n');
  };

  // Function to format only user prompts for copying with indexing
  const formatUserPrompts = (messages: UiMessage[]) => {
    const userMessages = messages.filter(message => message.role === 'user');
    return userMessages.map((message, index) => {
      return `User Chat#${index + 1}:\n${message.content}`;
    }).join('\n\n');
  };

  // Function to format only AI responses for copying with indexing
  const formatAiResponses = (messages: UiMessage[]) => {
    const aiMessages = messages.filter(message => message.role === 'assistant');
    return aiMessages.map((message, index) => {
      return `${aiName} Chat#${index + 1}:\n${message.content}`;
    }).join('\n\n');
  };

  // Function to copy chat history to clipboard
  const copyChatHistory = async () => {
    try {
      const formattedHistory = formatChatHistory(messages);
      await navigator.clipboard.writeText(formattedHistory);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Hide success message after 2 seconds
    } catch (err) {
      console.error('Failed to copy chat history:', err);
    }
  };

  // Function to copy only user prompts to clipboard
  const copyUserPrompts = async () => {
    try {
      const userPrompts = formatUserPrompts(messages);
      await navigator.clipboard.writeText(userPrompts);
      setUserPromptsCopySuccess(true);
      setTimeout(() => setUserPromptsCopySuccess(false), 2000); // Hide success message after 2 seconds
    } catch (err) {
      console.error('Failed to copy user prompts:', err);
    }
  };

  // Function to copy only AI responses to clipboard
  const copyAiResponses = async () => {
    try {
      const aiResponses = formatAiResponses(messages);
      await navigator.clipboard.writeText(aiResponses);
      setAiResponsesCopySuccess(true);
      setTimeout(() => setAiResponsesCopySuccess(false), 2000); // Hide success message after 2 seconds
    } catch (err) {
      console.error('Failed to copy AI responses:', err);
    }
  };

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
        {/* Copy Buttons - Three buttons in a row */}
        <div className="flex justify-center items-center gap-4 pt-6 pb-4">
          {/* Copy Response Button - Left */}
          <button
            onClick={copyAiResponses}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              aiResponsesCopySuccess
                ? 'bg-green-500 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {aiResponsesCopySuccess ? '✓ Copied!' : '🤖 Copy Response'}
          </button>

          {/* Copy Chat History Button - Center */}
          <button
            onClick={copyChatHistory}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              copySuccess
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {copySuccess ? '✓ Copied!' : '📋 Copy Chat History'}
          </button>

          {/* Copy User Chat Button - Right */}
          <button
            onClick={copyUserPrompts}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
              userPromptsCopySuccess
                ? 'bg-green-500 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {userPromptsCopySuccess ? '✓ Copied!' : '👤 Copy User Chat'}
          </button>
        </div>
        
        <div className="flex-1 px-4">
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
