import { notFound } from "next/navigation";

import { realEstateApi } from "@/api/real-estate/route";
import {
  PropertyDescription,
  PropertyAgentSticky,
  PropertyAttributes,
  PropertyDetails,
  PropertyFloorPlans,
  PropertyFeatures,
  PropertyGallery,
  PropertyLocation,
  PropertyVideo,
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
    <main className="container mr-auto ml-auto py-12 md:py-16">
      <div className="space-y-10">
        <PropertyGallery
          title={property.title || "ملک"}
          images={images}
          mainImageUrl={mainImageUrl}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-10">
          <div className="space-y-10">
            <PropertyDetails property={property} />

            <div className="lg:hidden">
              <PropertyAgentSticky property={property} className="" />
            </div>

            <PropertyAttributes property={property} />

            <PropertyFloorPlans floorPlans={property.floor_plans} />

            <PropertyFeatures property={property} />

            <PropertyVideo property={property} />

            <PropertyDescription property={property} />

            <PropertyLocation property={property} />
          </div>

          <div className="hidden lg:block lg:self-stretch">
            <PropertyAgentSticky property={property} />
          </div>
        </div>
      </div>
    </main>
  );
}
