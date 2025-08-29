"use client"
import { useCallback, useEffect, useRef, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatItem from "@/components/ChatItem";
import ChatInput from "@/components/ChatInput";
import { useSessionContext } from "@/contexts/SessionContext";

type UiMessage = { id: string; role: "user" | "assistant"; content: string };

function ScenarioThreeContent() {
  const { sessionId, userId, isLoading: sessionLoading } = useSessionContext();
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);

  const model = process.env.OPENAI_MODEL;
  const hasMessages = messages.length > 0;

  // Use useMemo to create stable references and prevent unnecessary re-renders
  const observerConfig = useMemo(() => ({
    rootMargin: `0px 0px -${Math.max(80, inputHeight + 40)}px 0px`,
    threshold: 0
  }), [inputHeight]);

  useEffect(() => {
    const getOverflowY = (el: HTMLElement) => {
      const style = window.getComputedStyle(el);
      return style.overflowY;
    };
    const findScrollParent = (el: HTMLElement | null): HTMLElement | null => {
      let node: HTMLElement | null = el;
      while (node) {
        const oy = getOverflowY(node);
        if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement as HTMLElement | null;
      }
      return null;
    };

    const parent = findScrollParent(anchorRef.current);
    scrollParentRef.current = parent;
    const rootEl = parent ?? undefined;
    if (!anchorRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowScrollToBottom(!entry.isIntersecting);
      },
      { root: rootEl, ...observerConfig }
    );
    observer.observe(anchorRef.current);
    return () => observer.disconnect();
  }, [hasMessages, observerConfig]);

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
      console.log("model", model);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          user_id: userId,
          session_id: sessionId,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          prompting_time_ms: promptingTimeMs,
        }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

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
                parent.scrollTo({ top: parent.scrollHeight, behavior: 'auto' });
              }
            });
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
    <main className="h-full flex flex-col items-center pt-10">
      <div className={`w-full max-w-4xl mx-auto relative ${hasMessages ? 'flex flex-col gap-3 h-full' : 'flex items-center justify-center h-full px-4'}`}>
        {hasMessages && (
          <div className="flex-1 px-4">
            <ChatItem messages={messages} isLoading={isLoading} />
            <div ref={anchorRef} style={{ height: Math.max(24, inputHeight-20) }} />
          </div>
        )}
        <div className={`${hasMessages ? 'sticky bottom-0' : ''} w-full flex justify-center px-4`}>
          <ChatInput
            onSubmitPrompt={handleSubmitPrompt}
            disabled={isLoading || sessionLoading}
            showTitle={!hasMessages}
            titleText="Scenario 3"
            showScrollButton={hasMessages && showScrollToBottom}
            scrollParentRef={scrollParentRef}
            onHeightChange={setInputHeight}
          />
        </div>
      </div>
         </main>
   );
}

export default function ScenarioThree() {
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
      <ScenarioThreeContent />
    </Suspense>
  );
}

 