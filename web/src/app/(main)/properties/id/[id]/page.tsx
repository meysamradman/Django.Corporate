import { notFound, permanentRedirect } from "next/navigation";

import { realEstateApi } from "@/api/real-estate/route";

type PageProps = {
  params: Promise<{ id: string }>;
};

const getCanonicalPropertyPath = (id: string | number, slug: string) => `/properties/${id}/${encodeURIComponent(slug)}`;

export default async function PropertyLegacyRedirectPage({ params }: PageProps) {
  const { id } = await params;

  const numericId = Number.parseInt(id, 10);
  const property = Number.isFinite(numericId)
    ? await realEstateApi.getPropertyByNumericId(numericId).catch(() => null)
    : await realEstateApi.getPropertyBySlug(id).catch(() => null);

  if (!property) {
    notFound();
  }

  permanentRedirect(getCanonicalPropertyPath(property.id, property.slug));
}
