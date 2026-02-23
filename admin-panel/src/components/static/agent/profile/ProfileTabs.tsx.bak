import { useState } from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileDigit,
  Globe,
  Hash,
  Image as ImageIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Separator } from "@/components/elements/Separator";
import { InfoItem } from "@/components/static/agent/profile/InfoItem";
import {
  ProfilePropertiesList,
  type ProfilePropertyItem,
} from "@/components/static/agent/profile/ProfilePropertiesList";
import { HeadCard } from "@/components/static/admin/profile/HeadCard";

interface AdminStaticForm {
  fullName: string;
  avatarUrl: string;
  coverUrl: string;
  mobile: string;
  landline: string;
  email: string;
  nationalId: string;
  createdAt: string;
  province: string;
  city: string;
  address: string;
  biography: string;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  socialLinks: {
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    linkedin?: string;
  };

  isConsultant: boolean;
  consultantStats?: {
    totalProperties: number;
    activeProperties: number;
    soldProperties: number;
    totalViews: string;
  };
  licenseNumber: string;
  licenseExpireDate: string;
  specialization: string;
  agencyName: string;
  isVerified: boolean;

  seoTitle: string;
  seoKeywords: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

const MOCK_DATA: AdminStaticForm = {
  fullName: "سشی سشییس",
  avatarUrl: "/images/profileone.webp",
  coverUrl: "/images/profile-banner.png",
  mobile: "09124707989",
  landline: "02112345678",
  email: "consultant@example.com",
  nationalId: "0083529694",
  createdAt: "1402/08/15",
  province: "تهران",
  city: "تهران",
  address: "خیابان ولیعصر، بالاتر از ظفر، کوچه ناصری، پلاک ۱۲، واحد ۴",
  biography: "مشاور فعال در حوزه خرید، فروش و سرمایه‌گذاری ملکی با تمرکز روی فایل‌های میان‌رده تا لوکس در تهران.",
  isActive: true,
  roles: ["مدیر محتوا", "مشاور املاک"],
  permissions: ["داشبورد", "لیست املاک", "ثبت ملک", "تیکت پشتیبانی", "مدیریت رسانه"],
  socialLinks: {
    instagram: "@soshi.realestate",
    telegram: "t.me/soshi_agent",
    whatsapp: "wa.me/989124707989",
    linkedin: "linkedin.com/in/soshi-agent",
  },

  isConsultant: true,
  consultantStats: {
    totalProperties: 48,
    activeProperties: 12,
    soldProperties: 35,
    totalViews: "12.5K",
  },
  licenseNumber: "987-654-321",
  licenseExpireDate: "1405/01/01",
  specialization: "مسکونی و سرمایه‌گذاری",
  agencyName: "آژانس املاک نمونه",
  isVerified: true,

  seoTitle: "سشی سشییس - Real Estate Agent",
  seoKeywords: "مشاور املاک تهران, خرید آپارتمان, فروش ملک, سرمایه گذاری ملکی",
  seoDescription: "پروفایل رسمی سشی سشییس، مشاور املاک در تهران با پوشش فایل‌های فروش و اجاره و مشاوره تخصصی سرمایه‌گذاری.",
  ogTitle: "سشی سشییس | مشاور املاک",
  ogDescription: "بهترین فرصت‌های سرمایه‌گذاری را با ما تجربه کنید.",
  ogImage:
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1073&q=80",
};

const PROPERTY_TYPES = ["آپارتمان", "ویلا", "تجاری", "اداری"] as const;
const PROPERTY_CITIES = ["تهران", "کرج", "مشهد", "شیراز"] as const;
const PROPERTY_STATUS = ["فعال", "در انتظار", "غیرفعال"] as const;
const PROPERTY_DEAL_TYPES = ["فروش", "اجاره", "رهن و اجاره", "پیش‌فروش"] as const;
const PROPERTY_TITLES = [
  "آپارتمان دوخوابه نوساز",
  "ویلا دوبلکس با حیاط",
  "واحد اداری موقعیت ممتاز",
  "مغازه بر اصلی",
  "پنت‌هاوس نورگیر",
  "خانه ویلایی بازسازی‌شده",
  "آپارتمان مناسب سرمایه‌گذاری",
] as const;

const buildProperties = (count: number, offset = 1): ProfilePropertyItem[] => {
  return Array.from({ length: count }, (_, index) => {
    const id = offset + index;
    const city = PROPERTY_CITIES[index % PROPERTY_CITIES.length];
    const baseTitle = PROPERTY_TITLES[index % PROPERTY_TITLES.length];
    return {
      id,
      title: `${baseTitle} - ${city}`,
      city,
      propertyType: PROPERTY_TYPES[index % PROPERTY_TYPES.length],
      dealType: PROPERTY_DEAL_TYPES[index % PROPERTY_DEAL_TYPES.length],
      status: PROPERTY_STATUS[index % PROPERTY_STATUS.length],
      price: `${(id * 7).toLocaleString("fa-IR")} میلیون`,
      viewLink: `/real-estate/properties/${id}/view`,
    };
  });
};

const ADMIN_PROPERTIES_MOCK = buildProperties(180, 1000);
const CONSULTANT_PROPERTIES_MOCK = buildProperties(1000, 5000);

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return "---";
  if (typeof value === "string" && value.trim() === "") return "---";
  return value;
};

export const ProfileTabs = () => {
  const [data] = useState<AdminStaticForm>(MOCK_DATA);
  const [firstName = "", ...lastNameParts] = (data.fullName || "").trim().split(/\s+/);
  const lastName = lastNameParts.join(" ");

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col gap-6">
        <HeadCard
          fullName={data.fullName}
          roleTitle={data.roles?.[0] || "مشاور"}
          firstName={firstName || data.fullName}
          lastName={lastName || "---"}
          birthDate={data.licenseExpireDate}
          mobile={data.mobile}
          phone={data.landline}
          email={data.email}
          province={data.province}
          city={data.city}
          address={data.address}
          bio={data.biography}
          nationalId={data.nationalId}
          createdAt={data.createdAt}
          active={data.isActive}
          avatarUrl={data.avatarUrl}
          coverUrl={data.coverUrl}
          profileViews={data.consultantStats?.totalViews || "0"}
          propertyCount={String(data.consultantStats?.totalProperties ?? 0)}
          ticketCount={String(data.consultantStats?.activeProperties ?? 0)}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <main className="xl:col-span-12 flex flex-col gap-6">
            {data.isConsultant && data.consultantStats && (
              <ConsultantStatsCard stats={data.consultantStats} />
            )}
            {data.isConsultant && <ProfessionalInfoCard data={data} />}
            {data.isConsultant && <SeoSettingsCard data={data} />}
          </main>
        </div>

        <ProfilePropertiesList
          isConsultant={data.isConsultant}
          properties={data.isConsultant ? CONSULTANT_PROPERTIES_MOCK : ADMIN_PROPERTIES_MOCK}
        />
      </div>
    </div>
  );
};

const ConsultantStatsCard = ({
  stats,
}: {
  stats: NonNullable<AdminStaticForm["consultantStats"]>;
}) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <ModernStatItem 
          label="کل آگهی‌های ثبت شده" 
          value={stats.totalProperties} 
          icon={Building2} 
          colorClass="bg-blue-0 text-blue-2 border-blue"
          iconBg="bg-blue-1"
      />
      <ModernStatItem 
          label="آگهی‌های فعال" 
          value={stats.activeProperties} 
          icon={Activity} 
          colorClass="bg-green-0 text-green-2 border-green"
          iconBg="bg-green-1"
      />
      <ModernStatItem 
          label="معاملات موفق" 
          value={stats.soldProperties} 
          icon={CheckCircle2} 
          colorClass="bg-amber-0 text-amber-2 border-amber"
          iconBg="bg-amber-1"
      />
      <ModernStatItem 
          label="بازدید کل پروفایل" 
          value={stats.totalViews} 
          icon={Eye} 
          colorClass="bg-purple-0 text-purple-2 border-purple"
          iconBg="bg-purple-1"
      />
    </div>
);

const ModernStatItem = ({ label, value, icon: Icon, colorClass, iconBg }: { label: string; value: string | number; icon: LucideIcon, colorClass: string, iconBg: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group ${colorClass} bg-card`}>
     {/* Abstract Background Shape */}
     <div className={`absolute -right-6 -top-6 size-24 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity ${iconBg}`} />
     
     <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className={`p-2 rounded-xl text-static-w shadow-sm ${iconBg}`}>
                <Icon className="size-5" />
            </div>
            {/* Trend Indicator (Mock) */}
             <div className="flex items-center text-[10px] font-medium opacity-70 bg-bg/60 px-1.5 py-0.5 rounded-full border border-br/30">
                <span>+12%</span>
            </div>
        </div>
        
        <div className="space-y-0.5">
            <p className="text-2xl font-black tracking-tight text-font-p">{value}</p>
            <p className="text-xs font-medium opacity-70 text-font-s">{label}</p>
        </div>
     </div>
  </div>
);

const ProfessionalInfoCard = ({ data }: { data: AdminStaticForm }) => (
  <CardWithIcon
    icon={Building2}
    title="اطلاعات حرفه‌ای و پروانه کسب"
    iconBgColor="bg-indigo-0"
    iconColor="text-indigo-1"
    cardBorderColor="border-b-indigo-1"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoItem label="شماره پروانه کسب" value={formatValue(data.licenseNumber)} dir="ltr" icon={FileDigit} />
      <InfoItem label="تاریخ انقضای پروانه" value={formatValue(data.licenseExpireDate)} icon={Calendar} dir="ltr" />
      <InfoItem label="تخصص اصلی (دسته‌بندی)" value={formatValue(data.specialization)} icon={Hash} />
      <InfoItem label="آژانس املاک همکار" value={formatValue(data.agencyName)} icon={Building2} />
    </div>

    <Separator className="my-5 bg-indigo-1/30" />

    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-indigo-0/40 border border-indigo">
      <div className="flex items-center gap-3">
        <div
          className={`size-10 shrink-0 rounded-full flex items-center justify-center ${
            data.isVerified ? "bg-emerald-0 text-emerald-2" : "bg-amber-0 text-amber-2"
          }`}
        >
          {data.isVerified ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
        </div>
        <div>
          <p className="font-semibold text-sm text-font-p">احراز هویت و تایید در سیستم</p>
          <p className="text-xs text-font-s">
            {data.isVerified
              ? 'با تایید این بخش، نشان "مشاور تایید شده" در پروفایل نمایش داده می‌شود.'
              : "در انتظار بررسی مدارک و تایید نهایی"}
          </p>
        </div>
      </div>
      {data.isVerified && <Badge variant="green">مشاور تایید شده</Badge>}
    </div>
  </CardWithIcon>
);

const SeoSettingsCard = ({ data }: { data: AdminStaticForm }) => (
  <CardWithIcon
    icon={Globe}
    title="تنظیمات سئو و نمایش پروفایل"
    iconBgColor="bg-teal-0"
    iconColor="text-teal-1"
    cardBorderColor="border-b-teal-1"
  >
    <div className="flex flex-col gap-6">
      
      {/* 1. Google Search Preview - Compact & Realistic */}
        <div className="bg-card w-full border border-br/60 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
           <div className="size-6 bg-blue-0 rounded-full flex items-center justify-center">
             <Globe className="size-3.5 text-blue-1" />
             </div>
           <span className="text-xs font-semibold text-font-s">پیش‌نمایش گوگل</span>
          </div>
          
          <div className="pl-2 border-l-2 border-primary/20 space-y-1">
           <div className="flex items-center gap-2 text-[11px] text-font-s/80 mb-0.5">
                <span className="bg-secondary/50 px-1.5 rounded-md">Monolingual.ir</span>
                <span>›</span>
                <span>consultant</span>
                <span>›</span>
                <span className="truncate max-w-37.5">{data.nationalId}</span>
             </div>
           <h3 className="text-lg font-medium text-link hover:underline cursor-pointer truncate">
                 {data.seoTitle || "عنوان نمایشی در گوگل"}
             </h3>
           <p className="text-xs/5 text-font-s line-clamp-2 max-w-prose">
                 {data.seoDescription || "توضیحات متا که در نتایج جستجو نمایش داده می‌شود و باید جذاب و مرتبط باشد..."}
             </p>
          </div>
      </div>


      {/* 2. Open Graph / Social Preview - Creative Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Right Column: SEO Inputs - Spans 7 cols */}
          <div className="md:col-span-7 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-2 mb-1">
                  <div className="size-1.5 rounded-full bg-indigo-1"></div>
                  <h4 className="text-xs font-bold text-font-s uppercase tracking-widest">اطلاعات کلیدی سئو</h4>
              </div>
               
               <div className="bg-secondary/20 rounded-xl p-5 border border-border/50 flex flex-col gap-5 h-full justify-between">
                   <div className="space-y-1.5">
                       <span className="text-[10px] font-medium text-font-s/70 uppercase px-1">عنوان صفحه (Title Tag)</span>
                       <p className="text-sm font-medium text-font-p p-3 bg-bg/60 rounded-lg border border-br/40 min-h-10.5 flex items-center shadow-xs">
                        {data.seoTitle || "---"}
                      </p>
                   </div>

                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-medium text-font-s/70 uppercase">کلمات کلیدی</span>
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">با کاما جدا شده</span>
                      </div>
                       <div className="flex flex-wrap gap-2 p-3 bg-bg/60 rounded-lg border border-br/40 min-h-17.5 shadow-xs content-start">
                         {data.seoKeywords ? data.seoKeywords.split(/[,،]+/).map((k, i) => (
                             <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-secondary text-[10px] text-secondary-foreground border border-secondary-foreground/10">
                                 # {k.trim()}
                             </span>
                         )) : <span className="text-font-s text-xs italic opacity-50">کلمه کلیدی ثبت نشده</span>}
                      </div>
                   </div>

                   <div className="space-y-1.5 grow">
                       <span className="text-[10px] font-medium text-font-s/70 uppercase px-1">توضیحات متا</span>
                        <p className="text-xs/6 text-font-s p-3 bg-bg/60 rounded-lg border border-br/40 min-h-20 shadow-xs">
                        {data.seoDescription || "---"}
                      </p>
                   </div>
               </div>
          </div>

          {/* Left Column: OG Preview - Spans 5 cols */}
          <div className="md:col-span-5 flex flex-col gap-4 h-full">
               <div className="flex items-center gap-2 mb-1">
                <div className="size-1.5 rounded-full bg-teal-1"></div>
                <h4 className="text-xs font-bold text-font-s uppercase tracking-widest">کارت اشتراک گذاری</h4>
               </div>

              <div className="bg-card rounded-xl border border-br p-3 shadow-sm h-full flex flex-col gap-3">
                   {/* Image Container - Fixed Aspect Ratio but constrained height */}
                 <div className="relative w-full overflow-hidden rounded-lg border border-br/50 bg-divi/30 aspect-[1.91/1] shadow-inner">
                      {data.ogImage ? (
                         <img 
                           src={data.ogImage} 
                           alt="OG Preview" 
                           className="size-full object-cover transition-transform duration-700 hover:scale-105" 
                         />
                      ) : (
                     <div className="size-full flex flex-col items-center justify-center gap-2 text-font-s/40 bg-secondary/20">
                             <ImageIcon className="size-8 opacity-50" />
                             <span className="text-[10px]">تصویر تنظیم نشده</span>
                         </div>
                      )}
                        {/* Overlay Gradient for Text Readability */}
                       <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent pt-10 pb-3 px-3">
                           <p className="font-bold text-xs text-white truncate drop-shadow-md">{data.ogTitle || data.seoTitle}</p>
                           <p className="text-[9px] text-white/90 line-clamp-1 mt-0.5 drop-shadow-md">{data.ogDescription || data.seoDescription}</p>
                       </div>
                   </div>
                   
                   <div className="flex flex-col gap-2 mt-auto">
                      <CompactInfoRow label="OG Title" value={data.ogTitle} placeholder="همانند عنوان سئو" />
                      <CompactInfoRow label="OG Description" value={data.ogDescription} placeholder="همانند توضیحات متا" />
                   </div>
               </div>
          </div>
      </div>

    </div>
  </CardWithIcon>
);

const CompactInfoRow = ({ label, value, placeholder }: { label: string, value?: string, placeholder?: string }) => (
  <div className="flex items-center justify-between text-xs border border-br/40 rounded-lg px-3 py-2 bg-secondary/10">
    <span className="font-semibold text-font-s">{label}:</span>
    <span className={`truncate max-w-37.5 ${!value ? "text-font-s/50 italic" : "text-font-p"}`}>
            {value || placeholder || "---"}
        </span>
    </div>
);


