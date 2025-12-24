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
import { Plus, Search, Phone, Mail, Award, Calendar, Edit, Trash2, Eye, Star, Loader2 } from "lucide-react";
import { formatDate } from "@/core/utils/format";
import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyAgent } from "@/types/real_estate/agent/propertyAgent";
import { mediaService } from "@/components/media/services";
import { ProtectedButton } from "@/components/admins/permissions";

export default function AdvisorsListPage() {
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
    queryKey: ['property-agents', queryParams.page, queryParams.size, queryParams.search, queryParams.is_active, queryParams.is_verified],
    queryFn: async () => {
      return await realEstateApi.getAgents(queryParams);
    },
    staleTime: 0,
    retry: 1,
  });

  const advisors: PropertyAgent[] = data?.data || [];
  const totalPages = data?.pagination?.total_pages || 1;
  const totalCount = data?.pagination?.count || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const getInitial = (agent: PropertyAgent) => {
    if (agent.full_name) {
      return agent.full_name.charAt(0).toUpperCase();
    }
    if (agent.first_name) {
      return agent.first_name.charAt(0).toUpperCase();
    }
    return "؟";
  };

  const getImageUrl = (agent: PropertyAgent) => {
    if (agent.profile_image?.file_url) {
      return mediaService.getMediaUrlFromObject({ file_url: agent.profile_image.file_url } as any);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت مشاورین املاک">
        <ProtectedButton 
          permission="property_agent.create"
          size="sm"
          onClick={() => {
            console.log("افزودن مشاور جدید");
          }}
        >
          <Plus className="h-4 w-4" />
          افزودن مشاور
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
                  placeholder="جستجو در نام، شماره تماس، ایمیل..."
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

      {/* کارت‌های مشاورین */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advisors.map((advisor) => {
              const imageUrl = getImageUrl(advisor);
              const initial = getInitial(advisor);
              const fullName = advisor.full_name || `${advisor.first_name} ${advisor.last_name}`.trim();

              return (
                <Card 
                  key={advisor.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/real-estate/advisors/${advisor.id}/view`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {imageUrl ? (
                            <AvatarImage src={imageUrl} alt={fullName} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                              {initial}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {fullName}
                            {advisor.is_verified && (
                              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                            )}
                          </CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={advisor.is_active ? "green" : "red"}>
                              {advisor.is_active ? "فعال" : "غیرفعال"}
                            </Badge>
                            {advisor.is_verified && (
                              <Badge variant="orange">تایید شده</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {advisor.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{advisor.phone}</span>
                      </div>
                    )}
                    {advisor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{advisor.email}</span>
                      </div>
                    )}
                    {advisor.license_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">پروانه: {advisor.license_number}</span>
                      </div>
                    )}
                    {advisor.experience_years && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {advisor.experience_years} سال سابقه کار
                        </span>
                      </div>
                    )}
                    {advisor.city_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">شهر: {advisor.city_name}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/real-estate/agents/${advisor.id}/view`);
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
                          navigate(`/real-estate/agents/${advisor.id}/edit`);
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
                          console.log("حذف:", advisor.id);
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

