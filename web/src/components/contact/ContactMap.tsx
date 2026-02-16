import React from "react";
import type { PublicMapSettings } from "@/types/settings/contact";

type ContactMapProps = {
  mapSettings: PublicMapSettings | null;
};

const getEmbedSrc = (mapSettings: PublicMapSettings | null): string | null => {
  if (!mapSettings) return null;

  const { configs } = mapSettings;

  if (typeof configs === "string") {
    const trimmed = configs.trim();
    if (!trimmed) return null;
    return trimmed;
  }

  if (configs && typeof configs === "object") {
    const c = configs as Record<string, unknown>;

    const directKeys = ["embed_url", "iframe_src", "iframeUrl", "src", "url"] as const;
    for (const key of directKeys) {
      const val = c[key];
      if (typeof val === "string" && val.trim()) return val.trim();
    }

    const iframe = c["iframe"];
    if (iframe && typeof iframe === "object") {
      const src = (iframe as Record<string, unknown>)["src"];
      if (typeof src === "string" && src.trim()) return src.trim();
    }
  }

  return null;
};

export default function ContactMap({ mapSettings }: ContactMapProps) {
  const src = getEmbedSrc(mapSettings);

  return (
    <section className="bg-wt border border-br/50 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-base font-black">موقعیت روی نقشه</h2>
      </div>

      <div className="p-4">
        {src ? (
          <div className="relative w-full overflow-hidden rounded-xl border border-br/50 bg-bg">
            <iframe
              title="نقشه"
              src={src}
              className="w-full h-[360px] md:h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-xl border border-br/50 bg-bg p-4 text-sm text-font-s">
            نقشه در دسترس نیست.
          </div>
        )}
      </div>
    </section>
  );
}
