import { notFound } from "next/navigation";

import { agentApi } from "@/api/real-estate/agent";
import { redirectToCanonicalDetail } from "@/core/seo/canonical/detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentLegacyRedirectPage({ params }: PageProps) {
  const { id } = await params;

  const numericId = Number.parseInt(id, 10);
  const agent = Number.isFinite(numericId)
    ? await agentApi.getAgentByNumericId(numericId).catch(() => null)
    : await agentApi.getAgentBySlug(id).catch(() => null);

  if (!agent) {
    notFound();
  }

  redirectToCanonicalDetail({
    basePath: "/agents",
    entity: agent,
  });
}