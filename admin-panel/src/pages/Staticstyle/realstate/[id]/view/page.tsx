import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Button } from "@/components/elements/Button";
import { FileText, Image, Search, Edit2, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/elements/Card";
import { TruncatedText } from "@/components/elements/TruncatedText";
import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions } from "@/components/elements/Item";
import { Switch } from "@/components/elements/Switch";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { ReadMore } from "@/components/elements/ReadMore";
import { Badge } from "@/components/elements/Badge";
import {
  CheckCircle2,
  XCircle,
  Star,
  Hash,
  Link as LinkIcon,
  Clock,
  Zap,
  MapPin,
  Home,
  DollarSign,
  Ruler,
  Bed,
} from "lucide-react";

// نوع داده استاتیک برای املاک
interface RealEstateItem {
  id: number;
  title: string;
  address: string;
  price: number;
  area: number;
  rooms: number;
  status: "available" | "sold" | "rented";
  type: "apartment" | "villa" | "office" | "land";
  created_at: string;
  is_featured: boolean;
  is_active: boolean;
  is_public?: boolean;
  description?: string;
  short_description?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  canonical_url?: string;
  robots_meta?: string;
  slug?: string;
}

// داده استاتیک نمونه
const getStaticRealEstateData = (id: string): RealEstateItem | null => {
  const staticData: RealEstateItem[] = [
    {
      id: 1,
      title: "آپارتمان 120 متری در زعفرانیه",
      address: "تهران، زعفرانیه، خیابان ولیعصر",
      price: 8500000000,
      area: 120,
      rooms: 3,
      status: "available",
      type: "apartment",
      created_at: "2024-01-15T10:30:00Z",
      is_featured: true,
      is_active: true,
      is_public: true,
      description: "آپارتمان زیبا و مدرن در یکی از بهترین مناطق تهران. این آپارتمان دارای 3 اتاق خواب، 2 سرویس بهداشتی، آشپزخانه مجزا و بالکن با نمای زیبا است. ساختمان دارای آسانسور، پارکینگ و انباری می‌باشد.",
      short_description: "آپارتمان 120 متری در زعفرانیه",
      meta_title: "آپارتمان 120 متری در زعفرانیه",
      meta_description: "آپارتمان زیبا و مدرن در زعفرانیه",
      slug: "apartment-120m-zaferanieh",
    },
    {
      id: 2,
      title: "ویلا 250 متری در لواسان",
      address: "لواسان، جاده کندوان",
      price: 12000000000,
      area: 250,
      rooms: 4,
      status: "available",
      type: "villa",
      created_at: "2024-01-20T14:20:00Z",
      is_featured: true,
      is_active: true,
      is_public: true,
      description: "ویلای لوکس و مجلل در لواسان با فضای سبز وسیع. این ویلا دارای 4 اتاق خواب، 3 سرویس بهداشتی، سالن پذیرایی بزرگ، آشپزخانه مدرن و استخر می‌باشد.",
      short_description: "ویلا 250 متری در لواسان",
      slug: "villa-250m-lavasan",
    },
    {
      id: 3,
      title: "دفتر کار 80 متری در ونک",
      address: "تهران، ونک، خیابان ملاصدرا",
      price: 4500000000,
      area: 80,
      rooms: 0,
      status: "rented",
      type: "office",
      created_at: "2024-01-10T09:15:00Z",
      is_featured: false,
      is_active: true,
      is_public: true,
      description: "دفتر کار مناسب برای کسب و کارهای کوچک و متوسط. دارای پارکینگ و آسانسور.",
      short_description: "دفتر کار 80 متری در ونک",
      slug: "office-80m-vanak",
    },
  ];

  const item = staticData.find(item => item.id === Number(id));
  return item || null;
};

// کامپوننت Sidebar
function RealEstateSidebar({ realEstate }: { realEstate: RealEstateItem }) {
  const [isPublic, setIsPublic] = useState(realEstate.is_public ?? true);
  const [isActive, setIsActive] = useState(realEstate.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(realEstate.is_featured ?? false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "نامشخص";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const statusConfig = {
    available: { label: "موجود", bg: "bg-green", iconBg: "bg-green-0", icon: CheckCircle2, textColor: "text-green-2" },
    sold: { label: "فروخته شده", bg: "bg-red", iconBg: "bg-red-0", icon: XCircle, textColor: "text-red-2" },
    rented: { label: "اجاره داده شده", bg: "bg-yellow", iconBg: "bg-yellow-0", icon: XCircle, textColor: "text-yellow-2" },
  };

  const status = statusConfig[realEstate.status] || statusConfig.available;

  return (
    <div className="w-full space-y-6 sticky top-20 transition-all duration-300 ease-in-out self-start">
      <Card className="overflow-hidden">
        <CardContent className="pt-0 pb-0">
          <div className="pb-2">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-md">
              <div className="w-full h-full bg-gradient-to-br from-purple-1 to-purple-2 flex items-center justify-center text-static-w text-5xl font-bold">
                {realEstate.title?.[0]?.toUpperCase() || "R"}
              </div>
            </div>
          </div>

          <div className="pb-6 pt-2 border-b -mx-6 px-6">
            <div className="grid grid-cols-3 gap-3">
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${status.bg}`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${status.iconBg}`}>
                  <status.icon className={`w-4 h-4 ${status.textColor}`} />
                </div>
                <span className={`text-sm font-medium ${status.textColor}`}>
                  {status.label}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                isActive ? "bg-blue" : "bg-red"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  isActive ? "bg-blue-0" : "bg-red-0"
                }`}>
                  <Zap className={`w-4 h-4 ${
                    isActive ? "stroke-blue-2" : "stroke-red-2"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? "text-blue-2" : "text-red-2"
                }`}>
                  {isActive ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${
                realEstate.is_featured ? "bg-orange" : "bg-gray"
              }`}>
                <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                  realEstate.is_featured ? "bg-orange-0" : "bg-gray-0"
                }`}>
                  <Star className={`w-4 h-4 ${
                    realEstate.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  realEstate.is_featured ? "text-orange-2" : "text-gray-1"
                }`}>
                  {realEstate.is_featured ? "ویژه" : "عادی"}
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
                      <FileText className="w-4 h-4 text-font-s flex-shrink-0" />
                      <label>عنوان:</label>
                    </div>
                    <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                      <TruncatedText
                        text={realEstate.title}
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
                      #{realEstate.id}
                    </p>
                  </div>

                  {realEstate.slug && (
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-font-s flex-shrink-0" />
                        <label>نامک:</label>
                      </div>
                      <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                        <TruncatedText
                          text={realEstate.slug}
                          maxLength={35}
                          className="font-mono text-font-p"
                        />
                      </div>
                    </div>
                  )}

                  {realEstate.created_at && (
                    <div className="flex items-center justify-between gap-3 pt-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-font-s flex-shrink-0" />
                        <label>تاریخ ایجاد:</label>
                      </div>
                      <p className="text-font-p text-left">
                        {formatDate(realEstate.created_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="mb-4 text-font-p">تنظیمات</h4>
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-1/40 bg-blue-0/30 hover:border-blue-1/60 transition-colors overflow-hidden">
                    <Item variant="default" size="default" className="py-5">
                      <ItemContent>
                        <ItemTitle className="text-blue-2">نمایش عمومی</ItemTitle>
                        <ItemDescription>
                          اگر غیرفعال باشد ملک در سایت نمایش داده نمی‌شود.
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Switch
                          checked={isPublic}
                          onCheckedChange={setIsPublic}
                        />
                      </ItemActions>
                    </Item>
                  </div>
                  
                  <div className="rounded-xl border border-green-1/40 bg-green-0/30 hover:border-green-1/60 transition-colors overflow-hidden">
                    <Item variant="default" size="default" className="py-5">
                      <ItemContent>
                        <ItemTitle className="text-green-2">وضعیت فعال</ItemTitle>
                        <ItemDescription>
                          با غیرفعال شدن، ملک از لیست مدیریت نیز مخفی می‌شود.
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Switch
                          checked={isActive}
                          onCheckedChange={setIsActive}
                        />
                      </ItemActions>
                    </Item>
                  </div>
                  
                  <div className="rounded-xl border border-orange-1/40 bg-orange-0/30 hover:border-orange-1/60 transition-colors overflow-hidden">
                    <Item variant="default" size="default" className="py-5">
                      <ItemContent>
                        <ItemTitle className="text-orange-2">وضعیت ویژه</ItemTitle>
                        <ItemDescription>
                          املاک ویژه در بخش‌های خاص سایت با اولویت نمایش داده می‌شوند.
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Switch
                          checked={isFeatured}
                          onCheckedChange={setIsFeatured}
                        />
                      </ItemActions>
                    </Item>
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

// کامپوننت Overview Tab
function OverviewTab({ realEstate }: { realEstate: RealEstateItem }) {
  const typeLabels: Record<string, string> = {
    apartment: "آپارتمان",
    villa: "ویلا",
    office: "دفتر کار",
    land: "زمین",
  };

  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardWithIcon
          icon={Home}
          title="نوع ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          headerClassName="pb-3"
        >
          <p className="text-font-s mb-4">
            نوع ملک
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue" className="cursor-default">
              <Home className="w-3 h-3 me-1" />
              {typeLabels[realEstate.type] || realEstate.type}
            </Badge>
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={DollarSign}
          title="قیمت"
          iconBgColor="bg-green"
          iconColor="stroke-green-2"
          borderColor="border-b-green-1"
          headerClassName="pb-3"
        >
          <p className="text-font-s mb-4">
            قیمت ملک
          </p>
          <p className="text-lg font-semibold">
            {new Intl.NumberFormat("fa-IR").format(realEstate.price)} تومان
          </p>
        </CardWithIcon>

        <CardWithIcon
          icon={Ruler}
          title="متراژ"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          headerClassName="pb-3"
        >
          <p className="text-font-s mb-4">
            متراژ ملک
          </p>
          <p className="text-lg font-semibold">{realEstate.area} متر مربع</p>
        </CardWithIcon>

        {realEstate.rooms > 0 && (
          <CardWithIcon
            icon={Bed}
            title="تعداد اتاق"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            borderColor="border-b-indigo-1"
            headerClassName="pb-3"
          >
            <p className="text-font-s mb-4">
              تعداد اتاق خواب
            </p>
            <p className="text-lg font-semibold">{realEstate.rooms} اتاق</p>
          </CardWithIcon>
        )}

        <CardWithIcon
          icon={MapPin}
          title="آدرس"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          headerClassName="pb-3"
          className="md:col-span-3"
        >
          <p className="text-font-s mb-4">
            آدرس کامل ملک
          </p>
          <p className="text-font-p">{realEstate.address}</p>
        </CardWithIcon>
      </div>

      <CardWithIcon
        icon={FileText}
        title="توضیحات"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        contentClassName="space-y-6"
      >
        <div>
          <label className="text-font-s mb-3 block">
            توضیحات کوتاه
          </label>
          <div className="text-font-p leading-relaxed p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
            {realEstate.short_description || (
              <span className="text-font-s">
                توضیحی وارد نشده است
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="text-font-s mb-3 block">
            توضیحات کامل
          </label>
          <div className="p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
            {realEstate.description ? (
              <ReadMore
                content={realEstate.description}
                isHTML={false}
                maxHeight="200px"
              />
            ) : (
              <span className="text-font-s">
                توضیحی وارد نشده است
              </span>
            )}
          </div>
        </div>
      </CardWithIcon>
    </TabsContent>
  );
}

// کامپوننت Media Tab
function MediaTab({ realEstate: _realEstate }: { realEstate: RealEstateItem }) {
  return (
    <TabsContent value="media" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <CardWithIcon
          icon={Image}
          title="تصاویر"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          titleExtra={<span className="text-font-s">0 مورد</span>}
        >
          <div className="text-center py-8 text-font-s">
            تصویری آپلود نشده است
          </div>
        </CardWithIcon>
      </div>
    </TabsContent>
  );
}

// کامپوننت SEO Tab
function SEOTab({ realEstate }: { realEstate: RealEstateItem }) {
  const metaTitle = realEstate.meta_title || realEstate.title || "";
  const metaDescription = realEstate.meta_description || realEstate.short_description || "";
  const ogTitle = realEstate.og_title || metaTitle;
  const ogDescription = realEstate.og_description || metaDescription;

  return (
    <TabsContent value="seo" className="mt-0">
      <div className="space-y-6">
        <CardWithIcon
          icon={Search}
          title="برچسب‌های Meta"
          iconBgColor="bg-emerald"
          iconColor="stroke-emerald-2"
          borderColor="border-b-emerald-1"
          contentClassName="space-y-6 pt-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-font-s">
                <FileText className="w-4 h-4" />
                عنوان متا (Meta Title)
              </label>
              <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                {metaTitle ? (
                  <div className="font-medium text-font-p line-clamp-2">
                    {metaTitle}
                  </div>
                ) : (
                  <span className="text-font-s">
                    وارد نشده است
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-font-s">
                <FileText className="w-4 h-4" />
                توضیحات متا (Meta Description)
              </label>
              <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                {metaDescription ? (
                  <div className="text-font-p line-clamp-3">
                    {metaDescription}
                  </div>
                ) : (
                  <span className="text-font-s">
                    وارد نشده است
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-font-s">
                <LinkIcon className="w-4 h-4" />
                آدرس Canonical
              </label>
              <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                {realEstate.canonical_url ? (
                  <div className="font-mono text-sm text-font-p break-all">
                    {realEstate.canonical_url}
                  </div>
                ) : (
                  <span className="text-font-s">
                    وارد نشده است
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-font-s">
                <Search className="w-4 h-4" />
                Robots Meta
              </label>
              <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-center">
                {realEstate.robots_meta ? (
                  <Badge variant="blue" className="font-mono">
                    {realEstate.robots_meta}
                  </Badge>
                ) : (
                  <span className="text-font-s">
                    وارد نشده است
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardWithIcon>
        <CardWithIcon
          icon={Search}
          title="پیش‌نمایش Open Graph"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          contentClassName="pt-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <FileText className="w-4 h-4" />
                  عنوان Open Graph
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                  {ogTitle ? (
                    <div className="font-medium text-font-p line-clamp-2">
                      {ogTitle}
                    </div>
                  ) : (
                    <span className="text-font-s">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-font-s">
                  <FileText className="w-4 h-4" />
                  توضیحات Open Graph
                </label>
                <div className="p-4 bg-bg/50 rounded-lg border hover:bg-bg/70 transition-colors min-h-[60px] flex items-start">
                  {ogDescription ? (
                    <div className="text-font-p line-clamp-3">
                      {ogDescription}
                    </div>
                  ) : (
                    <span className="text-font-s">
                      وارد نشده است
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-3">
              <label className="flex items-center gap-2 text-font-s">
                <Image className="w-4 h-4" />
                تصویر Open Graph (OG Image)
              </label>
              <div className="relative aspect-video rounded-lg border-2 border-dashed bg-bg/30 flex items-center justify-center group hover:bg-bg/50 transition-colors">
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 bg-bg rounded-full">
                    <Image className="w-6 h-6 text-font-s" />
                  </div>
                  <div className="text-sm text-font-s">
                    تصویری آپلود نشده است
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardWithIcon>
      </div>
    </TabsContent>
  );
}

export default function RealEstateViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const realEstateId = params?.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const realEstateData = getStaticRealEstateData(realEstateId);

  if (!realEstateId) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش ملک" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه ملک یافت نشد</p>
        </div>
      </div>
    );
  }

  if (!realEstateData) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش ملک" />
        <div className="text-center py-8">
          <p className="text-destructive">ملک مورد نظر یافت نشد</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات ملک">
        <>
          <Button
            variant="outline"
            onClick={() => {
              console.log("خروجی PDF");
            }}
          >
            <FileDown className="h-4 w-4" />
            خروجی PDF
          </Button>
          <Button
            onClick={() => navigate(`/staticstyle/realstate/${realEstateId}/edit`)}
          >
            <Edit2 />
            ویرایش ملک
          </Button>
        </>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <RealEstateSidebar realEstate={realEstateData} />
        </div>

        <div className="lg:col-span-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="overview">
                <FileText className="h-4 w-4" />
                مرور کلی
              </TabsTrigger>
              <TabsTrigger value="media">
                <Image className="h-4 w-4" />
                مدیا
              </TabsTrigger>
              <TabsTrigger value="seo">
                <Search className="h-4 w-4" />
                سئو
              </TabsTrigger>
            </TabsList>

            <OverviewTab realEstate={realEstateData} />
            <MediaTab realEstate={realEstateData} />
            <SEOTab realEstate={realEstateData} />
          </Tabs>
        </div>
      </div>
    </div>
  );
}
