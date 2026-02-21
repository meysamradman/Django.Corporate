import { useParams, Navigate } from "react-router-dom";
import { DynamicProfileView } from "@/components/admins/view/DynamicProfileView";

export default function ViewAgentPage() {
  const params = useParams();
  const agentId = params?.id as string;

  if (!agentId) {
    return <Navigate to="/agents" replace />;
  }

  return <DynamicProfileView adminId={agentId} profileMode="agent" />;
}

