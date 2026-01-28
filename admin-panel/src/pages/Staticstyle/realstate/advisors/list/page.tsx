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
import { Plus, Search, Phone, Mail, Award, Calendar, Edit, Trash2, Eye, Star } from "lucide-react";

interface AdvisorItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  license_number: string;
  experience_years: number;
  status: "active" | "inactive";
  created_at: string;
  is_featured: boolean;
  is_active: boolean;
}

const staticAdvisorData: AdvisorItem[] = [
  {
    id: 1,
    name: "علی احمدی",
    phone: "09123456789",
    email: "ali.ahmadi@example.com",
    license_number: "RE-12345",
    experience_years: 5,
    status: "active",
    created_at: "2024-01-15T10:30:00Z",
    is_featured: true,
    is_active: true,
  },
  {
    id: 2,
    name: "مریم رضایی",
    phone: "09129876543",
    email: "maryam.rezaei@example.com",
    license_number: "RE-12346",
    experience_years: 8,
    status: "active",
    created_at: "2024-01-20T14:20:00Z",
    is_featured: true,
    is_active: true,
  },
  {
    id: 3,
    name: "حسین کریمی",
    phone: "09121112233",
    email: "hossein.karimi@example.com",
    license_number: "RE-12347",
    experience_years: 3,
    status: "inactive",
    created_at: "2024-01-10T09:15:00Z",
    is_featured: false,
    is_active: false,
  },
  {
    id: 4,
    name: "فاطمه محمدی",
    phone: "09124445566",
    email: "fateme.mohammadi@example.com",
    license_number: "RE-12348",
    experience_years: 10,
    status: "active",
    created_at: "2024-01-25T11:45:00Z",
    is_featured: false,
    is_active: true,
  },
  {
    id: 5,
    name: "رضا نوری",
    phone: "09127778899",
    email: "reza.nouri@example.com",
    license_number: "RE-12349",
    experience_years: 7,
    status: "active",
    created_at: "2024-01-12T08:30:00Z",
    is_featured: false,
    is_active: true,
  },
  {
    id: 6,
    name: "سارا احمدی",
    phone: "09125556677",
    email: "sara.ahmadi@example.com",
    license_number: "RE-12350",
    experience_years: 4,
    status: "active",
    created_at: "2024-01-18T13:20:00Z",
    is_featured: true,
    is_active: true,
  },
];

export default function AdvisorsListPage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const filteredData = staticAdvisorData.filter((item) => {
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(searchLower) ||
        item.phone.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower) ||
        item.license_number.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== "all" && item.status !== statusFilter) {
      return false;
    }

    if (featuredFilter !== "all") {
      const isFeatured = featuredFilter === "true";
      if (item.is_featured !== isFeatured) {
        return false;
      }
    }

    return true;
  });

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
      <PageHeader title="مدیریت مشاورین املاک">
        <Button 
          size="sm"
        >
          <Plus className="h-4 w-4" />
          افزودن مشاور
        </Button>
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

      {paginatedData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">مشاوری یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.map((advisor) => {
              const getInitial = () => {
                if (!advisor.name) return "؟";
                return advisor.name.charAt(0).toUpperCase();
              };

              return (
                <Card 
                  key={advisor.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/staticstyle/realstate/advisors/${advisor.id}/view`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                            {getInitial()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {advisor.name}
                            {advisor.is_featured && (
                              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                            )}
                          </CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={advisor.status === "active" ? "green" : "red"}>
                              {advisor.status === "active" ? "فعال" : "غیرفعال"}
                            </Badge>
                            {advisor.is_featured && (
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
                      <span className="text-muted-foreground">{advisor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{advisor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">پروانه: {advisor.license_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {advisor.experience_years} سال سابقه کار
                      </span>
                    </div>
                    <div className="pt-3 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/staticstyle/realstate/advisors/${advisor.id}/view`);
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
                          navigate(`/staticstyle/realstate/advisors/${advisor.id}/edit`);
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
