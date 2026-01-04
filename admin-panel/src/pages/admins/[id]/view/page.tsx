import { useParams } from "react-router-dom";
import { Navigate } from "react-router-dom";

export default function ViewAdminPage() {
  const params = useParams();
  const adminId = params?.id as string;

  if (!adminId) {
    return <Navigate to="/admins" replace />;
  }

  return <Navigate to={`/admins/${adminId}/edit`} replace />;
}
