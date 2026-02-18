import sanitizeHtml from "sanitize-html";

import type { Portfolio } from "@/types/portfolio/portfolio";

type PortfolioDetailContentProps = {
  portfolio: Pick<Portfolio, "description">;
};

function decodeBasicHtmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function looksLikeHtml(input: string): boolean {
  return /<\s*\/?\s*[a-zA-Z][\s\S]*?>/.test(input);
}

function toSafeHtml(raw: string): string {
  const trimmed = raw.trim();
  const decoded = /&lt;|&gt;/.test(trimmed) ? decodeBasicHtmlEntities(trimmed) : trimmed;

  if (!looksLikeHtml(decoded)) {
    return "";
  }

  return sanitizeHtml(decoded, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "pre",
      "code",
      "hr",
      "img",
      "a",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading", "decoding", "class"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
  });
}

export default function PortfolioDetailContent({ portfolio }: PortfolioDetailContentProps) {
  const description = typeof portfolio.description === "string" ? portfolio.description.trim() : "";
  const safeHtml = description ? toSafeHtml(description) : "";

  if (!description) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b border-br/50 px-6 py-5">
        <h2 className="text-lg font-black text-font-p">توضیحات نمونه‌کار</h2>
      </div>

      <div className="px-6 py-6">
        {safeHtml ? (
          <div
            className="text-sm leading-7 text-font-s [&_p]:mb-4 last:[&_p]:mb-0 [&_a]:text-blue-1 [&_a]:font-black [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5 [&_li]:mb-2"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        ) : (
          <div className="whitespace-pre-line text-sm leading-7 text-font-s">{description}</div>
        )}
      </div>
    </section>
  );
}
