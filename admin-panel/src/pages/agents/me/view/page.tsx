import { DynamicProfileView } from "@/components/admins/view/DynamicProfileView";

export default function MyAgentProfileViewPage() {
  return <DynamicProfileView adminId="me" profileMode="agent" />;
}
