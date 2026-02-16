import { notFound } from "next/navigation";

import { realEstateApi } from "@/api/real-estate/route";
import {
  PropertyFloorPlans,
  PropertyFeatures,
  PropertyGallery,
  PropertyLocation,
} from "@/components/real-estate/property-detail";
import { preparePropertyGallery } from "@/features/real-estate/detail/preparePropertyGallery";

type PageProps = {
  params: Promise<{ slugOrId: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slugOrId } = await params;

  const property = await realEstateApi
    .getPropertyDetail(slugOrId)
    .catch(() => null);

  if (!property) notFound();

  const { images, mainImageUrl } = preparePropertyGallery(property);

  return (
    <main className="container mr-auto ml-auto py-12 md:py-16 space-y-10">
      <PropertyGallery
        title={property.title || "ملک"}
        images={images}
        mainImageUrl={mainImageUrl}
      />

      <PropertyFloorPlans floorPlans={property.floor_plans} />

      <PropertyFeatures property={property} />

      <PropertyLocation property={property} />
    </main>
  );
}
