import type { Property } from "@/types/real-estate/property";

type PreparedPropertyGallery = {
  images: string[];
  mainImageUrl: string | null;
};

const normalizeUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const getMainImageUrl = (property: Property): string | null => {
  return (
    normalizeUrl(property.main_image?.url) ||
    normalizeUrl(property.main_image?.file_url) ||
    null
  );
};

const getMediaImageUrls = (property: Property): string[] => {
  const media = Array.isArray(property.media) ? property.media : [];

  return media
    .map((item) =>
      normalizeUrl(item?.media?.file_url) ||
      normalizeUrl((item as unknown as { media?: { url?: string } })?.media?.url)
    )
    .filter((url): url is string => Boolean(url));
};

export const preparePropertyGallery = (property: Property): PreparedPropertyGallery => {
  const mainImageUrl = getMainImageUrl(property);
  const mediaUrls = getMediaImageUrls(property);

  const merged = [mainImageUrl, ...mediaUrls].filter((url): url is string => Boolean(url));
  const images = Array.from(new Set(merged));

  return {
    images,
    mainImageUrl,
  };
};
