import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { Input } from "@/components/elements/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Avatar, AvatarFallback } from "@/components/elements/Avatar";
import { PaginationControls } from "@/components/shared/Pagination";
import { Plus, Search, Phone, Mail, Award, Edit, Trash2, Eye, Star, MapPin, Building2 } from "lucide-react";

// نوع داده استاتیک برای آژانس‌های املاک
interface AgencyItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  license_number: string;
  established_year: number;
  status: "active" | "inactive";
  created_at: string;
  is_featured: boolean;
  is_active: boolean;
}

// داده‌های استاتیک نمونه
const staticAgencyData: AgencyItem[] = [
  {
    id: 1,
    name: "آژانس املاک پایتخت",
    phone: "021-12345678",
    email: "info@paitakht-agency.com",
    address: "تهران، میدان ونک، خیابان ولیعصر",
    license_number: "AG-12345",
    established_year: 2015,
    status: "active",
    created_at: "2024-01-15T10:30:00Z",
    is_featured: true,
    is_active: true,
  },
  {
    id: 2,
    name: "آژانس املاک زعفرانیه",
    phone: "021-87654321",
    email: "info@zaferanieh-agency.com",
    address: "تهران، زعفرانیه، خیابان ولیعصر",
    license_number: "AG-12346",
    established_year: 2010,
    status: "active",
    created_at: "2024-01-20T14:20:00Z",
    is_featured: true,
    is_active: true,
  },
  {
    id: 3,
    name: "آژانس املاک پاسداران",
    phone: "021-11223344",
    email: "info@pasdaran-agency.com",
    address: "تهران، پاسداران، خیابان فرمانیه",
    license_number: "AG-12347",
    established_year: 2018,
    status: "inactive",
    created_at: "2024-01-10T09:15:00Z",
    is_featured: false,
    is_active: false,
  },
  {
    id: 4,
    name: "آژانس املاک کرج",
    phone: "026-44556677",
    email: "info@karaj-agency.com",
    address: "کرج، میدان آزادی، خیابان شهید بهشتی",
    license_number: "AG-12348",
    established_year: 2012,
    status: "active",
    created_at: "2024-01-25T11:45:00Z",
    is_featured: false,
    is_active: true,
  },
  {
    id: 5,
    name: "آژانس املاک شمال",
    phone: "011-33445566",
    email: "info@shomal-agency.com",
    address: "رشت، میدان شهرداری، خیابان امام خمینی",
    license_number: "AG-12349",
    established_year: 2016,
    status: "active",
    created_at: "2024-01-12T08:30:00Z",
    is_featured: false,
    is_active: true,
  },
  {
    id: 6,
    name: "آژانس املاک اصفهان",
    phone: "031-55667788",
    email: "info@esfahan-agency.com",
    address: "اصفهان، میدان نقش جهان، خیابان چهارباغ",
    license_number: "AG-12350",
    established_year: 2014,
    status: "active",
    created_at: "2024-01-18T13:20:00Z",
    is_featured: true,
    is_active: true,
  },
];

export default function AgenciesListPage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // فیلتر کردن داده‌ها
  const filteredData = staticAgencyData.filter((item) => {
    // جستجو
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(searchLower) ||
        item.phone.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower) ||
        item.address.toLowerCase().includes(searchLower) ||
        item.license_number.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // فیلتر وضعیت
    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }

    // فیلتر ویژه
    if (featuredFilter !== "all") {
      const isFeatured = featuredFilter === "true";
      if (item.is_featured !== isFeatured) {
        return false;
      }
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="مدیریت آژانس‌های املاک">
        <Button 
          size="sm"
          onClick={() => {
            console.log("افزودن آژانس جدید");
          }}
        >
          <Plus className="h-4 w-4" />
          افزودن آژانس
        </Button>
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
              <Select value={featuredFilter} onValueChange={(value) => {
                setFeaturedFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="ویژه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="true">ویژه</SelectItem>
                  <SelectItem value="false">عادی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* کارت‌های آژانس‌ها */}
      {paginatedData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">آژانسی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((agency) => {
              const getInitial = () => {
                if (!agency.name) return "؟";
                return agency.name.charAt(0).toUpperCase();
              };

              return (
                <Card 
                  key={agency.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/staticstyle/realstate/agencies/${agency.id}/view`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-lg">
                            {getInitial()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {agency.name}
                            {agency.is_featured && (
                              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                            )}
                          </CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={agency.status === "active" ? "green" : "red"}>
                              {agency.status === "active" ? "فعال" : "غیرفعال"}
                            </Badge>
                            {agency.is_featured && (
                              <Badge variant="orange">ویژه</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{agency.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{agency.email}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground line-clamp-2">{agency.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">پروانه: {agency.license_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        تاسیس: {agency.established_year}
                      </span>
                    </div>
                    <div className="pt-3 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/staticstyle/realstate/agencies/${agency.id}/view`);
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
                          navigate(`/staticstyle/realstate/agencies/${agency.id}/edit`);
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
                  totalCount={filteredData.length}
                  infoText={`${startIndex + 1} - ${Math.min(endIndex, filteredData.length)} از ${filteredData.length}`}
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
