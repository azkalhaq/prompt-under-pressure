"use client"
import { useCallback, useMemo, useRef, useState } from "react";
import ChatHelp from "@/components/ChatHelp";
import ChatInput from "@/components/ChatInput";

type UiMessage = { id: string; role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const model = "gpt-4o-mini";

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
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: (m.content || "") + "\n[Error fetching response]" } : m));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return (
    <main className="min-h-screen flex flex-col items-center p-2 pt-12">
      <div className="w-full flex flex-col items-center gap-3 px-4">
        <ChatHelp messages={messages} isLoading={isLoading} />
        <ChatInput onSubmitPrompt={handleSubmitPrompt} disabled={isLoading} />
      </div>
    </main>
  );
}
