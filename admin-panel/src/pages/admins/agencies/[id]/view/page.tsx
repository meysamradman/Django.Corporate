import { Navigate, useParams } from "react-router-dom";
import { DynamicAgencyView } from "@/components/admins/view/DynamicAgencyView";

export default function AgencyViewPage() {
  const params = useParams();
  const agencyId = params?.id as string;

  if (!agencyId) {
    return <Navigate to="/admins/agencies" replace />;
  }

  return <DynamicAgencyView agencyId={agencyId} />;
}

