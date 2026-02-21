import { useState } from "react";
import {
  Activity,
  AlertCircle,
  AtSign,
  Building2,
  Calendar,
  CheckCircle2,
  Eye,
  FileDigit,
  Fingerprint,
  Globe,
  Hash,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ScrollText,
  Send,
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

interface AdminStaticForm {
  fullName: string;
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

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          <aside className="xl:col-span-4 flex flex-col gap-6">
            <QuickSidebar data={data} />
          </aside>

          <section className="xl:col-span-8 flex flex-col gap-6">
            <ProfileCompanionCard data={data} />
          </section>
        </div>

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

const QuickSidebar = ({ data }: { data: AdminStaticForm }) => (
  <CardWithIcon
    icon={Building2}
    title="پروفایل مشاور"
    iconBgColor="bg-teal-0/50"
    iconColor="text-teal-1"
    cardBorderColor="border-b-teal-1"
    className="h-full min-h-[calc(100vh-180px)] overflow-hidden"
    contentClassName="p-0"
    showHeaderBorder={false}
    titleExtra={<Badge variant={data.isActive ? "green" : "red"}>{data.isActive ? "فعال" : "غیرفعال"}</Badge>}
  >
    <div className="flex flex-col h-full relative">
      
      {/* 1. Cover Background - Abstract Pattern */}
      <div className="h-40 w-full bg-linear-to-bl from-primary/20 via-primary/5 to-background relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 className="size-32 text-primary" />
        </div>
           <div className="absolute -left-10 -top-10 size-40 rounded-full bg-blue-0/30 blur-3xl"></div>
      </div>

      <div className="px-6 relative flex flex-col grow">
        
        {/* 2. Avatar - Overlapping Cover */}
        <div className="flex flex-col items-center -mt-16 mb-6">
          <div className="relative p-1.5 rounded-2xl bg-card shadow-xl shadow-black/5">
             <div className="relative size-32 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-4xl font-black border border-br/50">
                {getAvatarInitials(data.fullName)}
               <span className="absolute bottom-2 right-2 size-5 rounded-full border-4 border-card bg-green-1 shadow-sm" />
             </div>
          </div>
          
          <div className="text-center mt-3">
             <h3 className="text-2xl font-black text-foreground tracking-tight">{formatValue(data.fullName)}</h3>
             <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                {(data.roles?.length ? data.roles : ["بدون نقش"]).map((role, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-secondary-foreground/10">
                    {role}
                  </span>
                ))}
             </div>
          </div>
        </div>

        {/* 3. Quick Stats Row (Visual Fill) */}
        <div className="grid grid-cols-3 gap-2 mb-8 w-full">
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/5 border border-br/50 hover:bg-secondary/10 hover:border-br transition-all">
                 <span className="text-xl font-bold text-foreground dir-ltr">4.9</span>
                 <span className="text-[10px] font-medium text-muted-foreground/80 mt-1">امتیاز کاربران</span>
            </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/5 border border-br/50 hover:bg-secondary/10 hover:border-br transition-all">
                 <span className="text-xl font-bold text-foreground dir-ltr">12</span>
                 <span className="text-[10px] font-medium text-muted-foreground/80 mt-1">فایل فعال</span>
            </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/5 border border-br/50 hover:bg-secondary/10 hover:border-br transition-all">
                <span className="text-xl font-bold text-green-1 dir-ltr">+24</span>
                 <span className="text-[10px] font-medium text-muted-foreground/80 mt-1">معاملات</span>
            </div>
        </div>

        {/* 4. Contact Info */}
        <div className="space-y-4 mb-auto">
           <SidebarRow 
              icon={AtSign} 
              label="نام کاربری" 
              value={extractUsername(data.email)} 
              dir="ltr" 
              className="bg-transparent border-transparent hover:bg-secondary/10 px-2 py-2"
           />
           
           <div className="flex items-center gap-4">
                <div className="h-px bg-br/60 flex-1"></div>
                <div className="size-1 rounded-full bg-br"></div>
                <div className="h-px bg-br/60 flex-1"></div>
           </div>

           <SidebarRow 
              icon={Phone} 
              label="موبایل" 
              value={formatValue(data.mobile)} 
              dir="ltr" 
               className="bg-transparent border-transparent hover:bg-secondary/10 px-2 py-2"
           />
           
           <div className="flex items-center gap-4">
                <div className="h-px bg-br/60 flex-1"></div>
                <div className="size-1 rounded-full bg-br"></div>
                <div className="h-px bg-br/60 flex-1"></div>
           </div>

           <SidebarRow 
              icon={MapPin} 
              label="شهر" 
              value={formatValue(data.city)} 
               className="bg-transparent border-transparent hover:bg-secondary/10 px-2 py-2"
           />
        </div>

        {/* 5. Social Footer */}
        <div className="pt-6 pb-6 mt-4">
          <div className="flex items-center justify-center gap-4">
             <SocialIcon href={data.socialLinks?.linkedin} icon={Linkedin} label="لینکدین" className="border-blue-1/20 bg-blue-0/40 text-blue-1 hover:bg-blue-0/60" />
             <SocialIcon href={data.socialLinks?.telegram} icon={Send} label="تلگرام" className="border-sky-1/20 bg-sky-0/40 text-sky-1 hover:bg-sky-0/60" />
             <SocialIcon href={data.socialLinks?.whatsapp} icon={MessageCircle} label="واتساپ" className="border-green-1/20 bg-green-0/40 text-green-1 hover:bg-green-0/60" />
             <SocialIcon href={data.socialLinks?.instagram} icon={Instagram} label="اینستاگرام" className="border-pink-1/20 bg-pink-0/40 text-pink-1 hover:bg-pink-0/60" />
          </div>
        </div>
      </div>
    </div>
  </CardWithIcon>
);

const ProfileCompanionCard = ({ data }: { data: AdminStaticForm }) => (
  <CardWithIcon
    icon={ScrollText}
    title="خلاصه پروفایل"
    iconBgColor="bg-teal-0/50"
    iconColor="text-teal-1"
    cardBorderColor="border-b-teal-1"
    className="h-full min-h-[calc(100vh-180px)] gap-0!"
    contentClassName="flex flex-col justify-between h-full p-6 space-y-6"
  >
    <div className="space-y-6 flex-1">
      <div>
        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-1"></span>
            بیوگرافی
        </p>
        <div className="rounded-lg border border-border/50 bg-secondary/5 p-4 text-sm leading-8 text-foreground/80 text-justify">
          {formatValue(data.biography)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SidebarRow 
            icon={Mail} 
            label="ایمیل" 
            value={formatValue(data.email)} 
            dir="ltr" 
            className="bg-secondary/5 p-3 rounded-lg border border-transparent hover:border-border/40 transition-colors flex-row-reverse" 
        />
        <SidebarRow 
            icon={Phone} 
            label="تلفن" 
            value={formatValue(data.landline)} 
            dir="ltr" 
            className="bg-secondary/5 p-3 rounded-lg border border-transparent hover:border-border/40 transition-colors flex-row-reverse" 
        />
        <SidebarRow 
            icon={Fingerprint} 
            label="کد ملی" 
            value={formatValue(data.nationalId)} 
            dir="ltr" 
            className="bg-secondary/5 p-3 rounded-lg border border-transparent hover:border-border/40 transition-colors flex-row-reverse" 
        />
        <SidebarRow 
            icon={MapPin} 
            label="موقعیت" 
            value={`${formatValue(data.city)} - ${formatValue(data.province)}`} 
            className="bg-secondary/5 p-3 rounded-lg border border-transparent hover:border-border/40 transition-colors flex-row-reverse" 
        />
      </div>

      <div>
        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-1"></span>
            آدرس
        </p>
        <div className="rounded-lg border border-border/50 bg-secondary/5 p-4 text-sm leading-7 text-foreground/80 flex items-start gap-3">
            <MapPin className="size-5 text-teal-1/70 shrink-0 mt-1" />
            {formatValue(data.address)}
        </div>
      </div>
    </div>

    <div className="pt-6 mt-4 border-t border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-lg">
            <Calendar className="size-3.5" />
            <span>تاریخ ایجاد: {formatValue(data.createdAt)}</span>
        </div>
        <Badge variant="outline" className="h-8 px-4 rounded-lg border-teal-1/30 text-teal-1 bg-teal-0/40 hover:bg-teal-0/60 hover:border-teal-1/50 transition-colors">
            {formatValue(data.province)}
        </Badge>
      </div>
    </div>
  </CardWithIcon>
);

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
          colorClass="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          iconBg="bg-blue-500"
      />
      <ModernStatItem 
          label="آگهی‌های فعال" 
          value={stats.activeProperties} 
          icon={Activity} 
          colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
          iconBg="bg-emerald-500"
      />
      <ModernStatItem 
          label="معاملات موفق" 
          value={stats.soldProperties} 
          icon={CheckCircle2} 
          colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
          iconBg="bg-amber-500"
      />
      <ModernStatItem 
          label="بازدید کل پروفایل" 
          value={stats.totalViews} 
          icon={Eye} 
          colorClass="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
          iconBg="bg-purple-500"
      />
    </div>
);

const ModernStatItem = ({ label, value, icon: Icon, colorClass, iconBg }: { label: string; value: string | number; icon: LucideIcon, colorClass: string, iconBg: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group ${colorClass} bg-card`}>
     {/* Abstract Background Shape */}
     <div className={`absolute -right-6 -top-6 size-24 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity ${iconBg}`} />
     
     <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
            <div className={`p-2 rounded-xl text-white shadow-sm ${iconBg}`}>
                <Icon className="size-5" />
            </div>
            {/* Trend Indicator (Mock) */}
             <div className="flex items-center text-[10px] font-medium opacity-70 bg-background/50 px-1.5 py-0.5 rounded-full border border-border/10">
                <span>+12%</span>
            </div>
        </div>
        
        <div className="space-y-0.5">
            <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
            <p className="text-xs font-medium opacity-70 text-foreground/80">{label}</p>
        </div>
     </div>
  </div>
);

const SocialIcon = ({
  href,
  icon: Icon,
  label,
  className,
}: {
  href?: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}) => (
  href ? (
    <a
      href={href}
      aria-label={label}
      className={`size-9 rounded-xl border flex items-center justify-center transition-all hover:scale-105 ${className || "border-br bg-secondary/30 text-font-s hover:bg-secondary"}`}
    >
      <Icon className="size-4" />
    </a>
  ) : (
    <button
      type="button"
      aria-label={label}
      className={`size-9 rounded-xl border flex items-center justify-center opacity-60 ${className || "border-br bg-secondary/30 text-font-s"}`}
    >
      <Icon className="size-4" />
    </button>
  )
);

const SidebarRow = ({
  icon: Icon,
  label,
  value,
  dir,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  dir?: "ltr" | "rtl";
  className?: string;
}) => (
  // In RTL context (default for Persian):
  // Flex direction is row.
  // First child -> Right side
  // Last child -> Left side
  // We want: [Icon] [Text Content]
  // This means Icon should be the FIRST child in the DOM structure.
  <div className={`flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/10 px-3 py-2 ${className || ""}`}>
    
    {Icon && (
      <span className="size-9 shrink-0 rounded-lg bg-background/60 border border-border/20 flex items-center justify-center text-primary/70 shadow-xs">
        <Icon className="size-4" />
      </span>
    )}
    
    <div className="min-w-0 flex-1 flex flex-col items-start text-right">
      <span className="text-[10px] font-medium text-muted-foreground/80 leading-none mb-1">{label}</span>
      <span dir={dir} className="truncate text-sm font-semibold text-foreground w-full">
        {value}
      </span>
    </div>

  </div>
);

const getAvatarInitials = (fullName: string) => {
  const parts = fullName.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
};

const extractUsername = (email: string) => {
  const [username] = email.split("@");
  return username || "---";
};

const ProfessionalInfoCard = ({ data }: { data: AdminStaticForm }) => (
  <CardWithIcon
    icon={Building2}
    title="اطلاعات حرفه‌ای و پروانه کسب"
    iconBgColor="bg-indigo-100 dark:bg-indigo-900/20"
    iconColor="stroke-indigo-600 dark:stroke-indigo-400"
    cardBorderColor="border-indigo-100 dark:border-indigo-900/50"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InfoItem label="شماره پروانه کسب" value={formatValue(data.licenseNumber)} dir="ltr" icon={FileDigit} />
      <InfoItem label="تاریخ انقضای پروانه" value={formatValue(data.licenseExpireDate)} icon={Calendar} dir="ltr" />
      <InfoItem label="تخصص اصلی (دسته‌بندی)" value={formatValue(data.specialization)} icon={Hash} />
      <InfoItem label="آژانس املاک همکار" value={formatValue(data.agencyName)} icon={Building2} />
    </div>

    <Separator className="my-5 bg-indigo-100 dark:bg-indigo-800" />

    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/50">
      <div className="flex items-center gap-3">
        <div
          className={`size-10 shrink-0 rounded-full flex items-center justify-center ${
            data.isVerified ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-600"
          }`}
        >
          {data.isVerified ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">احراز هویت و تایید در سیستم</p>
          <p className="text-xs text-muted-foreground">
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
    iconBgColor="bg-sky-100 dark:bg-sky-900/20"
    iconColor="stroke-sky-600 dark:stroke-sky-400"
    cardBorderColor="border-sky-100 dark:border-sky-900/50"
  >
    <div className="flex flex-col gap-6">
      
      {/* 1. Google Search Preview - Compact & Realistic */}
      <div className="bg-card w-full border border-border/60 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
             <div className="size-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                 <Globe className="size-3.5 text-blue-600 dark:text-blue-400" />
             </div>
             <span className="text-xs font-semibold text-muted-foreground">پیش‌نمایش گوگل</span>
          </div>
          
          <div className="pl-2 border-l-2 border-primary/20 space-y-1">
             <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 mb-0.5">
                <span className="bg-secondary/50 px-1.5 rounded-md">Monolingual.ir</span>
                <span>›</span>
                <span>consultant</span>
                <span>›</span>
                <span className="truncate max-w-37.5">{data.nationalId}</span>
             </div>
             <h3 className="text-lg font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate">
                 {data.seoTitle || "عنوان نمایشی در گوگل"}
             </h3>
             <p className="text-xs/5 text-muted-foreground line-clamp-2 max-w-prose">
                 {data.seoDescription || "توضیحات متا که در نتایج جستجو نمایش داده می‌شود و باید جذاب و مرتبط باشد..."}
             </p>
          </div>
      </div>


      {/* 2. Open Graph / Social Preview - Creative Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Right Column: SEO Inputs - Spans 7 cols */}
          <div className="md:col-span-7 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-2 mb-1">
                 <div className="size-1.5 rounded-full bg-indigo-500"></div>
                 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">اطلاعات کلیدی سئو</h4>
              </div>
               
               <div className="bg-secondary/20 rounded-xl p-5 border border-border/50 flex flex-col gap-5 h-full justify-between">
                   <div className="space-y-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase px-1">عنوان صفحه (Title Tag)</span>
                      <p className="text-sm font-medium text-foreground p-3 bg-background/60 rounded-lg border border-border/40 min-h-10.5 flex items-center shadow-xs">
                        {data.seoTitle || "---"}
                      </p>
                   </div>

                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-medium text-muted-foreground/70 uppercase">کلمات کلیدی</span>
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">با کاما جدا شده</span>
                      </div>
                      <div className="flex flex-wrap gap-2 p-3 bg-background/60 rounded-lg border border-border/40 min-h-17.5 shadow-xs content-start">
                         {data.seoKeywords ? data.seoKeywords.split(/[,،]+/).map((k, i) => (
                             <span key={i} className="inline-flex items-center px-2 py-1 rounded bg-secondary text-[10px] text-secondary-foreground border border-secondary-foreground/10">
                                 # {k.trim()}
                             </span>
                         )) : <span className="text-muted-foreground text-xs italic opacity-50">کلمه کلیدی ثبت نشده</span>}
                      </div>
                   </div>

                   <div className="space-y-1.5 grow">
                      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase px-1">توضیحات متا</span>
                       <p className="text-xs/6 text-muted-foreground p-3 bg-background/60 rounded-lg border border-border/40 min-h-20 shadow-xs">
                        {data.seoDescription || "---"}
                      </p>
                   </div>
               </div>
          </div>

          {/* Left Column: OG Preview - Spans 5 cols */}
          <div className="md:col-span-5 flex flex-col gap-4 h-full">
               <div className="flex items-center gap-2 mb-1">
                  <div className="size-1.5 rounded-full bg-sky-500"></div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">کارت اشتراک گذاری</h4>
               </div>

               <div className="bg-card rounded-xl border border-border p-3 shadow-sm h-full flex flex-col gap-3">
                   {/* Image Container - Fixed Aspect Ratio but constrained height */}
                   <div className="relative w-full overflow-hidden rounded-lg border border-border/50 bg-muted/30 aspect-[1.91/1] shadow-inner">
                      {data.ogImage ? (
                         <img 
                           src={data.ogImage} 
                           alt="OG Preview" 
                           className="size-full object-cover transition-transform duration-700 hover:scale-105" 
                         />
                      ) : (
                         <div className="size-full flex flex-col items-center justify-center gap-2 text-muted-foreground/40 bg-secondary/20">
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
    <div className="flex items-center justify-between text-xs border border-border/40 rounded-lg px-3 py-2 bg-secondary/10">
        <span className="font-semibold text-muted-foreground">{label}:</span>
        <span className={`truncate max-w-37.5 ${!value ? "text-muted-foreground/50 italic" : "text-foreground"}`}>
            {value || placeholder || "---"}
        </span>
    </div>
);


