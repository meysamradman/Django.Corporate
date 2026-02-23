import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Building2, Calendar, CheckCircle2, Edit2, FileDigit, Globe, Hash, UserRound } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { Button } from "@/components/elements/Button";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Skeleton } from "@/components/elements/Skeleton";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { InfoItem } from "@/components/static/agent/profile/InfoItem";
import { HeadCard } from "@/components/static/admin/profile/HeadCard";
import { Separator } from "@/components/elements/Separator";
import { mediaService } from "@/components/media/services";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import { PaginationControls } from "@/components/shared/paginations/PaginationControls";
import { Loader } from "@/components/elements/Loader";
import { adminApi } from "@/api/admins/admins";
import type { AdminWithProfile } from "@/types/auth/admin";

interface DynamicAgencyViewProps {
  agencyId: string;
}

export function DynamicAgencyView({ agencyId }: DynamicAgencyViewProps) {
  const navigate = useNavigate();
  const isNumericId = !Number.isNaN(Number(agencyId));
  const [agentsPage, setAgentsPage] = useState(1);
  const [agentsPageSize, setAgentsPageSize] = useState(10);

  const formatDate = (value?: string | null) => {
    if (!value) return "---";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const toSafeString = (value?: string | null) => {
    if (!value || !value.trim()) return "---";
    return value;
  };

  const { data: agencyData, isLoading, error } = useQuery({
    queryKey: ["agency-view", agencyId],
    queryFn: () => {
      if (!isNumericId) return Promise.reject(new Error("شناسه نامعتبر است"));
      return realEstateApi.getAgencyById(Number(agencyId));
    },
    enabled: Boolean(agencyId),
    staleTime: 0,
  });

  const { data: agentsResponse, isLoading: isAgentsLoading } = useQuery({
    queryKey: ["agency-view-agents", agencyId, agentsPage, agentsPageSize],
    enabled: Boolean(agencyData?.id),
    queryFn: () => realEstateApi.getAgents({ page: agentsPage, size: agentsPageSize, agency: agencyData?.id }),
    placeholderData: (previousData) => previousData,
  });

  const shouldUseFallbackAdmins =
    (agentsResponse?.pagination?.count ?? 0) === 0 && (agencyData?.agent_count ?? 0) > 0;

  const {
    data: fallbackAdminsResponse,
    isLoading: isFallbackAdminsLoading,
  } = useQuery({
    queryKey: ["agency-view-admin-fallback", agencyId],
    enabled: Boolean(agencyData?.id && shouldUseFallbackAdmins),
    queryFn: () =>
      adminApi.getAdminList({
        user_role_type: "consultant",
        no_pagination: true,
      } as any),
    staleTime: 0,
  });

  type AgencyAdvisorRow = {
    id: number | string;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    is_active: boolean;
    view_admin_id: number | string;
  };

  const fallbackAgencyAdvisors = useMemo<AgencyAdvisorRow[]>(() => {
    if (!agencyData?.id) return [];
    const raw = (fallbackAdminsResponse?.data || []) as AdminWithProfile[];
    return raw
      .filter((admin) => Number(admin.agent_profile?.agency?.id) === Number(agencyData.id))
      .map((admin) => ({
        id: admin.agent_profile?.id || admin.id,
        full_name:
          admin.profile?.full_name ||
          [admin.profile?.first_name, admin.profile?.last_name].filter(Boolean).join(" ") ||
          admin.full_name ||
          "---",
        phone: admin.mobile || admin.profile?.phone || null,
        email: admin.email || null,
        is_active: Boolean(admin.is_active),
        view_admin_id: admin.id,
      }));
  }, [agencyData?.id, fallbackAdminsResponse?.data]);

  const isFallbackMode = shouldUseFallbackAdmins && fallbackAgencyAdvisors.length > 0;

  const primaryAdvisors = useMemo<AgencyAdvisorRow[]>(() => {
    const rawAgents = (agentsResponse?.data || []) as PropertyAgent[];
    return rawAgents.map((agent) => ({
      id: agent.id,
      full_name: agent.full_name || `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || "---",
      phone: agent.phone || null,
      email: agent.email || null,
      is_active: Boolean(agent.is_active),
      view_admin_id: agent.user || agent.id,
    }));
  }, [agentsResponse?.data]);

  const fallbackTotalCount = fallbackAgencyAdvisors.length;
  const fallbackTotalPages = Math.max(1, Math.ceil(fallbackTotalCount / agentsPageSize));
  const fallbackStart = (agentsPage - 1) * agentsPageSize;
  const pagedFallbackAdvisors = fallbackAgencyAdvisors.slice(fallbackStart, fallbackStart + agentsPageSize);

  const agencyAdvisors: AgencyAdvisorRow[] = isFallbackMode ? pagedFallbackAdvisors : primaryAdvisors;
  const effectiveTotalCount = isFallbackMode ? fallbackTotalCount : agentsResponse?.pagination?.count || 0;
  const effectiveTotalPages = isFallbackMode ? fallbackTotalPages : agentsResponse?.pagination?.total_pages || 1;
  const effectiveCurrentPage = isFallbackMode ? agentsPage : agentsResponse?.pagination?.current_page || agentsPage;
  const effectivePageSize = isFallbackMode ? agentsPageSize : agentsResponse?.pagination?.page_size || agentsPageSize;
  const effectiveIsAgentsLoading = isFallbackMode ? isFallbackAdminsLoading : isAgentsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="اطلاعات آژانس">
          <Button disabled>
            <Edit2 />
            ویرایش آژانس
          </Button>
        </PageHeader>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !agencyData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>دریافت اطلاعات آژانس با خطا مواجه شد.</AlertDescription>
      </Alert>
    );
  }

  const avatarCandidate =
    agencyData.profile_picture?.file_url ||
    agencyData.logo?.file_url ||
    null;
  const coverCandidate = agencyData.cover_image?.file_url || null;

  const avatarUrl = avatarCandidate
    ? mediaService.getMediaUrlFromObject({ file_url: avatarCandidate } as any)
    : "/images/profileone.webp";

  const coverUrl = coverCandidate
    ? mediaService.getMediaUrlFromObject({ file_url: coverCandidate } as any)
    : "/images/profile-banner.png";

  return (
    <section className="space-y-6 pb-8 min-h-[calc(100dvh-100px)]">
      <PageHeader title="اطلاعات آژانس">
        <Button onClick={() => navigate(`/admins/agencies/${agencyId}/edit`)}>
          <Edit2 />
          ویرایش آژانس
        </Button>
      </PageHeader>

      <HeadCard
        fullName={agencyData.name || "---"}
        roleTitle="آژانس املاک"
        firstName={toSafeString(agencyData.name)}
        lastName={"---"}
        birthDate={formatDate(agencyData.license_expire_date)}
        mobile={toSafeString(agencyData.phone)}
        phone={toSafeString(agencyData.phone)}
        email={toSafeString(agencyData.email)}
        province={toSafeString(agencyData.province_name)}
        city={toSafeString(agencyData.city_name)}
        address={toSafeString(agencyData.address)}
        bio={toSafeString(agencyData.description)}
        nationalId={toSafeString(agencyData.license_number)}
        createdAt={formatDate(agencyData.created_at)}
        active={agencyData.is_active}
        avatarUrl={avatarUrl}
        coverUrl={coverUrl}
        profileViews={String(agencyData.total_reviews ?? 0)}
        propertyCount={String(agencyData.property_count ?? 0)}
        ticketCount={String(agencyData.agent_count ?? 0)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="کل املاک" value={agencyData.property_count ?? 0} variant="blue" icon={Building2} />
        <StatCard label="مشاوران" value={agencyData.agent_count ?? 0} variant="green" icon={CheckCircle2} />
        <StatCard label="نظرات" value={agencyData.total_reviews ?? 0} variant="amber" icon={Calendar} />
        <StatCard label="امتیاز" value={agencyData.rating ?? 0} variant="purple" icon={Building2} />
      </div>

      <CardWithIcon
        icon={Building2}
        title="اطلاعات آژانس"
        iconBgColor="bg-indigo-0"
        iconColor="text-indigo-1"
        cardBorderColor="border-b-indigo-1"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem label="شماره پروانه" value={toSafeString(agencyData.license_number)} dir="ltr" icon={FileDigit} />
          <InfoItem label="تاریخ انقضا" value={formatDate(agencyData.license_expire_date)} dir="ltr" icon={Calendar} />
          <InfoItem label="تلفن" value={toSafeString(agencyData.phone)} dir="ltr" icon={Hash} />
          <InfoItem label="وب‌سایت" value={toSafeString(agencyData.website)} icon={Globe} />
          <InfoItem label="استان" value={toSafeString(agencyData.province_name)} icon={Building2} />
          <InfoItem label="شهر" value={toSafeString(agencyData.city_name)} icon={Building2} />
          <InfoItem label="آدرس" value={toSafeString(agencyData.address)} className="sm:col-span-2" />
        </div>

        <Separator className="my-5 bg-indigo-1/30" />

        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo p-4 bg-indigo-0/40">
          <div>
            <p className="text-sm font-semibold text-font-p">وضعیت تایید آژانس</p>
            <p className="text-xs text-font-s">{agencyData.is_verified ? "تایید شده" : "در انتظار تایید"}</p>
          </div>
          {agencyData.is_verified ? <Badge variant="green">آژانس تایید شده</Badge> : <Badge variant="amber">در انتظار</Badge>}
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={Globe}
        title="تنظیمات سئو آژانس"
        iconBgColor="bg-teal-0"
        iconColor="text-teal-1"
        cardBorderColor="border-b-teal-1"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Meta Title" value={toSafeString(agencyData.meta_title)} />
          <InfoItem label="OG Title" value={toSafeString(agencyData.og_title)} />
          <InfoItem label="Meta Description" value={toSafeString(agencyData.meta_description)} className="md:col-span-2" />
          <InfoItem label="OG Description" value={toSafeString(agencyData.og_description)} className="md:col-span-2" />
          <InfoItem label="Canonical URL" value={toSafeString(agencyData.canonical_url)} className="md:col-span-2" />
          <InfoItem label="Robots" value={toSafeString(agencyData.robots_meta)} className="md:col-span-2" />
        </div>
      </CardWithIcon>

      <AgencyAgentsList
        agents={agencyAdvisors}
        isLoading={effectiveIsAgentsLoading}
        currentPage={effectiveCurrentPage}
        totalPages={effectiveTotalPages}
        pageSize={effectivePageSize}
        totalCount={effectiveTotalCount}
        onPageChange={setAgentsPage}
        onPageSizeChange={(size) => {
          setAgentsPageSize(size);
          setAgentsPage(1);
        }}
      />
    </section>
  );
}

function AgencyAgentsList({
  agents,
  isLoading,
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: {
  agents: Array<{
    id: number | string;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    is_active: boolean;
    view_admin_id: number | string;
  }>;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const navigate = useNavigate();
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <CardWithIcon
      icon={UserRound}
      title="لیست مشاوران آژانس"
      iconBgColor="bg-blue-0"
      iconColor="text-blue-1"
      cardBorderColor="border-b-blue-1"
      titleExtra={<Badge variant="gray">{agents.length}</Badge>}
    >
      {agents.length === 0 && !isLoading ? (
        <div className="rounded-xl border border-dashed border-br p-6 text-center text-font-s">مشاوری برای این آژانس ثبت نشده است.</div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {isLoading && agents.length === 0
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={`loading-agent-${index}`} className="rounded-xl border border-br bg-card p-3">
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))
              : agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between gap-3 rounded-xl border border-br bg-card p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-font-p truncate">{agent.full_name || "---"}</p>
                  <p className="text-xs text-font-s truncate">{agent.phone || agent.email || "---"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={agent.is_active ? "green" : "red"}>{agent.is_active ? "فعال" : "غیرفعال"}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/agents/${agent.view_admin_id}/view`)}
                  >
                    مشاهده
                  </Button>
                </div>
              </div>
            ))}

            {isLoading && agents.length > 0 && (
              <div className="rounded-xl border border-br bg-card p-3">
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="rounded-xl border border-br bg-card py-1">
                <Loader />
              </div>
            )}
          </div>

          <div className="flex justify-center border-t border-br/40 pt-4">
            <div className="w-full max-w-3xl">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
                pageSizeOptions={[10, 20, 50]}
                showPageSize={true}
                showInfo={true}
                infoText={`${rangeStart} - ${rangeEnd} از ${totalCount}`}
                totalCount={totalCount}
              />
            </div>
          </div>
        </div>
      )}
    </CardWithIcon>
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
