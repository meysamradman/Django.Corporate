import { notFound, permanentRedirect } from "next/navigation";

import { agencyApi } from "@/api/real-estate/agent";

type PageProps = {
  params: Promise<{ slugOrId: string }>;
};

const getCanonicalAgencyPath = (id: string | number, slug: string) => `/agencies/${id}/${encodeURIComponent(slug)}`;

export default async function AgencyLegacyRedirectPage({ params }: PageProps) {
  const { slugOrId } = await params;

  const numericId = Number.parseInt(slugOrId, 10);
  const agency = Number.isFinite(numericId)
    ? await agencyApi.getAgencyByNumericId(numericId).catch(() => null)
    : await agencyApi.getAgencyBySlug(slugOrId).catch(() => null);

  if (!agency) {
    notFound();
  }

  permanentRedirect(getCanonicalAgencyPath(agency.id, agency.slug));
}
