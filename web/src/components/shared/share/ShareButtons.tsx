"use client";

import { Send, MessageCircle } from "lucide-react";

import { buildShareUrl } from "@/core/share/shareLinks";
import { cn } from "@/core/utils/cn";

type ShareButtonsProps = {
  url: string;
  title?: string;
  text?: string;
  className?: string;
};

export default function ShareButtons({ url, title, text, className }: ShareButtonsProps) {
  const telegramUrl = buildShareUrl("telegram", { url, title, text });
  const whatsappUrl = buildShareUrl("whatsapp", { url, title, text });

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <a
        href={telegramUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="اشتراک در تلگرام"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-br bg-bg text-font-p hover:bg-card"
      >
        <Send className="h-4 w-4" />
      </a>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="اشتراک در واتساپ"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-br bg-bg text-font-p hover:bg-card"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
    </div>
  );
}
