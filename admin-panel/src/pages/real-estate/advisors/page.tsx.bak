import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Card, CardContent } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { PersianDatePicker } from "@/components/elements/PersianDatePicker";
import { PaginationControls } from "@/components/shared/paginations/PaginationControls";
import { Plus, Search, Phone, Mail, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import { ProtectedButton } from "@/core/permissions";
import { CardItem } from "@/components/elements/CardItem";
import { usePropertyAdvisorListState } from "@/components/real-estate/hooks/usePropertyAdvisorListState";
import { usePropertyAdvisorCardHelpers } from "@/components/real-estate/hooks/usePropertyAdvisorCardHelpers";

export default function AdvisorsListPage() {
  const navigate = useNavigate();

  const {
    searchValue,
    statusFilter,
    verifiedFilter,
    dateFrom,
    dateTo,
    currentPage,
    pageSize,
    queryParams,
    handleSearchChange,
    handleStatusChange,
    handleVerifiedChange,
    handleDateFromChange,
    handleDateToChange,
    handlePageChange,
    handlePageSizeChange,
  } = usePropertyAdvisorListState();

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "property-agents",
      queryParams.page,
      queryParams.size,
      queryParams.search,
      queryParams.is_active,
      queryParams.is_verified,
      queryParams.date_from,
      queryParams.date_to,
    ],
    queryFn: async () => {
      return await realEstateApi.getAgents(queryParams);
    },
    staleTime: 0,
    retry: 1,
  });

  const advisors: PropertyAgent[] = data?.data || [];
  const totalPages = data?.pagination?.total_pages || 1;
  const totalCount = data?.pagination?.count || 0;

  const { getInitial, getImageUrl, actions } = usePropertyAdvisorCardHelpers({ navigate });

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت مشاورین املاک">
        <ProtectedButton permission="real_estate.agent.create" size="sm" onClick={() => navigate("/real-estate/agents/create")}>
          <Plus className="h-4 w-4" />
          افزودن مشاور
        </ProtectedButton>
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در نام، شماره تماس، ایمیل..."
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-37.5">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verifiedFilter} onValueChange={handleVerifiedChange}>
                <SelectTrigger className="w-37.5">
                  <SelectValue placeholder="تایید شده" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="true">تایید شده</SelectItem>
                  <SelectItem value="false">تایید نشده</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <PersianDatePicker value={dateFrom} onChange={handleDateFromChange} placeholder="از تاریخ" className="h-9 w-36" />
                <span className="text-xs text-font-s">تا</span>
                <PersianDatePicker value={dateTo} onChange={handleDateToChange} placeholder="تا تاریخ" className="h-9 w-36" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">خطا در بارگذاری داده‌ها</p>
          </CardContent>
        </Card>
      ) : advisors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">مشاوری یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {advisors.map((advisor) => {
              const imageUrl = getImageUrl(advisor);
              const initial = getInitial(advisor);
              const fullName = advisor.full_name || `${advisor.first_name} ${advisor.last_name}`.trim();

              return (
                <CardItem
                  key={advisor.id}
                  item={advisor}
                  avatar={{
                    src: imageUrl || undefined,
                    fallback: initial,
                    alt: fullName,
                  }}
                  title={fullName}
                  status={{
                    label: advisor.is_active ? "فعال" : "غیرفعال",
                    variant: advisor.is_active ? "green" : "red",
                  }}
                  actions={actions}
                  content={
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {advisor.specialization && (
                        <div className="text-right">
                          <p className="text-xs text-font-s mb-1">تخصص</p>
                          <p className="text-sm font-medium text-font-p">{advisor.specialization}</p>
                        </div>
                      )}
                      {advisor.city_name && (
                        <div className="text-left">
                          <p className="text-xs text-font-s mb-1">شهر</p>
                          <p className="text-sm font-medium text-font-p">{advisor.city_name}</p>
                        </div>
                      )}
                    </div>
                  }
                  footer={
                    <>
                      {advisor.phone ? (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Phone className="size-4 shrink-0" />
                          <span dir="ltr">{advisor.phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Phone className="size-4 shrink-0" />
                          <span>-</span>
                        </div>
                      )}
                      {advisor.email ? (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Mail className="size-4 shrink-0" />
                          <span className="truncate" dir="ltr">
                            {advisor.email}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Mail className="size-4 shrink-0" />
                          <span>وارد نشده</span>
                        </div>
                      )}
                    </>
                  }
                  onClick={(agent) => navigate(`/real-estate/agents/${agent.id}/view`)}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[6, 12, 18, 24]}
                  showPageSize={true}
                  showInfo={true}
                  totalCount={totalCount}
                  infoText={`${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, totalCount)} از ${totalCount}`}
                  showFirstLast={true}
                  showPageNumbers={true}
                  siblingCount={1}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
