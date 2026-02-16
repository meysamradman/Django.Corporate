"use client";

import * as React from "react";
import { ApiError } from "@/types/api/apiError";
import type { PublicChatbotFaqItem, PublicChatbotSettings } from "@/types/chatbot/chatbot";
import { chatbotApi } from "@/api/chatbot/route";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/elements/Popover";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { ScrollArea } from "@/components/elements/ScrollArea";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function ChatbotWidget({
  initialSettings,
}: {
  initialSettings: PublicChatbotSettings | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<PublicChatbotSettings | null>(
    initialSettings
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => {
    if (initialSettings?.welcome_message) {
      return [{ id: makeId(), role: "bot", text: initialSettings.welcome_message }];
    }
    return [];
  });
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [faqs, setFaqs] = React.useState<PublicChatbotFaqItem[]>([]);

  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  const ensureSettings = React.useCallback(async () => {
    if (settings) return settings;
    const fresh = await chatbotApi.getSettings();
    setSettings(fresh);
    if (fresh?.welcome_message) {
      setMessages((prev) =>
        prev.length === 0
          ? [{ id: makeId(), role: "bot", text: fresh.welcome_message }]
          : prev
      );
    }
    return fresh;
  }, [settings]);

  React.useEffect(() => {
    if (!open || settings) return;
    void ensureSettings().catch((error) => {
      const message = error instanceof ApiError ? error.message : "خطا در ارتباط با سرور";
      setMessages((prev) =>
        prev.length === 0
          ? [{ id: makeId(), role: "bot", text: message }]
          : prev
      );
    });
  }, [open, settings, ensureSettings]);

  React.useEffect(() => {
    if (!open) return;
    void chatbotApi
      .getFaqs()
      .then((items) => setFaqs(Array.isArray(items) ? items : []))
      .catch(() => setFaqs([]));
  }, [open]);

  const sendText = React.useCallback(
    async (text: string) => {
      const cleaned = text.trim();
      if (!cleaned || isSending) return;

      setInput("");
      setMessages((prev) => [...prev, { id: makeId(), role: "user", text: cleaned }]);

      setIsSending(true);
      try {
        await ensureSettings();
        const result = await chatbotApi.sendMessage(cleaned);
        setMessages((prev) => [...prev, { id: makeId(), role: "bot", text: result.reply }]);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "خطا در ارتباط با سرور";
        setMessages((prev) => [...prev, { id: makeId(), role: "bot", text: message }]);
      } finally {
        setIsSending(false);
      }
    },
    [ensureSettings, isSending]
  );

  const send = React.useCallback(async () => {
    await sendText(input);
  }, [input, sendText]);

  if (settings?.is_enabled === false) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" className="fixed bottom-4 right-4 z-40">
          چت
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="p-0 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)]"
      >
        <div className="border-b p-4">
          <div className="text-lg leading-none font-semibold">پشتیبانی</div>
        </div>

        {faqs.length > 0 && (
          <div className="border-b p-3">
            <div className="text-font-s text-sm mb-2">سوالات پیشنهادی</div>
            <div className="flex flex-wrap gap-2">
              {faqs.slice(0, 8).map((f) => (
                <Button
                  key={f.public_id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void sendText(f.question)}
                >
                  {f.question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <ScrollArea className="h-[55vh] p-4">
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "mr-auto max-w-[85%] rounded-md border bg-bg px-3 py-2 text-sm"
                    : "ml-auto max-w-[85%] rounded-md border bg-card px-3 py-2 text-sm"
                }
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پیام شما..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button type="button" onClick={() => void send()} isLoading={isSending}>
              ارسال
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
