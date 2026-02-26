import { useParams, Navigate } from "react-router-dom";
import { DynamicUserProfileView } from "@/components/users/view/DynamicProfileView";
import "@/pages/users/user-profile-pages.css";

export default function ViewUserPage() {
  const params = useParams();
  const userId = params?.id as string;

  if (!userId) {
    return <Navigate to="/users" replace />;
  }

  return <DynamicUserProfileView userId={userId} />;
}
