import { notFound } from "next/navigation";

import { agencyApi } from "@/api/real-estate/agency";
import { redirectToCanonicalDetail } from "@/core/seo/canonical/detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgencyLegacyRedirectPage({ params }: PageProps) {
  const { id } = await params;

  const numericId = Number.parseInt(id, 10);
  const agency = Number.isFinite(numericId)
    ? await agencyApi.getAgencyByNumericId(numericId).catch(() => null)
    : await agencyApi.getAgencyBySlug(id).catch(() => null);

  if (!agency) {
    notFound();
  }

  redirectToCanonicalDetail({
    basePath: "/agencies",
    entity: agency,
  });
}