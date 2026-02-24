import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Building2, Calendar, CheckCircle2, Eye, FileDigit, Hash } from "lucide-react";
import { adminApi } from "@/api/admins/admins";
import { realEstateApi } from "@/api/real-estate/properties";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { HeadCard } from "@/components/static/admin/profile/HeadCard";
import { ProfilePropertiesList, type ProfilePropertyItem } from "@/components/static/agent/profile/ProfilePropertiesList";
import { InfoItem } from "@/components/static/agent/profile/InfoItem";
import { Separator } from "@/components/elements/Separator";
import { Skeleton } from "@/components/elements/Skeleton";
import { ApiError } from "@/types/api/apiError";

interface DynamicProfileViewProps {
  adminId: string;
  profileMode: "admin" | "agent";
}

const FALLBACK_AVATAR = "/images/profileone.webp";
const FALLBACK_COVER = "/images/profile-banner.png";

const formatDate = (value?: string | null) => {
  if (!value) return "---";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const formatMoneyToMillion = (value?: number | null) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "0 میلیون";
  return `${new Intl.NumberFormat("en-US").format(Math.round(value / 1_000_000))} میلیون`;
};

const mapPropertyStatus = (isActive?: boolean, isPublished?: boolean): "فعال" | "در انتظار" | "غیرفعال" => {
  if (!isActive) return "غیرفعال";
  if (isPublished) return "فعال";
  return "در انتظار";
};

const toSafeString = (value?: string | null) => {
  if (!value || !value.trim()) return "---";
  return value;
};

export function DynamicProfileView({ adminId, profileMode }: DynamicProfileViewProps) {
  const isMeRoute = adminId === "me";
  const isNumericId = !Number.isNaN(Number(adminId));
  const [propertiesPage, setPropertiesPage] = useState(1);
  const [propertiesPageSize, setPropertiesPageSize] = useState(10);

  const { data: adminData, isLoading, error } = useQuery({
    queryKey: ["profile-view", isMeRoute ? "me" : adminId, profileMode],
    queryFn: () => {
      if (isMeRoute) return adminApi.getCurrentAdminManagedProfile();
      if (!isNumericId) return Promise.reject(new Error("شناسه نامعتبر است"));
      return adminApi.getAdminById(Number(adminId));
    },
    retry: (failureCount, requestError) => {
      if (requestError instanceof ApiError && requestError.response.AppStatusCode === 403) return false;
      return failureCount < 2;
    },
  });

  const { data: propertiesResponse, isLoading: isPropertiesLoading } = useQuery({
    queryKey: [
      "profile-view-properties",
      adminData?.id,
      adminData?.agent_profile?.id,
      profileMode,
      propertiesPage,
      propertiesPageSize,
    ],
    enabled: Boolean(
      profileMode === "agent"
        ? adminData?.agent_profile?.id
        : adminData?.id
    ),
    queryFn: () =>
      realEstateApi.getPropertyList(
        profileMode === "agent"
          ? { page: propertiesPage, size: propertiesPageSize, agent: adminData?.agent_profile?.id, order_desc: true }
          : { page: propertiesPage, size: propertiesPageSize, created_by: adminData?.id, order_desc: true }
      ),
    placeholderData: (previousData) => previousData,
  });

  const mappedProperties = useMemo<ProfilePropertyItem[]>(() => {
    const rawProperties = propertiesResponse?.data ?? [];
    return rawProperties.map((property) => ({
      id: property.id,
      title: toSafeString(property.title),
      city: toSafeString(property.city_name),
      propertyType: toSafeString(property.property_type?.title),
      dealType: "فروش",
      status: mapPropertyStatus(property.is_active, property.is_published),
      price: formatMoneyToMillion(
        property.sale_price ??
          property.pre_sale_price ??
          property.monthly_rent ??
          property.rent_amount ??
          property.mortgage_amount ??
          property.price
      ),
      viewLink: `/real-estate/properties/${property.id}/view`,
    }));
  }, [propertiesResponse?.data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (error || !adminData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>دریافت اطلاعات پروفایل با خطا مواجه شد.</AlertDescription>
      </Alert>
    );
  }

  const firstName = adminData.profile?.first_name ?? "";
  const lastName = adminData.profile?.last_name ?? "";
  const fullName =
    adminData.profile?.full_name ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    adminData.full_name ||
    "---";

  const roleTitle =
    profileMode === "agent"
      ? "مشاور املاک"
      : adminData.is_superuser
      ? "سوپر ادمین"
      : "ادمین پنل";

  const consultantStats = {
    totalProperties: propertiesResponse?.pagination?.count ?? 0,
    activeProperties: mappedProperties.filter((item) => item.status === "فعال").length,
    soldProperties: adminData.agent_profile?.total_sales ?? 0,
    totalViews: String(adminData.agent_profile?.total_reviews ?? 0),
  };

  const isConsultant = profileMode === "agent";

  return (
    <section className="space-y-6 pb-8 min-h-[calc(100dvh-100px)]">
      <HeadCard
        fullName={fullName}
        roleTitle={roleTitle}
        firstName={toSafeString(firstName)}
        lastName={toSafeString(lastName)}
        birthDate={formatDate(adminData.profile?.birth_date)}
        mobile={toSafeString(adminData.mobile)}
        phone={toSafeString(adminData.profile?.phone)}
        email={toSafeString(adminData.email)}
        province={toSafeString(adminData.profile?.province?.name)}
        city={toSafeString(adminData.profile?.city?.name)}
        address={toSafeString(adminData.profile?.address)}
        bio={toSafeString(isConsultant ? adminData.agent_profile?.bio : adminData.profile?.bio)}
        nationalId={toSafeString(adminData.profile?.national_id)}
        createdAt={formatDate(adminData.created_at)}
        active={adminData.is_active}
        avatarUrl={adminData.profile?.profile_picture?.file_url || FALLBACK_AVATAR}
        coverUrl={FALLBACK_COVER}
        profileViews={String(consultantStats.totalViews)}
        propertyCount={String(consultantStats.totalProperties)}
        ticketCount={String(consultantStats.activeProperties)}
      />

      {isConsultant && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="کل آگهی‌ها" value={consultantStats.totalProperties} variant="blue" icon={Building2} />
            <StatCard label="آگهی فعال" value={consultantStats.activeProperties} variant="green" icon={CheckCircle2} />
            <StatCard label="فروش موفق" value={consultantStats.soldProperties} variant="amber" icon={Calendar} />
            <StatCard label="بازدید پروفایل" value={consultantStats.totalViews} variant="purple" icon={Eye} />
          </div>

          <Card className="gap-0">
            <CardHeader className="border-b">
              <CardTitle>اطلاعات حرفه‌ای و پروانه کسب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem label="شماره پروانه" value={toSafeString(adminData.agent_profile?.license_number)} dir="ltr" icon={FileDigit} />
                <InfoItem label="تاریخ انقضا" value={formatDate(adminData.agent_profile?.license_expire_date)} dir="ltr" icon={Calendar} />
                <InfoItem label="تخصص" value={toSafeString(adminData.agent_profile?.specialization)} icon={Hash} />
                <InfoItem label="آژانس" value={toSafeString(adminData.agent_profile?.agency?.name)} icon={Building2} />
              </div>

              <Separator className="bg-br/40" />

              <div className="flex items-center justify-between gap-3 rounded-xl border border-br p-4 bg-divi/30">
                <div>
                  <p className="text-sm font-semibold text-font-p">وضعیت احراز هویت مشاور</p>
                  <p className="text-xs text-font-s">{adminData.agent_profile?.is_verified ? "تایید شده" : "در انتظار تایید"}</p>
                </div>
                {adminData.agent_profile?.is_verified ? <Badge variant="green">مشاور تایید شده</Badge> : <Badge variant="amber">در انتظار</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader className="border-b">
              <CardTitle>تنظیمات سئو پروفایل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Meta Title" value={toSafeString(adminData.agent_profile?.meta_title)} />
                <InfoItem label="OG Title" value={toSafeString(adminData.agent_profile?.og_title)} />
                <InfoItem label="Meta Description" value={toSafeString(adminData.agent_profile?.meta_description)} className="md:col-span-2" />
                <InfoItem label="OG Description" value={toSafeString(adminData.agent_profile?.og_description)} className="md:col-span-2" />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ProfilePropertiesList
        isConsultant={isConsultant}
        properties={mappedProperties}
        isLoading={isPropertiesLoading}
        currentPage={propertiesResponse?.pagination?.current_page || propertiesPage}
        totalPages={propertiesResponse?.pagination?.total_pages || 1}
        pageSize={propertiesResponse?.pagination?.page_size || propertiesPageSize}
        totalCount={propertiesResponse?.pagination?.count || 0}
        onPageChange={(page) => setPropertiesPage(page)}
        onPageSizeChange={(size) => {
          setPropertiesPageSize(size);
          setPropertiesPage(1);
        }}
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant: "blue" | "green" | "amber" | "purple";
}) {
  const styleMap: Record<"blue" | "green" | "amber" | "purple", string> = {
    blue: "bg-blue-0 border-blue text-blue-2",
    green: "bg-green-0 border-green text-green-2",
    amber: "bg-amber-0 border-amber text-amber-2",
    purple: "bg-purple-0 border-purple text-purple-2",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styleMap[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-font-s">{label}</span>
        <span className="rounded-lg bg-card p-2">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-xl font-black text-font-p">{value}</p>
    </div>
  );
}
