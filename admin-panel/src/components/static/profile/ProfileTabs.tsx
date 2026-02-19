import { useState, useMemo } from "react";
import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { ShieldCheck, UserCircle, Users, Share2, User, Mail, Phone, Calendar, MapPin, FileText, CheckCircle2, TicketCheck } from "lucide-react";
import { PROFILE_OVERVIEW_TABS } from "@/components/static/profile/data";
import { ConsultantStaticTab } from "@/components/static/profile/tabs/ConsultantStaticTab";
import { PropertiesStaticTab, type StaticPropertyItem } from "@/components/static/profile/tabs/PropertiesStaticTab";
import { InfoItem } from "@/components/static/profile/InfoItem";

interface AdminStaticForm {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  landline: string;
  mobile: string;
  email: string;
  province: string;
  city: string;
  address: string;
  bio: string;
  isConsultant: boolean;
  consultantLicenseNumber: string;
  consultantLicenseExpireDate: string;
  consultantSpecialization: string;
  consultantAgencyName: string;
  consultantBio: string;
  consultantIsVerified: boolean;
  adminProperties: StaticPropertyItem[];
  consultantProperties: StaticPropertyItem[];
  isStaff: boolean;
  isSuperuser: boolean;
}

const DEFAULT_FORM: AdminStaticForm = {
  firstName: "باراکت",
  lastName: "الله",
  birthDate: "1375/05/10",
  nationalId: "0012345678",
  landline: "02112345678",
  mobile: "09124707989",
  email: "admin@example.com",
  province: "tehran",
  city: "tehran",
  address: "تهران، خیابان ولیعصر، پلاک 100",
  bio: "مدیر سیستم با تمرکز روی معماری، امنیت و بهینه‌سازی فرآیندهای ادمین.",
  isConsultant: true,
  consultantLicenseNumber: "12345",
  consultantLicenseExpireDate: "1405/12/30",
  consultantSpecialization: "مسکونی و اداری",
  consultantAgencyName: "آژانس املاک آرامش",
  consultantBio: "مشاور فعال در حوزه خرید، فروش و سرمایه‌گذاری ملکی.",
  consultantIsVerified: true,
  adminProperties: [
    { id: 101, title: "آپارتمان دو خوابه نیاوران", city: "تهران", category: "مسکونی", status: "فعال", price: "۱۲.۸ میلیارد" },
    { id: 102, title: "واحد اداری ولیعصر", city: "تهران", category: "اداری", status: "در انتظار", price: "۸.۲ میلیارد" },
  ],
  consultantProperties: [
    { id: 201, title: "پنت‌هاوس زعفرانیه", city: "تهران", category: "مسکونی", status: "فعال", price: "۳۵ میلیارد" },
    { id: 202, title: "دفتر کار پاسداران", city: "تهران", category: "اداری", status: "فعال", price: "۱۴ میلیارد" },
    { id: 203, title: "آپارتمان نوساز سعادت‌آباد", city: "تهران", category: "مسکونی", status: "در انتظار", price: "۱۸ میلیارد" },
  ],
  isStaff: true,
  isSuperuser: false,
};

const PERMISSION_BADGE_VARIANT: Record<string, "green" | "blue" | "yellow" | "red"> = {
  create: "green",
  read: "blue",
  update: "yellow",
  delete: "red",
};

export function ProfileTabs() {
  const [savedForm, setSavedForm] = useState<AdminStaticForm>(DEFAULT_FORM);
  const [draftForm, setDraftForm] = useState<AdminStaticForm>(DEFAULT_FORM);
  const [editingSections, setEditingSections] = useState({
    adminInfo: false,
    consultant: false,
  });

  type SectionKey = keyof typeof editingSections;

  const SECTION_FIELDS: Record<SectionKey, (keyof AdminStaticForm)[]> = {
    adminInfo: ["username", "firstName", "lastName", "birthDate", "nationalId", "landline", "mobile", "email", "province", "city", "address", "bio", "isStaff", "isSuperuser"],
    consultant: ["isConsultant", "consultantLicenseNumber", "consultantLicenseExpireDate", "consultantSpecialization", "consultantAgencyName", "consultantBio", "consultantIsVerified"],
  };

  const provinceOptions = [
    { value: "tehran", label: "تهران" },
    { value: "alborz", label: "البرز" },
    { value: "isfahan", label: "اصفهان" },
  ];

  const cityByProvince: Record<string, { value: string; label: string }[]> = {
    tehran: [
      { value: "tehran", label: "تهران" },
      { value: "shahriar", label: "شهریار" },
    ],
    alborz: [
      { value: "karaj", label: "کرج" },
      { value: "fardis", label: "فردیس" },
    ],
    isfahan: [
      { value: "isfahan", label: "اصفهان" },
      { value: "kashan", label: "کاشان" },
    ],
  };

  const currentProvince = editingSections.adminInfo ? draftForm.province : savedForm.province;
  const cityOptions = cityByProvince[currentProvince] ?? [];

  function updateField<K extends keyof AdminStaticForm>(field: K, value: AdminStaticForm[K]) {
    setDraftForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateConsultantField(field: string, value: string | boolean) {
    updateField(field as keyof AdminStaticForm, value as never);
  }

  const tabMeta: Record<string, { icon: typeof UserCircle; iconWrap: string; iconColor: string; count: number }> = {
    "admin-info": {
      icon: UserCircle,
      iconWrap: "bg-blue/15 border-blue/30",
      iconColor: "text-blue-2",
      count: 5,
    },
    consultant: {
      icon: Users,
      iconWrap: "bg-green/15 border-green/30",
      iconColor: "text-green-2",
      count: 2,
    },
    properties: {
      icon: Share2,
      iconWrap: "bg-indigo/15 border-indigo/30",
      iconColor: "text-indigo-2",
      count: savedForm.isConsultant ? savedForm.consultantProperties.length : savedForm.adminProperties.length,
    },
  };

  return (

    <div className="space-y-4">
      <Tabs defaultValue="admin-info" className="w-full">
        <TabsList className="no-scrollbar mb-6 flex w-full items-center justify-start gap-8 overflow-x-auto border-b border-br px-2">
          {PROFILE_OVERVIEW_TABS.map((tab) => {
            const meta = tabMeta[tab.value as keyof typeof tabMeta] ?? tabMeta["admin-info"];
            const TabIcon = meta.icon;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="group relative flex min-w-max items-center gap-2 py-4 text-sm font-medium text-font-s transition-all hover:text-font-p data-[state=active]:text-primary data-[state=active]:font-semibold"
              >
                <TabIcon className="size-4.5 opacity-70 transition-all group-hover:opacity-100 group-data-[state=active]:opacity-100 group-data-[state=active]:text-primary" />
                <span>{tab.label}</span>
                
                {meta.count > 0 && (
                  <span className="ms-1 flex size-5 items-center justify-center rounded-full bg-br/50 text-[10px] text-font-s font-medium transition-colors group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary">
                    {meta.count}
                  </span>
                )}

                <span className="absolute inset-x-0 -bottom-px h-0.5 scale-x-0 bg-primary transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="admin-info" className="space-y-4">
          <CardWithIcon
            icon={UserCircle}
            title="اطلاعات حساب کاربری و پروفایل"
            iconBgColor="bg-purple"
            iconColor="stroke-purple-2"
            cardBorderColor="border-b-purple-1"
            className="gap-0"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem label="نام" value={savedForm.firstName} icon={User} />
                <InfoItem label="نام خانوادگی" value={savedForm.lastName} icon={User} />
                <InfoItem label="کد ملی" value={savedForm.nationalId} dir="ltr" icon={FileText} />
                
                <InfoItem label="موبایل" value={savedForm.mobile} dir="ltr" icon={Phone} />
                <InfoItem label="تلفن ثابت" value={savedForm.landline} dir="ltr" icon={Phone} />
                <InfoItem label="ایمیل" value={savedForm.email} dir="ltr" icon={Mail} />
                
                <InfoItem label="استان" value={provinceOptions.find(p => p.value === savedForm.province)?.label || savedForm.province} icon={MapPin} />
                <InfoItem label="شهر" value={cityByProvince[savedForm.province]?.find(c => c.value === savedForm.city)?.label || savedForm.city} icon={MapPin} />
                <InfoItem label="تاریخ تولد" value={savedForm.birthDate} dir="ltr" icon={Calendar} />
              </div>
            </div>
          </CardWithIcon>
        </TabsContent>

        <TabsContent value="consultant" className="space-y-4">
          <ConsultantStaticTab
            isConsultant={savedForm.isConsultant}
            licenseNumber={savedForm.consultantLicenseNumber}
            licenseExpireDate={savedForm.consultantLicenseExpireDate}
            specialization={savedForm.consultantSpecialization}
            agencyName={savedForm.consultantAgencyName}
            consultantBio={savedForm.consultantBio}
            isVerified={savedForm.consultantIsVerified}
          />
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <PropertiesStaticTab
            isConsultant={savedForm.isConsultant}
            adminProperties={savedForm.adminProperties}
            consultantProperties={savedForm.consultantProperties}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
}
