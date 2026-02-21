import { useParams, Navigate } from "react-router-dom";
import { DynamicProfileView } from "@/components/admins/view/DynamicProfileView";

export default function ViewAdminPage() {
  const params = useParams();
  const adminId = params?.id as string;

  if (!adminId) {
    return <Navigate to="/admins" replace />;
  }

  return <DynamicProfileView adminId={adminId} profileMode="admin" />;
}
