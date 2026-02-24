import { Link } from "react-router-dom";
import { ShieldCheck, Share2, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { HeadCard } from "@/components/static/admin/profile/HeadCard";
import type { UserWithProfile } from "@/types/auth/user";

interface UserProfileViewProps {
  userData: UserWithProfile;
}

const toSafeText = (value?: string | null) => (value && value.trim() ? value : "---");

export function UserProfileView({ userData }: UserProfileViewProps) {
  const profile = userData.profile;
  return (
    <section className="user-profile-pages space-y-6">
      <HeadCard
        fullName={toSafeText(userData.full_name)}
        roleTitle="کاربر"
        firstName={toSafeText(profile?.first_name)}
        lastName={toSafeText(profile?.last_name)}
        birthDate={toSafeText(profile?.birth_date)}
        mobile={toSafeText(userData.mobile)}
        phone={toSafeText(profile?.phone)}
        email={toSafeText(userData.email)}
        province={toSafeText(profile?.province?.name)}
        city={toSafeText(profile?.city?.name)}
        address={toSafeText(profile?.address)}
        bio={toSafeText(profile?.bio)}
        nationalId={toSafeText(profile?.national_id)}
        createdAt={toSafeText(userData.created_at)}
        active={Boolean(userData.is_active)}
        avatarUrl={profile?.profile_picture?.file_url || "/images/profileone.webp"}
        coverUrl="/images/profile-banner.png"
        profileViews="0"
        propertyCount="0"
        ticketCount="0"
      />
    </section>
  );
}
