import { notFound } from "next/navigation";

import { agencyApi } from "@/api/real-estate/agency";
import { ensureCanonicalDetailRedirect } from "@/core/seo/canonical/detail";

type PageProps = {
  params: Promise<{ id: string; slug: string }>;
};

export default async function AgencyDetailPage({ params }: PageProps) {
  const { id, slug } = await params;

  const agency = await agencyApi.getAgencyByNumericId(id).catch(() => null);
  if (!agency) {
    notFound();
  }

  ensureCanonicalDetailRedirect({
    basePath: "/agencies",
    routeId: id,
    routeSlug: slug,
    entity: agency,
  });

  return (
    <main className="container mx-auto px-4 py-10 md:py-12">
      <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-font-p">{agency.name}</h1>
        <p className="text-font-s">{[agency.city_name, agency.province_name].filter(Boolean).join("، ")}</p>
        {agency.description ? <p className="text-font-s leading-8">{agency.description}</p> : null}
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const agency = await agencyApi.getAgencyByNumericId(id).catch(() => null);

  if (!agency) {
    return {
      title: "آژانس املاک",
      description: "جزئیات آژانس املاک",
    };
  }

  return {
    title: agency.meta_title || agency.name,
    description: agency.meta_description || agency.description || "جزئیات آژانس املاک",
  };
}
