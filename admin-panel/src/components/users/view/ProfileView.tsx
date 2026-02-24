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
  const socialMedia = profile?.social_media || [];

  return (
    <section className="user-profile-pages space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="user-profile-tabs-list">
          <TabsTrigger value="overview">
            <User className="w-4 h-4" />
            نمای کلی
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="w-4 h-4" />
            وضعیت امنیتی
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="w-4 h-4" />
            شبکه‌های اجتماعی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
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
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>وضعیت حساب کاربری</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>وضعیت کاربر</span>
                {userData.is_active ? <Badge variant="green">فعال</Badge> : <Badge variant="red">غیرفعال</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <span>وضعیت ایمیل</span>
                {userData.email ? <Badge variant="green">ثبت شده</Badge> : <Badge variant="amber">ثبت نشده</Badge>}
              </div>
              <div className="pt-2">
                <Link to={`/users/${userData.id}/edit`}>
                  <Button size="sm">رفتن به صفحه ویرایش</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>شبکه‌های اجتماعی ثبت‌شده</CardTitle>
            </CardHeader>
            <CardContent>
              {socialMedia.length === 0 ? (
                <p className="text-font-s">هیچ شبکه اجتماعی برای این کاربر ثبت نشده است.</p>
              ) : (
                <ul className="space-y-3">
                  {socialMedia.map((item, index) => (
                    <li key={`${item.name}-${index}`} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                      <span className="font-medium">{toSafeText(item.name)}</span>
                      <a href={item.url || "#"} target="_blank" rel="noreferrer" className="text-primary text-sm truncate">
                        {toSafeText(item.url)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
