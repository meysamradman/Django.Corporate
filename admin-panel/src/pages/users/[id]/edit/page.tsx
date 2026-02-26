import { useParams, Navigate } from "react-router-dom";
import { DynamicEditForm } from "@/components/users/edit/DynamicEditForm";
import "@/pages/users/user-profile-pages.css";

export default function EditUserPage() {
  const params = useParams();
  const userId = params?.id as string;

  if (!userId) {
    return <Navigate to="/users" replace />;
  }

  return (
    <div className="user-profile-pages space-y-6">
      <DynamicEditForm userId={userId} />
    </div>
  );
}
