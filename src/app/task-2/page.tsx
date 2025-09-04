"use client"
import { useCallback, useEffect, useRef, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatItem from "@/components/ChatItem";
import ChatInput from "@/components/ChatInput";
import StroopTest from "@/components/StroopTest";
import { useSessionContext } from "@/contexts/SessionContext";
import { useAudio } from "@/hooks/useAudio";
// removed icon import; button now inside ChatInput

type UiMessage = { id: string; role: "user" | "assistant"; content: string };

function Task2Content() {
  const { sessionId, userId, isLoading: sessionLoading } = useSessionContext();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();

  const model = process.env.OPENAI_MODEL;
  const hasMessages = messages.length > 0;
  
  // Audio functionality - removed unused variables
  useAudio(searchParams);

  

  // Use useMemo to create stable references and prevent unnecessary re-renders
  const observerConfig = useMemo(() => ({
    rootMargin: `0px 0px -${Math.max(80, inputHeight + 40)}px 0px`,
    threshold: 0
  }), [inputHeight]);

  useEffect(() => {
    // Use the known scrollable container explicitly
    scrollParentRef.current = messagesScrollRef.current;
    const rootEl = messagesScrollRef.current ?? undefined;
    if (!anchorRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // If the bottom anchor is visible (within margin), we are near bottom -> hide button
        setShowScrollToBottom(!entry.isIntersecting);
      },
      { root: rootEl, ...observerConfig }
    );
    observer.observe(anchorRef.current);
    return () => observer.disconnect();
  }, [hasMessages, observerConfig]);

  // scroll-to-bottom handled inside ChatInput via refs

  // Audio functionality is now handled by the useAudio hook

  const handleSubmitPrompt = useCallback(async (prompt: string, promptingTimeMs?: number) => {
    if (sessionLoading || !sessionId || !userId) {
      console.log('Session not ready, skipping prompt submission');
      return;
    }
    
    const userMsg: UiMessage = { id: crypto.randomUUID(), role: "user", content: prompt };
    const assistantMsg: UiMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          user_id: userId,
          session_id: sessionId,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          prompting_time_ms: promptingTimeMs,
          page_path: typeof window !== 'undefined' ? window.location.pathname : '/task-2',
        }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      console.log(res);

      const reader = (res.body as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          const [eventLine, ...dataLines] = evt.split("\n");
          const eventName = eventLine.replace(/^event: /, "").trim();
          const dataLine = dataLines.find(l => l.startsWith("data: ")) || "";
          const payload = dataLine.replace(/^data: /, "");
          if (eventName === "token") {
            const token = JSON.parse(payload);
            setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: m.content + token } : m));
            // Auto-scroll to bottom during streaming
            requestAnimationFrame(() => {
              const parent = scrollParentRef.current;
              if (parent) {
                parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
              }
            });
          } else if (eventName === "done") {
            // no-op
          }
        }
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: (m.content || "") + "\n[Error fetching response]" } : m));
    } finally {
      setIsLoading(false);
    }
  }, [messages, userId, model, sessionLoading, sessionId]);

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <div className="w-full mx-auto px-4 flex-1 flex min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full h-full min-h-0">
          {/* Chat Section */}
          <div className="flex flex-col h-full overflow-hidden">
            {hasMessages ? (
              <>
                <div ref={messagesScrollRef} className="flex-1 overflow-y-auto min-h-0 pt-10">
                  <ChatItem messages={messages} isLoading={isLoading} />
                  <div ref={anchorRef} style={{ height: Math.max(24, inputHeight-20) }} />
                </div>
                <div className="flex-shrink-0 w-full flex justify-center">
                  <ChatInput
                    onSubmitPrompt={handleSubmitPrompt}
                    disabled={isLoading || sessionLoading}
                    showTitle={false}
                    titleText="What can I help with?"
                    showScrollButton={showScrollToBottom}
                    scrollParentRef={scrollParentRef}
                    onHeightChange={setInputHeight}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <ChatInput
                  onSubmitPrompt={handleSubmitPrompt}
                  disabled={isLoading || sessionLoading}
                  showTitle={true}
                  titleText="What can I help with?"
                  showScrollButton={false}
                  scrollParentRef={scrollParentRef}
                  onHeightChange={setInputHeight}
                />
              </div>
            )}
          </div>
          {/* Stroop Test Section - Fixed height and position */}
          <div className="h-full overflow-hidden flex items-center justify-center min-h-0">
            {sessionLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading session...</p>
                </div>
              </div>
            ) : (
              sessionId && userId && (
                <div className="w-full h-full items-center justify-center overflow-hidden">
                  <StroopTest userId={userId} sessionId={sessionId} />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="h-screen flex flex-col pt-10">
        <div className="w-full mx-auto px-4 flex-1 flex">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full h-full">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    }>
      <Task2Content />
    </Suspense>
  );
}
