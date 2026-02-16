import type { Property, PropertyVideoItem } from "@/types/real-estate/property";

type PropertyVideoProps = {
  property: Pick<Property, "videos" | "title">;
  className?: string;
};

function getVideoUrl(item: PropertyVideoItem | null | undefined): string | null {
  if (!item) return null;
  const url = item.media?.file_url || item.media_detail?.file_url;
  return typeof url === "string" && url.trim() ? url : null;
}

function toEmbedUrl(url: string): string | null {
  const trimmed = url.trim();

  // Already an embed url
  if (/^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//i.test(trimmed)) {
    return trimmed;
  }

  // youtube watch → embed
  const ytWatch = trimmed.match(
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([^&]+).*$/i
  );
  if (ytWatch?.[2]) {
    return `https://www.youtube.com/embed/${ytWatch[2]}`;
  }

  // youtu.be → embed
  const ytShort = trimmed.match(/^https?:\/\/youtu\.be\/([^?&/]+).*$/i);
  if (ytShort?.[1]) {
    return `https://www.youtube.com/embed/${ytShort[1]}`;
  }

  // aparat (common embed format)
  if (/^https?:\/\/(www\.)?aparat\.com\//i.test(trimmed)) {
    // If it's already an embed-ish url, keep it.
    if (/\/embed\//i.test(trimmed)) return trimmed;
    return null;
  }

  return null;
}

function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url) || url.startsWith("/media/video/");
}

export default function PropertyVideo({ property, className }: PropertyVideoProps) {
  const videos = Array.isArray(property.videos) ? property.videos : [];
  const first = videos[0];
  const url = getVideoUrl(first);
  if (!url) return null;

  const embedUrl = toEmbedUrl(url);

  return (
    <section
      className={
        className ||
        "bg-wt border border-br/50 rounded-2xl overflow-hidden"
      }
    >
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-lg font-black text-font-p">ویدئو</h2>
      </div>

      <div className="p-6">
        <div className="w-full h-56 sm:h-64 md:h-80 lg:h-[360px] rounded-xl overflow-hidden border border-br/50 bg-bg">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={property.title || "ویدئو ملک"}
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : isDirectVideoFile(url) ? (
            <video
              className="w-full h-full"
              controls
              preload="metadata"
            >
              <source src={url} />
            </video>
          ) : null}
        </div>
      </div>
    </section>
  );
}
