"use client";

import * as React from "react";
import { ApiError } from "@/types/api/apiError";
import type { PublicChatbotFaqItem, PublicChatbotSettings } from "@/types/chatbot/chatbot";
import { chatbotApi } from "@/api/chatbot/route";
import { contactSettingsApi } from "@/api/settings/contact";
import type { PublicContactSettings } from "@/types/settings/contact";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/elements/Popover";
import { Button } from "@/components/elements/Button";
import { ScrollArea } from "@/components/elements/ScrollArea";
import { Input } from "@/components/elements/Input";
import { cn } from "@/core/utils/cn";
import {
  ArrowLeft,
  CircleHelp,
  Home,
  MessageCircle,
  X,
  PhoneCall,
  Search,
  Phone,
  Smartphone,
  Mail,
  Globe,
  Instagram,
  Send,
  Linkedin,
  Youtube,
  Twitter,
  Facebook,
} from "lucide-react";

const getSocialIcon = (name: string, url: string) => {
  const value = `${name} ${url}`.toLowerCase();
  if (value.includes("instagram")) return Instagram;
  if (value.includes("telegram")) return Send;
  if (value.includes("whatsapp") || value.includes("whats")) return MessageCircle;
  if (value.includes("linkedin")) return Linkedin;
  if (value.includes("youtube")) return Youtube;
  if (value.includes("twitter") || value.includes("x.com")) return Twitter;
  if (value.includes("facebook")) return Facebook;
  return Globe;
};

type WidgetView = "home" | "faq" | "contact";

export function ChatbotWidget({
  initialSettings,
}: {
  initialSettings: PublicChatbotSettings | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<PublicChatbotSettings | null>(
    initialSettings
  );
  const [view, setView] = React.useState<WidgetView>("home");
  const [faqs, setFaqs] = React.useState<PublicChatbotFaqItem[]>([]);
  const [contact, setContact] = React.useState<PublicContactSettings | null>(null);
  const [faqQuery, setFaqQuery] = React.useState("");
  const [selectedFaqId, setSelectedFaqId] = React.useState<string | null>(null);
  const [errorText, setErrorText] = React.useState<string>("");

  const ensureSettings = React.useCallback(async () => {
    if (settings) return settings;
    const fresh = await chatbotApi.getSettings();
    setSettings(fresh);
    return fresh;
  }, [settings]);

  React.useEffect(() => {
    if (!open) return;
    setErrorText("");
    void Promise.allSettled([
      ensureSettings(),
      chatbotApi.getFaqs(),
      contactSettingsApi.getPublic(),
    ]).then((results) => {
      if (results[0].status === "rejected") {
        const error = results[0].reason;
        setErrorText(error instanceof ApiError ? error.message : "خطا در ارتباط با سرور");
      }

      if (results[1].status === "fulfilled") {
        setFaqs(Array.isArray(results[1].value) ? results[1].value : []);
      } else {
        setFaqs([]);
      }

      if (results[2].status === "fulfilled") {
        setContact(results[2].value || null);
      } else {
        setContact(null);
      }
    });
  }, [open, ensureSettings]);

  React.useEffect(() => {
    if (!open) {
      setView("home");
      setSelectedFaqId(null);
      setFaqQuery("");
    }
  }, [open]);

  if (settings?.is_enabled === false) return null;

  const filteredFaqs = faqs.filter((item) =>
    item.question.toLowerCase().includes(faqQuery.trim().toLowerCase())
  );

  const selectedFaq = selectedFaqId
    ? faqs.find((item) => item.public_id === selectedFaqId) || null
    : null;

  const isFaqDetailView = view === "faq" && Boolean(selectedFaq);

  const phoneLinks = [
    ...(contact?.phones || []).map((item) => ({
      key: `phone-${item.phone_number}`,
      label: item.label || item.phone_number,
      href: `tel:${item.phone_number}`,
      Icon: Phone,
    })),
    ...(contact?.mobiles || []).map((item) => ({
      key: `mobile-${item.mobile_number}`,
      label: item.label || item.mobile_number,
      href: `tel:${item.mobile_number}`,
      Icon: Smartphone,
    })),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            type="button"
            size="icon"
            aria-expanded={open}
            className={cn(
              "relative size-12 rounded-full transition-all duration-220 ease-out active:scale-95",
              open ? "scale-105 shadow-lg" : "scale-100 shadow-md hover:scale-105"
            )}
          >
            <MessageCircle
              className={cn(
                "size-5 absolute transition-all duration-220 ease-out",
                open ? "opacity-0 scale-75" : "opacity-100 scale-100"
              )}
            />
            <X
              className={cn(
                "size-5 absolute transition-all duration-220 ease-out",
                open ? "opacity-100 scale-100" : "opacity-0 scale-75"
              )}
            />
            <span className="sr-only">پشتیبانی</span>
          </Button>
        </div>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className={`p-0 [direction:rtl] text-right overflow-hidden overflow-x-hidden origin-bottom-right transition-[width,min-width,max-width] duration-300 ease-out data-[state=open]:duration-300 data-[state=closed]:duration-200 ${
          isFaqDetailView
            ? "w-[min(680px,calc(100vw-2rem))] min-w-[min(680px,calc(100vw-2rem))] max-w-[min(680px,calc(100vw-2rem))]"
            : "w-[min(440px,calc(100vw-2rem))] min-w-[min(440px,calc(100vw-2rem))] max-w-[min(440px,calc(100vw-2rem))]"
        }`}
      >
        <div className="h-[72vh] sm:h-[680px] flex flex-col bg-card overflow-x-hidden w-full max-w-full">
          <div className="border-b p-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              className={view === "home" && !selectedFaq ? "invisible" : "visible"}
              onClick={() => {
                if (selectedFaq) {
                  setSelectedFaqId(null);
                  return;
                }
                setView("home");
              }}
            >
              <ArrowLeft className="size-4" />
            </Button>

            <div className="text-center min-w-0 flex-1 max-w-full overflow-hidden">
              <div className="text-lg leading-7 font-semibold wrap-anywhere px-2">
                {view === "faq"
                    ? "سوالات متداول"
                    : view === "contact"
                      ? "راه‌های ارتباطی"
                      : "پشتیبانی"}
              </div>
              {view === "home" && settings?.welcome_message ? (
                <p className="text-font-s text-sm mt-2">{settings.welcome_message}</p>
              ) : null}
            </div>

            <Button type="button" size="icon-sm" variant="outline" onClick={() => setOpen(false)}>
              ×
            </Button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div
              className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out will-change-transform ${
                view === "home"
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4 pointer-events-none"
              }`}
            >
              <ScrollArea className="h-full p-4">
                {errorText ? (
                  <div className="rounded-md border bg-card px-3 py-2 text-sm mb-3">{errorText}</div>
                ) : null}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setView("faq")}
                    className="w-full rounded-md border p-4 text-right transition-colors hover:bg-bg overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <ArrowLeft className="size-4 text-font-s" />
                      <div className="flex items-center gap-2">
                        <CircleHelp className="size-4 text-font-s" />
                        <span className="font-medium">سوالات متداول</span>
                      </div>
                    </div>
                    <p className="text-font-s text-sm mt-2">{faqs.length} سوال آماده پاسخ</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setView("contact")}
                    className="w-full rounded-md border p-4 text-right transition-colors hover:bg-bg overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <ArrowLeft className="size-4 text-font-s" />
                      <div className="flex items-center gap-2">
                        <PhoneCall className="size-4 text-font-s" />
                        <span className="font-medium">تماس و شبکه‌های اجتماعی</span>
                      </div>
                    </div>
                    <p className="text-font-s text-sm mt-2">شماره تماس، ایمیل و شبکه‌ها</p>
                  </button>
                </div>
              </ScrollArea>
            </div>

            <div
              className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out will-change-transform ${
                view === "faq"
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4 pointer-events-none"
              }`}
            >
              {selectedFaq ? (
                <ScrollArea className="h-full p-4">
                  <div className="rounded-md border p-4 max-w-full overflow-hidden">
                    <h3 className="text-font-p font-semibold leading-8 wrap-anywhere text-right mb-3">
                      {selectedFaq.question}
                    </h3>
                    <div className="leading-8 text-font-p whitespace-pre-wrap wrap-anywhere break-all text-right max-w-full overflow-hidden">
                      {selectedFaq.answer}
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="relative mb-3">
                    <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-font-s" />
                    <Input
                      value={faqQuery}
                      onChange={(e) => setFaqQuery(e.target.value)}
                      placeholder="جست‌وجو کنید"
                      className="pr-9"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((item) => (
                        <button
                          key={item.public_id}
                          type="button"
                          onClick={() => setSelectedFaqId(item.public_id)}
                          className="w-full max-w-full rounded-md border p-3 text-right transition-colors hover:bg-bg overflow-hidden"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <ArrowLeft className="size-4 text-font-s" />
                            <span className="text-sm leading-7 wrap-anywhere min-w-0 text-right">
                              {item.question}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-md border bg-card px-3 py-2 text-sm">
                        سوالی پیدا نشد.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div
              className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-out will-change-transform ${
                view === "contact"
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4 pointer-events-none"
              }`}
            >
              <ScrollArea className="h-full p-4">
                <div className="space-y-3">
                  {phoneLinks.map((item) => (
                    <Button key={item.key} type="button" variant="outline" className="w-full justify-between" asChild>
                      <a href={item.href} className="inline-flex items-center justify-between gap-2 w-full min-w-0">
                        <span dir="ltr" className="min-w-0 truncate">{item.label}</span>
                        <span className="inline-flex items-center gap-1.5 shrink-0">
                          <item.Icon className="size-4" />
                          <span>تماس</span>
                        </span>
                      </a>
                    </Button>
                  ))}

                  {(contact?.emails || []).map((item) => (
                    <Button key={`email-${item.email}`} type="button" variant="outline" className="w-full justify-between" asChild>
                      <a href={`mailto:${item.email}`} className="inline-flex items-center justify-between gap-2 w-full min-w-0">
                        <span className="min-w-0 truncate">{item.label || item.email}</span>
                        <span className="inline-flex items-center gap-1.5 shrink-0">
                          <Mail className="size-4" />
                          <span>ایمیل</span>
                        </span>
                      </a>
                    </Button>
                  ))}

                  {(contact?.social_media || []).map((item) => {
                    const Icon = getSocialIcon(item.name, item.url);
                    return (
                      <Button key={`social-${item.name}-${item.url}`} type="button" variant="outline" className="w-full justify-between" asChild>
                        <a href={item.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center justify-between gap-2 w-full min-w-0">
                          <span className="min-w-0 truncate">{item.name}</span>
                          <span className="inline-flex items-center gap-1.5 shrink-0">
                            <Icon className="size-4" />
                            <span>شبکه اجتماعی</span>
                          </span>
                        </a>
                      </Button>
                    );
                  })}

                  {phoneLinks.length === 0 && (contact?.emails || []).length === 0 && (contact?.social_media || []).length === 0 ? (
                    <div className="rounded-md border bg-card px-3 py-2 text-sm">
                      اطلاعات تماس ثبت نشده است.
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="border-t p-2 grid grid-cols-3 gap-2">
            <Button
              type="button"
              size="sm"
              variant={view === "home" ? "default" : "outline"}
              onClick={() => {
                setView("home");
                setSelectedFaqId(null);
              }}
              className="w-full"
            >
              <Home className="size-4" />
              خانه
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "faq" ? "default" : "outline"}
              onClick={() => {
                setView("faq");
                setSelectedFaqId(null);
              }}
              className="w-full"
            >
              <CircleHelp className="size-4" />
              سوالات
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "contact" ? "default" : "outline"}
              onClick={() => {
                setView("contact");
                setSelectedFaqId(null);
              }}
              className="w-full"
            >
              <PhoneCall className="size-4" />
              ارتباط
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
