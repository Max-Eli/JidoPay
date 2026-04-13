"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "How can I improve my invoice collection rate?",
  "Draft a follow-up email for an overdue invoice",
  "What's the best way to price my services?",
  "Help me write a payment reminder message",
  "Analyze my revenue and give me insights",
];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: err.error ?? "Something went wrong. Please try again.",
          },
        ]);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantContent += parsed.text;
                setMessages((prev) => [
                  ...prev.slice(0, -1),
                  { role: "assistant", content: assistantContent },
                ]);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content:
            "Connection error. Please check your internet and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12 text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/40">
              <Bot className="h-6 w-6 text-accent" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              JidoPay intelligence
            </p>
            <h3 className="mt-1 font-display text-2xl">
              What can I help you with?
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              I have full context on your payments, invoices, and customers.
              Ask me anything.
            </p>
            <div className="mt-8 flex w-full max-w-md flex-col gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 text-left text-sm text-foreground transition-all hover:border-accent/60 hover:bg-muted/40"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-foreground text-background"
                    : "border border-border/60 bg-muted/40 text-foreground"
                )}
              >
                {msg.content === "" && loading && i === messages.length - 1 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border/60 bg-background/60 p-4 backdrop-blur-sm">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="max-h-32 flex-1 resize-none overflow-y-auto rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-all hover:scale-[1.03] hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          AI responses are for guidance only. Always verify financial information.
        </p>
      </div>
    </div>
  );
}
