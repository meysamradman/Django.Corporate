import { notFound } from "next/navigation";

import { realEstateApi } from "@/api/real-estate/route";
import { redirectToCanonicalDetail } from "@/core/seo/canonical/detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyLegacyRedirectPage({ params }: PageProps) {
  const { id } = await params;

  const numericId = Number.parseInt(id, 10);
  const property = Number.isFinite(numericId)
    ? await realEstateApi.getPropertyByNumericId(numericId).catch(() => null)
    : await realEstateApi.getPropertyBySlug(id).catch(() => null);

  if (!property) {
    notFound();
  }

  redirectToCanonicalDetail({
    basePath: "/properties",
    entity: property,
  });
}
