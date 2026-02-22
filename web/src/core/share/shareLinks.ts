export type SharePlatform = "whatsapp" | "telegram";

type ShareInput = {
  url: string;
  title?: string;
  text?: string;
};

const safeUrl = (value: string): string => {
  const trimmed = (value || "").trim();
  return trimmed || "/";
};

const toShareText = ({ title, text, url }: ShareInput): string => {
  const parts = [title, text, safeUrl(url)].filter(Boolean);
  return parts.join("\n");
};

export const buildWhatsAppShareUrl = (input: ShareInput): string => {
  const message = toShareText(input);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

export const buildTelegramShareUrl = (input: ShareInput): string => {
  return `https://t.me/share/url?url=${encodeURIComponent(safeUrl(input.url))}&text=${encodeURIComponent(
    [input.title, input.text].filter(Boolean).join("\n")
  )}`;
};

export const buildShareUrl = (platform: SharePlatform, input: ShareInput): string => {
  if (platform === "telegram") return buildTelegramShareUrl(input);
  return buildWhatsAppShareUrl(input);
};
