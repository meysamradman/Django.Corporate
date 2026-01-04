import { useParams } from "react-router-dom";
import { Navigate } from "react-router-dom";

export default function ViewAgentPage() {
  const params = useParams();
  const agentId = params?.id as string;

  if (!agentId) {
    return <Navigate to="/agents" replace />;
  }

  return <Navigate to={`/agents/${agentId}/edit`} replace />;
}

