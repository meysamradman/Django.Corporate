import { notFound, permanentRedirect } from "next/navigation";

import { agentApi } from "@/api/real-estate/agent";

type PageProps = {
  params: Promise<{ id: string }>;
};

const getCanonicalAgentPath = (id: string | number, slug: string) => `/agents/${id}/${encodeURIComponent(slug)}`;

export default async function AgentLegacyRedirectPage({ params }: PageProps) {
  const { id } = await params;

  const numericId = Number.parseInt(id, 10);
  const agent = Number.isFinite(numericId)
    ? await agentApi.getAgentByNumericId(numericId).catch(() => null)
    : await agentApi.getAgentBySlug(id).catch(() => null);

  if (!agent) {
    notFound();
  }

  permanentRedirect(getCanonicalAgentPath(agent.id, agent.slug));
}