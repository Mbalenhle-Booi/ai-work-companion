import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, Plus, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { PageShell, PageHeader, AiDisclaimer } from "@/components/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { recordActivity, useLocalStorage } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — Workmate AI" },
      {
        name: "description",
        content: "Workplace-focused AI assistant for quick questions and brainstorming.",
      },
      { property: "og:title", content: "AI Chatbot — Workmate AI" },
      {
        property: "og:description",
        content: "Conversational AI assistant for workplace productivity.",
      },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "How can I improve my team's productivity?",
  "Help me prep for a 1:1 with my manager.",
  "Suggest an agenda for a 30-minute kickoff meeting.",
  "How do I write better stand-up updates?",
];

function getText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

function ChatPage() {
  const [stored, setStored] = useLocalStorage<UIMessage[]>("wpa.chat", []);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, setMessages } = useChat({
    id: "wpa-main",
    messages: stored,
    transport,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Chat error"),
  });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist messages whenever they change (debounced via effect)
  useEffect(() => {
    setStored(messages);
  }, [messages, setStored]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Focus
  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  // Record activity when assistant finishes
  const lastTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "ready" || messages.length === 0) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || lastTrackedRef.current === lastUser.id) return;
    const lastAssistant = messages[messages.length - 1];
    if (lastAssistant?.role !== "assistant") return;
    const userText = getText(lastUser);
    const aiText = getText(lastAssistant);
    if (!userText || !aiText) return;
    lastTrackedRef.current = lastUser.id;
    recordActivity({
      type: "chat",
      title: userText.slice(0, 80),
      preview: aiText.slice(0, 140),
    });
  }, [messages, status]);

  const isBusy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const t = text.trim();
    if (!t || isBusy) return;
    sendMessage({ text: t });
    setInput("");
  }

  function newConversation() {
    if (messages.length && !confirm("Start a new conversation? This clears the current chat.")) return;
    setMessages([]);
    setStored([]);
    lastTrackedRef.current = null;
    inputRef.current?.focus();
  }

  return (
    <PageShell>
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          icon={<MessageSquare className="h-5 w-5" />}
          title="AI Chatbot"
          description="Your workplace-focused conversational assistant."
        />
        <Button variant="outline" size="sm" onClick={newConversation}>
          <Plus className="h-4 w-4" />
          New conversation
        </Button>
      </div>
      <AiDisclaimer />

      <Card className="overflow-hidden">
        <CardContent className="flex h-[65vh] min-h-[480px] flex-col p-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold">How can I help today?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask anything about workplace productivity. Try one of these:
                </p>
                <div className="mt-4 grid gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="rounded-lg border bg-background px-3 py-2 text-left text-sm hover:border-primary/40 hover:bg-accent/40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {status === "submitted" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking…
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t bg-card px-4 py-3 sm:px-6">
            <form
              className="mx-auto flex max-w-3xl items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
            >
              <Textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit(input);
                  }
                }}
                placeholder="Ask anything about work…"
                className="max-h-40 min-h-[44px] flex-1 resize-none"
                disabled={isBusy}
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isBusy}>
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-[11px] text-muted-foreground">
              Press Enter to send, Shift+Enter for a new line.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const text = getText(message);
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground"
            : "max-w-[90%] text-sm text-foreground"
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-headings:mb-2 prose-headings:mt-3">
            <ReactMarkdown>{text || "…"}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
