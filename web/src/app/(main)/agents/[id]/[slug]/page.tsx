import { notFound, permanentRedirect } from "next/navigation";

import { agentApi } from "@/api/real-estate/agent";

type PageProps = {
  params: Promise<{ id: string; slug: string }>;
};

const getCanonicalAgentPath = (id: string | number, slug: string) => `/agents/${id}/${encodeURIComponent(slug)}`;

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;

  const agent = await agentApi.getAgentByNumericId(id).catch(() => null);
  if (!agent) {
    notFound();
  }

  if (String(agent.id) !== id) {
    permanentRedirect(getCanonicalAgentPath(agent.id, agent.slug));
  }

  return (
    <main className="container mx-auto px-4 py-10 md:py-12">
      <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-font-p">{agent.user_name}</h1>
        <p className="text-font-s">{agent.specialization || "مشاور املاک"}</p>
        {agent.bio ? <p className="text-font-s leading-8">{agent.bio}</p> : null}
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const agent = await agentApi.getAgentByNumericId(id).catch(() => null);

  if (!agent) {
    return {
      title: "مشاور املاک",
      description: "جزئیات مشاور املاک",
    };
  }

  return {
    title: agent.meta_title || agent.user_name,
    description: agent.meta_description || agent.bio || "جزئیات مشاور املاک",
  };
}
