import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { PaginationControls } from "@/components/shared/Pagination";
import { Plus, Search, Phone, Mail, Award, Calendar, Edit, Trash2, Eye, Star, Loader2, MapPin, Building2 } from "lucide-react";
import { formatDate } from "@/core/utils/format";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import { mediaService } from "@/components/media/services";
import { ProtectedButton } from "@/components/admins/permissions";

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

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت آژانس‌های املاک">
        <ProtectedButton 
          permission="real_estate_agency.create"
          size="sm"
          onClick={() => {
            console.log("افزودن آژانس جدید");
          }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agencies.map((agency) => {
              const imageUrl = getImageUrl(agency);
              const initial = getInitial(agency);

              return (
                <Card 
                  key={agency.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/real-estate/agencies/${agency.id}/view`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {imageUrl ? (
                            <AvatarImage src={imageUrl} alt={agency.name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-lg">
                              {initial}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {agency.name}
                            {agency.is_verified && (
                              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                            )}
                          </CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={agency.is_active ? "green" : "red"}>
                              {agency.is_active ? "فعال" : "غیرفعال"}
                            </Badge>
                            {agency.is_verified && (
                              <Badge variant="orange">تایید شده</Badge>
                            )}
                            {agency.rating && (
                              <Badge variant="blue">
                                ⭐ {agency.rating.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {agency.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{agency.phone}</span>
                      </div>
                    )}
                    {agency.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{agency.email}</span>
                      </div>
                    )}
                    {agency.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground line-clamp-2">{agency.address}</span>
                      </div>
                    )}
                    {agency.license_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">پروانه: {agency.license_number}</span>
                      </div>
                    )}
                    {agency.city_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">شهر: {agency.city_name}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/real-estate/agencies/${agency.id}/view`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        مشاهده
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/real-estate/agencies/${agency.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        ویرایش
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("حذف:", agency.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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

