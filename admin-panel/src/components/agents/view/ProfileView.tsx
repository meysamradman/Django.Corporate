import { DynamicProfileView } from "@/components/admins/view/DynamicProfileView";

interface AgentProfileViewProps {
  agentId: string;
}

export function AgentProfileView({ agentId }: AgentProfileViewProps) {
  return <DynamicProfileView adminId={agentId} profileMode="agent" />;
}
