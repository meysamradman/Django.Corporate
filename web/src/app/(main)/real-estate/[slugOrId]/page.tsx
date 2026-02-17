import { notFound, permanentRedirect } from "next/navigation";

import { realEstateApi } from "@/api/real-estate/route";

type PageProps = {
  params: Promise<{ slugOrId: string }>;
};

const getCanonicalPropertyPath = (id: string | number, slug: string) => `/real-estate/${id}/${encodeURIComponent(slug)}`;

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slugOrId } = await params;

  const numericId = Number.parseInt(slugOrId, 10);
  const property = Number.isFinite(numericId)
    ? await realEstateApi.getPropertyByNumericId(numericId).catch(() => null)
    : await realEstateApi.getPropertyBySlug(slugOrId).catch(() => null);

  if (!property) {
    notFound();
  }

  permanentRedirect(getCanonicalPropertyPath(property.id, property.slug));
}
