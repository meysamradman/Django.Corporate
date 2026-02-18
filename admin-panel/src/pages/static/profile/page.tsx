import { InfoSidebar } from "@/components/static/profile/InfoSidebar";
import { ProfileTabs } from "@/components/static/profile/ProfileTabs";

export default function StaticProfilePage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(280px,30%)_1fr] gap-6">
        <div>
          <InfoSidebar />
        </div>
        <div>
          <ProfileTabs />
        </div>
      </section>
    </div>
  );
}
