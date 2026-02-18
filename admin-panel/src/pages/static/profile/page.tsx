import { InfoSidebar } from "@/components/static/profile/InfoSidebar";
import { ProfileTabs } from "@/components/static/profile/ProfileTabs";

export default function StaticProfilePage() {
  return (
    <div className="space-y-8 lg:space-y-12">
      <InfoSidebar />
      <ProfileTabs />
    </div>
  );
}
