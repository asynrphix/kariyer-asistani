"use client";

import { useEffect, useState } from "react";

import type { AnalysisResult } from "@/lib/types";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const quickQuestions = [
  "Eksiklerimi nasıl kapatırım?",
  "Bu ilan için olası mülakat soruları",
  "CV maddelerimi bu ilana göre yeniden yaz",
  "Ön yazıyı daha kısa ve samimi yap",
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(value: string) {
  const safe = escapeHtml(value);
  const withBold = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withItalic = withBold.replace(/\*(.+?)\*/g, "<em>$1</em>");

  const lines = withItalic.split(/\n/);
  let html = "";
  let inList = false;

  for (const line of lines) {
    if (/^-\s+/.test(line.trim())) {
      if (!inList) {
        html += '<ul class="ml-5 list-disc space-y-1">';
        inList = true;
      }
      html += `<li>${line.replace(/^-\s+/, "")}</li>`;
      continue;
    }

    if (inList) {
      html += "</ul>";
      inList = false;
    }

    if (!line.trim()) {
      html += "<div class='h-2'></div>";
      continue;
    }

    html += `<p class="mb-2 last:mb-0">${line}</p>`;
  }

  if (inList) {
    html += "</ul>";
  }

  return html;
}

export function ChatPanel({
  ilan,
  cv,
  analysis,
}: {
  ilan: string;
  cv: string;
  analysis: AnalysisResult | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const canChat = Boolean(analysis && ilan.trim() && cv.trim());

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleSend(nextInput?: string) {
    if (!canChat || isSending) return;

    const trimmed = (nextInput ?? input).trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };

    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setInput("");
    setIsSending(true);
    setIsTyping(true);

    const assistantId = `${Date.now()}-assistant`;
    setMessages((previous) => [...previous, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversation,
          ilan,
          cv,
          analiz: analysis,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Asistan cevap veremedi.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Akış başlatılamadı.");
      }

      const decoder = new TextDecoder();
      let received = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += decoder.decode(value, { stream: true });

        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId ? { ...message, content: received } : message,
          ),
        );
      }
    } catch (error) {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? error.message
                    : "Asistan cevap üretirken bir hata oluştu.",
              }
            : message,
        ),
      );
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40">
      <div className="pointer-events-auto relative">
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 dark:shadow-violet-900/30"
          >
            <span className="text-lg">💬</span>
            <span>Asistana sor</span>
          </button>
        ) : null}

        {open ? (
          <div className="flex h-[560px] w-[400px] flex-col overflow-hidden rounded-3xl border border-[#EAE4F8] bg-white shadow-2xl shadow-violet-100/80 dark:border-slate-700 dark:bg-[#1F1B2D] dark:shadow-black/30">
            <div className="flex items-center justify-between border-b border-[#F0EBFA] bg-violet-600 px-4 py-3 text-white dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold">Kariyer Asistanı</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg transition hover:bg-white/20"
                aria-label="Paneli kapat"
              >
                ×
              </button>
            </div>

            {!canChat ? (
              <div className="flex flex-1 items-center justify-center p-5 text-center">
                <p className="max-w-[260px] text-sm leading-6 text-[#4B5563] dark:text-slate-300">
                  Önce bir analiz yap, sonra sorularını cevaplayayım.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 border-b border-[#F0EBFA] bg-[#F7F5FF] p-3 dark:border-slate-700 dark:bg-[#201B35]">
                  {quickQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => setInput(question)}
                      className="rounded-full border border-violet-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-900 dark:bg-slate-800 dark:text-violet-200 dark:hover:bg-slate-700"
                    >
                      {question}
                    </button>
                  ))}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-[#F9F7FF] p-3 dark:bg-[#171425]">
                  {messages.length === 0 ? (
                    <div className="rounded-2xl border border-[#ECE8F7] bg-white p-3 text-sm text-[#4B5563] dark:border-slate-700 dark:bg-[#201B35] dark:text-slate-300">
                      Başlamak için bir soru yazabilir veya önerilen başlıklardan birini seçebilirsin.
                    </div>
                  ) : null}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-6 ${
                          message.role === "user"
                            ? "border-violet-200 bg-violet-600 text-white"
                            : "border-[#EAE4F8] bg-white text-[#1E1B4B] dark:border-slate-700 dark:bg-[#201B35] dark:text-slate-100"
                        }`}
                      >
                        <div
                          className="prose prose-sm max-w-none [&_strong]:font-semibold [&_ul]:my-2 [&_li]:ml-2"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content || "...") }}
                        />

                        {message.role === "assistant" && message.content ? (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="mt-2 rounded-md border border-[#EAE4F8] bg-[#F7F5FF] px-2 py-1 text-[10px] font-medium text-violet-700 transition hover:bg-violet-50 dark:border-slate-600 dark:bg-slate-800 dark:text-violet-200"
                          >
                            Kopyala
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  {isTyping ? (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-[#EAE4F8] bg-white px-3 py-2 text-sm text-[#4B5563] dark:border-slate-700 dark:bg-[#201B35] dark:text-slate-300">
                        yazıyor...
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-[#F0EBFA] bg-white p-3 dark:border-slate-700 dark:bg-[#201B35]">
                  <div className="flex gap-2">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isSending}
                      rows={3}
                      placeholder={isSending ? "Asistan düşünüyor..." : "Sorunu buraya yaz..."}
                      className="flex-1 resize-none rounded-2xl border border-[#EAE4F8] bg-[#F9F7FF] p-3 text-sm text-[#1E1B4B] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-[#F3EEFF] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-violet-500 dark:focus:ring-violet-900/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={isSending || !input.trim()}
                      className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-200 disabled:text-violet-700 dark:disabled:bg-violet-900 dark:disabled:text-violet-200"
                    >
                      Gönder
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
