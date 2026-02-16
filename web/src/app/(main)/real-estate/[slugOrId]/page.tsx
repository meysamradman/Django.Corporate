import { notFound } from "next/navigation";

import { realEstateApi } from "@/api/real-estate/route";
import PropertyGallery from "@/components/real-estate/detail/PropertyGallery";
import { realEstateMedia } from "@/core/utils/media";

type PageProps = {
  params: Promise<{ slugOrId: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slugOrId } = await params;

  const property = await realEstateApi
    .getPropertyDetail(slugOrId)
    .catch(() => null);

  if (!property) notFound();

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

  const images = Array.from(new Set([main, ...gallery].filter((v): v is string => typeof v === "string" && v.length > 0)));

  return (
    <main className="container mr-auto ml-auto py-12 md:py-16">
      <PropertyGallery
        title={property.title || "ملک"}
        images={images}
        mainImageUrl={main}
      />
    </main>
  );
}
