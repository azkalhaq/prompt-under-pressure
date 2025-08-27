"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import ChatItem from "@/components/ChatItem";
import ChatInput from "@/components/ChatInput";
// removed icon import; button now inside ChatInput

type UiMessage = { id: string; role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [inputHeight, setInputHeight] = useState(0);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);

  const model = "gpt-4o-mini";
  const hasMessages = messages.length > 0;

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
        // If the bottom anchor is visible (within margin), we are near bottom -> hide button
        setShowScrollToBottom(!entry.isIntersecting);
      },
      { root: rootEl, threshold: 0, rootMargin: '0px 0px -80px 0px' }
    );
    observer.observe(anchorRef.current);
    return () => observer.disconnect();
  }, [hasMessages]);

  // scroll-to-bottom handled inside ChatInput via refs

  const handleSubmitPrompt = useCallback(async (prompt: string) => {
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
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
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
  }, [messages]);

  return (
    <main className="h-[calc(100vh-2.5rem)] flex flex-col items-center p-2 pt-2">
      <div className={`w-full max-w-4xl mx-auto relative ${hasMessages ? 'flex flex-col gap-3 h-full' : 'flex items-center justify-center h-full px-4'}`}>
        {hasMessages && (
          <div className="flex-1 px-4">
            <ChatItem messages={messages} isLoading={isLoading} />
            <div ref={anchorRef} style={{ height: Math.max(24, inputHeight) }} />
          </div>
        )}
        <div className={`${hasMessages ? 'sticky bottom-0' : ''} w-full flex justify-center px-4`}>
          <ChatInput
            onSubmitPrompt={handleSubmitPrompt}
            disabled={isLoading}
            showTitle={!hasMessages}
            titleText="What can I help with?"
            showScrollButton={hasMessages && showScrollToBottom}
            scrollParentRef={scrollParentRef}
            anchorRef={anchorRef}
            onHeightChange={setInputHeight}
          />
        </div>
      </div>
    </main>
  );
}
