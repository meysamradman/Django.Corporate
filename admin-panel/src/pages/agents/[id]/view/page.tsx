import { useParams, Navigate } from "react-router-dom";
import { AgentProfileView } from "@/components/agents/view/ProfileView";

export default function ViewAgentPage() {
  const params = useParams();
  const agentId = params?.id as string;

  if (!agentId) {
    return <Navigate to="/agents" replace />;
  }

  return <AgentProfileView agentId={agentId} />;
}

