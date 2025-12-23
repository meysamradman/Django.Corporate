import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { FileText, Edit2, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/elements/Card";
import { TruncatedText } from "@/components/elements/TruncatedText";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
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
  Building2,
  MapPin,
} from "lucide-react";

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
  description?: string;
}

// داده استاتیک نمونه
const getStaticAgencyData = (id: string): AgencyItem | null => {
  const staticData: AgencyItem[] = [
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
      description: "آژانس املاک پایتخت با بیش از 8 سال سابقه در زمینه خرید و فروش و اجاره املاک مسکونی و تجاری. دارای تیم حرفه‌ای و مجرب.",
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
      description: "آژانس تخصصی در املاک لوکس و ویلاهای شمال تهران.",
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
      description: "آژانس املاک در منطقه پاسداران.",
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
      description: "آژانس املاک در کرج با سابقه در املاک مسکونی و تجاری.",
    },
  ];

  const item = staticData.find(item => item.id === Number(id));
  return item || null;
};

// کامپوننت Sidebar
function AgencySidebar({ agency }: { agency: AgencyItem }) {
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
    if (!agency.name) return "؟";
    return agency.name.charAt(0).toUpperCase();
  };

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md">
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-5xl font-bold">
                {getInitial()}
              </div>
            </div>
          </div>

          <div className="pb-6 pt-2 border-b -mx-6 px-6">
            <div className="grid grid-cols-3 gap-3">
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                agency.status === "active" ? "bg-green" : "bg-red"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  agency.status === "active" ? "bg-green-0" : "bg-red-0"
                }`}>
                  {agency.status === "active" ? (
                    <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                  ) : (
                    <XCircle className="w-4 h-4 stroke-red-2" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  agency.status === "active" ? "text-green-2" : "text-red-2"
                }`}>
                  {agency.status === "active" ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                agency.is_active ? "bg-blue" : "bg-red"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  agency.is_active ? "bg-blue-0" : "bg-red-0"
                }`}>
                  <Zap className={`w-4 h-4 ${
                    agency.is_active ? "stroke-blue-2" : "stroke-red-2"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  agency.is_active ? "text-blue-2" : "text-red-2"
                }`}>
                  {agency.is_active ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                agency.is_featured ? "bg-orange" : "bg-gray"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  agency.is_featured ? "bg-orange-0" : "bg-gray-0"
                }`}>
                  <Star className={`w-4 h-4 ${
                    agency.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  agency.is_featured ? "text-orange-2" : "text-gray-1"
                }`}>
                  {agency.is_featured ? "ویژه" : "عادی"}
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
                      <Building2 className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>نام آژانس:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={agency.name}
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
                      #{agency.id}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>شماره تماس:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {agency.phone}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>ایمیل:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={agency.email || "-"}
                        maxLength={35}
                        className="font-mono text-font-p"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>آدرس:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={agency.address || "-"}
                        maxLength={35}
                        className="text-font-p"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>شماره پروانه:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {agency.license_number}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>سال تاسیس:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {agency.established_year}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>تاریخ ایجاد:</label>
                    </div>
                    <p className="text-font-p text-left">
                      {formatDate(agency.created_at)}
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

const OverviewTab = ({ agency }: { agency: AgencyItem }) => {
  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <CardWithIcon
        icon={FileText}
        title="توضیحات"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        contentClassName="space-y-6"
      >
        <div>
          <div className="text-font-p leading-relaxed p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
            {agency.description || (
              <span className="text-font-s">
                توضیحی وارد نشده است
              </span>
            )}
          </div>
        </div>
      </CardWithIcon>

      <CardWithIcon
        icon={Building2}
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
              <p className="text-font-p">{agency.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">ایمیل</p>
              <p className="text-font-p">{agency.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 md:col-span-2">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">آدرس</p>
              <p className="text-font-p">{agency.address}</p>
            </div>
          </div>
        </div>
      </CardWithIcon>
    </TabsContent>
  );
};

export default function AgencyViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const agencyId = params?.id ? Number(params.id) : undefined;
  const [activeTab, setActiveTab] = useState("overview");

  const agencyItem = agencyId !== undefined
    ? getStaticAgencyData(String(agencyId))
    : undefined;

  if (!agencyId || !agencyItem) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش آژانس" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه آژانس یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات آژانس">
        <>
          <Button
            variant="outline"
            onClick={() => console.log("Export PDF for", agencyItem.id)}
          >
            <FileDown className="h-4 w-4" />
            خروجی PDF
          </Button>
          <Button
            onClick={() => navigate(`/staticstyle/realstate/agencies/${agencyItem.id}/edit`)}
          >
            <Edit2 />
            ویرایش آژانس
          </Button>
        </>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <AgencySidebar agency={agencyItem} />
        </div>

        <div className="lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">
                <FileText className="h-4 w-4" />
                مرور کلی
              </TabsTrigger>
            </TabsList>

            <OverviewTab agency={agencyItem} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}

