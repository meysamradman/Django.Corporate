import { realEstateMedia } from "@/core/utils/media";
import type { Property } from "@/types/real-estate/property";

export function preparePropertyGallery(property: Property): {
  images: string[];
  mainImageUrl: string | null;
} {
  const mainFromField = realEstateMedia.getPropertyMainImageOrNull(property.main_image || null);

  const media = Array.isArray(property.media) ? property.media : null;
  const mainFromMediaRel = media?.find((item) => {
    if (!item || typeof item !== "object") return false;
    return (item as { is_main_image?: boolean }).is_main_image === true;
  });

  const mainFromMedia = mainFromMediaRel
    ? realEstateMedia.extractPropertyMediaUrl(mainFromMediaRel)
    : null;

  const main = mainFromField || mainFromMedia || null;
  const gallery = realEstateMedia.getPropertyGallery(media);

  const images = Array.from(
    new Set([main, ...gallery].filter((v): v is string => typeof v === "string" && v.length > 0))
  );

  return { images, mainImageUrl: main };
}
