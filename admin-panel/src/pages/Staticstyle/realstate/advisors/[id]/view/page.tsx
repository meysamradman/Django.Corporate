import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { FileText, Edit2, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/elements/Card";
import { TruncatedText } from "@/components/elements/TruncatedText";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import {
  CheckCircle2,
  XCircle,
  Star,
  Hash,
  Phone,
  Mail,
  Award,
  Calendar,
  Clock,
  Zap,
  User,
} from "lucide-react";

// نوع داده استاتیک برای مشاورین املاک
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
  bio?: string;
  address?: string;
}

// داده استاتیک نمونه
const getStaticAdvisorData = (id: string): AdvisorItem | null => {
  const staticData: AdvisorItem[] = [
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
      bio: "مشاور املاک با بیش از 5 سال سابقه در زمینه خرید و فروش و اجاره املاک مسکونی و تجاری. تخصص در مناطق شمال تهران و زعفرانیه.",
      address: "تهران، زعفرانیه، خیابان ولیعصر",
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
      bio: "مشاور حرفه‌ای املاک با 8 سال تجربه. متخصص در املاک لوکس و ویلاهای شمال.",
      address: "تهران، پاسداران، خیابان فرمانیه",
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
      bio: "مشاور املاک تازه کار با علاقه به یادگیری و پیشرفت.",
      address: "تهران، ونک، خیابان ملاصدرا",
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
      bio: "مشاور با سابقه در زمینه املاک تجاری و اداری.",
      address: "تهران، میدان ونک، خیابان ولیعصر",
    },
  ];

  const item = staticData.find(item => item.id === Number(id));
  return item || null;
};

// کامپوننت Sidebar
function AdvisorSidebar({ advisor }: { advisor: AdvisorItem }) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const getInitial = () => {
    if (!advisor.name) return "؟";
    return advisor.name.charAt(0).toUpperCase();
  };

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-video overflow-hidden border shadow-md">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                {getInitial()}
              </div>
            </div>
          </div>

          <div className="pb-6 pt-2 border-b -mx-6 px-6">
            <div className="grid grid-cols-3 gap-3">
              <div className={`flex flex-col items-center justify-center py-4 px-3 transition-colors ${
                advisor.status === "active" ? "bg-green" : "bg-red"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 mb-2 ${
                  advisor.status === "active" ? "bg-green-0" : "bg-red-0"
                }`}>
                  {advisor.status === "active" ? (
                    <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                  ) : (
                    <XCircle className="w-4 h-4 stroke-red-2" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  advisor.status === "active" ? "text-green-2" : "text-red-2"
                }`}>
                  {advisor.status === "active" ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 transition-colors ${
                advisor.is_active ? "bg-blue" : "bg-red"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 mb-2 ${
                  advisor.is_active ? "bg-blue-0" : "bg-red-0"
                }`}>
                  <Zap className={`w-4 h-4 ${
                    advisor.is_active ? "stroke-blue-2" : "stroke-red-2"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  advisor.is_active ? "text-blue-2" : "text-red-2"
                }`}>
                  {advisor.is_active ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 transition-colors ${
                advisor.is_featured ? "bg-orange" : "bg-gray"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 mb-2 ${
                  advisor.is_featured ? "bg-orange-0" : "bg-gray-0"
                }`}>
                  <Star className={`w-4 h-4 ${
                    advisor.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  advisor.is_featured ? "text-orange-2" : "text-gray-1"
                }`}>
                  {advisor.is_featured ? "ویژه" : "عادی"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-4">
            <div className="space-y-5">
              <div>
                <h4 className="mb-4 text-font-p">اطلاعات پایه</h4>
                <div className="space-y-0 [&>div:not(:last-child)]:border-b">
                  <div className="flex items-center justify-between gap-3 pb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>نام:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={advisor.name}
                        maxLength={40}
                        className="text-font-p"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>شناسه:</label>
                    </div>
                    <p className="text-font-p text-left">
                      #{advisor.id}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>شماره تماس:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {advisor.phone}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>ایمیل:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={advisor.email || "-"}
                        maxLength={35}
                        className="font-mono text-font-p"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>شماره پروانه:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {advisor.license_number}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>سابقه کار:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {advisor.experience_years} سال
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>تاریخ ایجاد:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {formatDate(advisor.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const OverviewTab = ({ advisor }: { advisor: AdvisorItem }) => {
  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <CardWithIcon
        icon={FileText}
        title="بیوگرافی"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        contentClassName="space-y-6"
      >
        <div>
          <div className="text-font-p leading-relaxed p-4 bg-bg/50" style={{ textAlign: 'justify' }}>
            {advisor.bio || (
              <span className="text-font-s">
                بیوگرافی وارد نشده است
              </span>
            )}
          </div>
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={User}
        title="اطلاعات تماس"
        iconBgColor="bg-purple"
        iconColor="stroke-purple-2"
        borderColor="border-b-purple-1"
        contentClassName="space-y-4 pt-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">شماره تماس</p>
              <p className="text-font-p">{advisor.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">ایمیل</p>
              <p className="text-font-p">{advisor.email}</p>
            </div>
          </div>
          {advisor.address && (
            <div className="flex items-center gap-3 md:col-span-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">آدرس</p>
                <p className="text-font-p">{advisor.address}</p>
              </div>
            </div>
          )}
        </div>
      </CardWithIcon>
    </TabsContent>
  );
};

export default function AdvisorViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const advisorId = params?.id ? Number(params.id) : undefined;
  const [activeTab, setActiveTab] = useState("overview");

  const advisorItem = advisorId !== undefined
    ? getStaticAdvisorData(String(advisorId))
    : undefined;

  if (!advisorId || !advisorItem) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش مشاور" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه مشاور یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات مشاور">
        <>
          <Button
            variant="outline"
            onClick={() => console.log("Export PDF for", advisorItem.id)}
          >
            <FileDown className="h-4 w-4" />
            خروجی PDF
          </Button>
          <Button
            onClick={() => navigate(`/staticstyle/realstate/advisors/${advisorItem.id}/edit`)}
          >
            <Edit2 />
            ویرایش مشاور
          </Button>
        </>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <AdvisorSidebar advisor={advisorItem} />
        </div>

        <div className="lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">
                <FileText className="h-4 w-4" />
                مرور کلی
              </TabsTrigger>
            </TabsList>

            <OverviewTab advisor={advisorItem} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

