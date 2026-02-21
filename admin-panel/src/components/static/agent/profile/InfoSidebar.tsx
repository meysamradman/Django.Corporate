import { Avatar, AvatarFallback } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent } from "@/components/elements/Card";
import {
  AtSign,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Smartphone,
  ShieldCheck,
  Briefcase,
} from "lucide-react";

export function InfoSidebar() {
  const roleLabel = "مدیر محتوا";
  const accountTypeLabel = "مشاور املاک";

  const contactItems = [
    { icon: AtSign, label: "نام کاربری", value: "barakat_admin", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Mail, label: "ایمیل", value: "admin@example.com", color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: Smartphone, label: "موبایل", value: "09124707989", color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Phone, label: "تلفن", value: "02112345678", color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: MapPin, label: "موقعیت", value: "تهران، تهران", color: "text-red-500", bg: "bg-red-500/10" },
  ];

  const socialLinks = [
    { Icon: Instagram, color: "text-pink-500", hoverBg: "hover:bg-pink-500/10" },
    { Icon: Send, color: "text-blue-500", hoverBg: "hover:bg-blue-500/10" },
    { Icon: MessageCircle, color: "text-green-500", hoverBg: "hover:bg-green-500/10" },
    { Icon: Linkedin, color: "text-indigo-500", hoverBg: "hover:bg-indigo-500/10" },
  ];

  return (
    <Card className="overflow-hidden border-none shadow-sm bg-card group relative gap-0">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start mb-8">
          
          {/* Avatar Section - Simple & Clean */}
          <div className="relative shrink-0">
            <div className="size-24 rounded-2xl bg-card border border-br p-1 shadow-sm">
              <Avatar className="size-full rounded-xl">
                <AvatarFallback className="bg-linear-to-br from-blue-600 to-indigo-600 text-white text-3xl font-bold font-heading">
                  BK
                </AvatarFallback>
              </Avatar>
              
              {/* Status Indicator */}
              <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-card ring-2 ring-card">
                  <span className="relative inline-flex rounded-full size-3 bg-green-500 border-2 border-white"></span>
              </div>
            </div>
          </div>

          {/* Name & Roles Section */}
          <div className="flex-1 space-y-3 w-full pt-1">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div className="space-y-1 w-full md:w-auto">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-font-p tracking-tight">
                    باراکت الله
                    </h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="indigo" className="h-6 px-2.5 gap-1.5 text-[11px]">
                      <ShieldCheck className="size-3" />
                      {roleLabel}
                    </Badge>
                     <Badge variant="teal" className="h-6 px-2.5 gap-1.5 text-[11px]">
                      <Briefcase className="size-3" />
                      {accountTypeLabel}
                    </Badge>
                </div>
              </div>

              {/* Social Links - Minimal */}
              <div className="flex items-center gap-1">
                {socialLinks.map((social, index) => (
                  <button
                    key={index}
                    className={`p-2 rounded-lg transition-all duration-200 hover:bg-gray-50 ${social.color}`}
                  >
                    <social.Icon className="size-5 stroke-2" />
                  </button>
                ))}
              </div>
            </div>
             <p className="text-sm font-medium text-font-s leading-relaxed max-w-4xl text-justify">
               مدیر سیستم با تمرکز روی معماری، امنیت و بهینه‌سازی فرآیندهای ادمین.
               علاقه‌مند به تکنولوژی‌های نوین و توسعه پایدار. در حال حاضر بر روی پروژه‌های بزرگ سازمانی کار می‌کنم.
            </p>
          </div>
        </div>

        {/* Contact Info Grid - Clean List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-6 border-t border-dashed border-br">
          {contactItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group/item"
            >
              <div className={`flex shrink-0 items-center justify-center size-9 rounded-lg ${item.bg} ${item.color}`}>
                <item.icon className="size-4 stroke-2" />
              </div>
              <div className="flex flex-col min-w-0">
                 <span className="text-[10px] font-bold text-font-s/70 uppercase mb-px">{item.label}</span>
                 <span className="text-sm font-semibold text-font-p truncate direction-ltr text-right font-mono" dir="ltr">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
