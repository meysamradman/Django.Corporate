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
  PropertyShareBar,
  PropertyLocation,
  PropertyVideo,
} from "@/components/real-estate/property-detail";
import { preparePropertyGallery } from "@/components/real-estate/property-detail/preparePropertyGallery";
import { ensureCanonicalDetailRedirect } from "@/core/seo/canonical/detail";

type PageProps = {
  params: Promise<{ id: string; slug: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id, slug } = await params;

  const property = await realEstateApi
    .getPropertyByNumericId(id)
    .catch(() => null);

  if (!property) {
    notFound();
  }

  ensureCanonicalDetailRedirect({
    basePath: "/properties",
    routeId: id,
    routeSlug: slug,
    entity: property,
  });

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
            <PropertyShareBar
              id={property.id}
              slug={property.slug}
              title={property.title}
            />

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
