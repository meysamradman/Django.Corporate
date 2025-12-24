import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Card, CardContent } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { PaginationControls } from "@/components/shared/Pagination";
import { Plus, Search, Phone, Mail, Edit, Trash2, Eye, Loader2, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import { mediaService } from "@/components/media/services";
import { ProtectedButton } from "@/components/admins/permissions";
import { CardItem, type CardItemAction } from "@/components/elements/CardItem";

export default function AgenciesListPage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const queryParams = {
    page: currentPage,
    size: pageSize,
    ...(searchValue && { search: searchValue }),
    ...(statusFilter !== "all" && { is_active: statusFilter === "active" }),
    ...(verifiedFilter !== "all" && { is_verified: verifiedFilter === "true" }),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['real-estate-agencies', queryParams.page, queryParams.size, queryParams.search, queryParams.is_active, queryParams.is_verified],
    queryFn: async () => {
      return await realEstateApi.getAgencies(queryParams);
    },
    staleTime: 0,
    retry: 1,
  });

  const agencies: RealEstateAgency[] = data?.data || [];
  const totalPages = data?.pagination?.total_pages || 1;
  const totalCount = data?.pagination?.count || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getInitial = (agency: RealEstateAgency) => {
    if (agency.name) {
      const parts = agency.name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return agency.name.charAt(0).toUpperCase();
    }
    return "؟";
  };

  const getImageUrl = (agency: RealEstateAgency) => {
    if (agency.logo?.file_url) {
      return mediaService.getMediaUrlFromObject({ file_url: agency.logo.file_url } as any);
    }
    return null;
  };

  const actions: CardItemAction<RealEstateAgency>[] = useMemo(() => [
    {
      label: "مشاهده",
      icon: <Eye className="h-4 w-4" />,
      onClick: (agency) => navigate(`/real-estate/agencies/${agency.id}/view`),
    },
    {
      label: "ویرایش",
      icon: <Edit className="h-4 w-4" />,
      onClick: (agency) => navigate(`/real-estate/agencies/${agency.id}/edit`),
    },
    {
      label: "حذف",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (agency) => console.log("حذف:", agency.id),
      isDestructive: true,
    },
  ], [navigate]);

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت آژانس‌های املاک">
        <ProtectedButton 
          permission="real_estate_agency.create"
          size="sm"
          onClick={() => navigate("/real-estate/agencies/create")}
        >
          <Plus className="h-4 w-4" />
          افزودن آژانس
        </ProtectedButton>
      </PageHeader>

      {/* فیلترها و جستجو */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو در نام، شماره تماس، آدرس..."
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verifiedFilter} onValueChange={(value) => {
                setVerifiedFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="تایید شده" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="true">تایید شده</SelectItem>
                  <SelectItem value="false">تایید نشده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* کارت‌های آژانس‌ها */}
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
      ) : agencies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">آژانسی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {agencies.map((agency) => {
              const imageUrl = getImageUrl(agency);
              const initial = getInitial(agency);

              return (
                <CardItem
                  key={agency.id}
                  item={agency}
                  avatar={{
                    src: imageUrl || undefined,
                    fallback: initial,
                    alt: agency.name,
                  }}
                  title={agency.name}
                  status={{
                    label: agency.is_active ? "فعال" : "غیرفعال",
                    variant: agency.is_active ? "green" : "red",
                  }}
                  actions={actions}
                  content={
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {agency.city_name && (
                        <div className="text-right">
                          <p className="text-xs text-font-s mb-1">شهر</p>
                          <p className="text-sm font-medium text-font-p">{agency.city_name}</p>
                        </div>
                      )}
                      {agency.rating && (
                        <div className="text-left">
                          <p className="text-xs text-font-s mb-1">امتیاز</p>
                          <p className="text-sm font-medium text-font-p">⭐ {agency.rating.toFixed(1)}</p>
                        </div>
                      )}
                    </div>
                  }
                  footer={
                    <>
                      {agency.phone ? (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Phone className="size-4 shrink-0" />
                          <span dir="ltr">{agency.phone}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Phone className="size-4 shrink-0" />
                          <span>-</span>
                        </div>
                      )}
                      {agency.email ? (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Mail className="size-4 shrink-0" />
                          <span className="truncate" dir="ltr">{agency.email}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-font-s">
                          <Mail className="size-4 shrink-0" />
                          <span>وارد نشده</span>
                        </div>
                      )}
                      {agency.address && (
                        <div className="flex items-start gap-2 text-sm text-font-s">
                          <MapPin className="size-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{agency.address}</span>
                        </div>
                      )}
                    </>
                  }
                  onClick={(agency) => navigate(`/real-estate/agencies/${agency.id}/view`)}
                />
              );
            })}
          </div>

          {/* Pagination */}
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
                  infoText={`${((currentPage - 1) * pageSize) + 1} - ${Math.min(currentPage * pageSize, totalCount)} از ${totalCount}`}
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

