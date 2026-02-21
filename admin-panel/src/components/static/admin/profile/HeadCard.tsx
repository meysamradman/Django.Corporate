import React from "react";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/elements/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import {
  CalendarDays,
  Fingerprint,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
  User,
  Briefcase,
  Star,
} from "lucide-react";

export interface HeadCardProps {
  fullName: string;
  roleTitle: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  mobile: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  bio: string;
  nationalId: string;
  createdAt: string;
  active: boolean;
  avatarUrl: string;
  coverUrl: string;
  profileViews: string;
  propertyCount: string;
  ticketCount: string;
}

export function HeadCard(props: HeadCardProps) {
  const {
    fullName,
    roleTitle,
    firstName,
    lastName,
    birthDate,
    mobile,
    phone,
    email,
    province,
    city,
    address,
    bio,
    nationalId,
    createdAt,
    active,
    avatarUrl,
    coverUrl,
    profileViews,
    propertyCount,
    ticketCount,
  } = props;

  const initials = `${fullName.charAt(0) || "ا"}`;

  return (
    <Card className="group relative overflow-hidden rounded-3xl border-0 shadow-lg bg-card h-full flex flex-col">
      {/* Cover Section */}
      <div className="relative h-56 w-full shrink-0 overflow-hidden sm:h-64">
        <img
          src={coverUrl}
          alt="cover"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Floating Glass Stats */}
        <div className="absolute left-6 top-6 hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-1 backdrop-blur-md">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
              <span className="text-xs text-white/80">بازدید</span>
              <span className="font-bold text-white">{profileViews}</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
              <span className="text-xs text-white/80">املاک</span>
              <span className="font-bold text-white">{propertyCount}</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
              <span className="text-xs text-white/80">تیکت</span>
              <span className="font-bold text-white">{ticketCount}</span>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 px-6 sm:px-10 pb-6">
        
        {/* Top Floating Row: Avatar & Socials */}
        <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-6 relative z-10">
           {/* Avatar */}
           <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 blur-md opacity-40" />
              <Avatar className="size-28 sm:size-36 rounded-2xl border-[4px] border-card shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-300">
                <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 text-3xl font-black text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-xl border-4 border-card ${active ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow-md`}>
                <Star className="size-3.5 fill-current" />
              </div>
           </div>

           {/* Name & Role (Desktop) */}
           <div className="flex-1 text-right pr-6 hidden sm:block pb-2">
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-3xl font-black text-foreground tracking-tight">{fullName}</h2>
                 {active && <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-50 text-[10px] px-2 py-0.5 h-6">فعال</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                 <Badge variant="secondary" className="font-bold text-primary bg-primary/10  hover:bg-primary/20 px-3 py-1 text-xs">
                    <Briefcase className="size-3.5 ml-1.5" />
                    {roleTitle}
                 </Badge>
                 <span className="text-xs text-muted-foreground">•</span>
                 <span className="text-xs text-muted-foreground mr-1">عضویت: <span className="font-mono">{createdAt}</span></span>
              </div>
           </div>

           {/* Socials */}
           <div className="flex gap-2 pb-1">
             <SocialButton icon={<Mail />} color="text-amber-600 bg-amber-50 hover:bg-amber-100" />
             <SocialButton icon={<Instagram />} color="text-pink-600 bg-pink-50 hover:bg-pink-100" />
             <SocialButton icon={<Linkedin />} color="text-blue-700 bg-blue-50 hover:bg-blue-100" />
           </div>
        </div>

        {/* Mobile Name */}
        <div className="sm:hidden mb-6 text-center space-y-2">
            <h2 className="text-2xl font-black text-foreground">{fullName}</h2>
            <div className="flex justify-center gap-2">
               <Badge variant="secondary" className="px-2">{roleTitle}</Badge>
            </div>
        </div>


        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-2">
          
          {/* Left Col: Info Grid & Bio */}
          <div className="md:col-span-8 flex flex-col gap-6">
             {/* Info Cards Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard 
                  icon={<User className="text-blue-500" />}
                  label="نام و نام خانوادگی"
                  value={`${firstName} ${lastName}`}
                  className="bg-blue-50/50 border-blue-100/50 hover:border-blue-200"
                />
                <InfoCard 
                  icon={<Phone className="text-emerald-500" />}
                  label="شماره همراه"
                  value={mobile}
                  dir="ltr"
                  className="bg-emerald-50/50 border-emerald-100/50 hover:border-emerald-200"
                />
                 <InfoCard 
                  icon={<Phone className="text-indigo-500" />}
                  label="تلفن ثابت"
                  value={phone}
                  dir="ltr"
                  className="bg-indigo-50/50 border-indigo-100/50 hover:border-indigo-200"
                />
                <InfoCard 
                  icon={<Fingerprint className="text-purple-500" />}
                  label="کد ملی"
                  value={nationalId}
                  dir="ltr"
                  className="bg-purple-50/50 border-purple-100/50 hover:border-purple-200"
                />
                <InfoCard 
                  icon={<CalendarDays className="text-orange-500" />}
                  label="تاریخ تولد"
                  value={birthDate}
                  className="bg-orange-50/50 border-orange-100/50 hover:border-orange-200 sm:col-span-2"
                />
             </div>

             {/* Bio Section */}
             <div className="rounded-2xl border border-border/40 bg-muted/20 p-5 flex-1">
               <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                 <div className="w-1 h-5 rounded-full bg-primary" />
                 <span className="text-sm font-bold text-foreground">درباره ادمین</span>
               </div>
               <p className="text-sm leading-7 text-foreground/80 text-justify">
                 {bio}
               </p>
             </div>
          </div>

          {/* Right Col: Contact & Location */}
          <div className="md:col-span-4 flex flex-col gap-4">
             <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-card to-muted/30 p-5 space-y-4 h-full">
                
                <h3 className="font-bold text-base flex items-center gap-2 border-b border-border/40 pb-3">
                  <span className="flex items-center justify-center size-7 rounded-lg bg-primary/10 text-primary">
                    <MapPin className="size-4" />
                  </span>
                  اطلاعات تماس و آدرس
                </h3>

                <div className="space-y-5">
                   <div>
                      <p className="text-xs text-muted-foreground mb-1.5">استان و شهر</p>
                      <p className="font-medium text-foreground">{province}، {city}</p>
                   </div>
                   
                   <div>
                      <p className="text-xs text-muted-foreground mb-1.5">آدرس پستی</p>
                      <p className="text-sm font-medium leading-relaxed text-foreground/90">{address}</p>
                   </div>

                   <div>
                      <p className="text-xs text-muted-foreground mb-1.5">پست الکترونیک</p>
                      <p className="font-mono text-sm break-all text-primary">{email}</p>
                   </div>
                   
                   <div className="pt-4 mt-auto flex gap-2">
                      <Button variant="outline" className="w-full h-9 text-xs border-dashed">
                        ویرایش اطلاعات
                      </Button>
                      <Button className="w-full h-9 text-xs bg-muted text-muted-foreground hover:bg-muted/80 shadow-none">
                        مشاهده رزومه
                      </Button>
                   </div>
                </div>

             </div>
          </div>

        </div>

      </div>
    </Card>
  );
}

// --- Sub Components ---

function SocialButton({ icon, color }: { icon: React.ReactNode; color?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`size-10 rounded-xl transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md ${color}`}
    >
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "size-5" })}
    </Button>
  );
}

function InfoCard({ icon, label, value, dir = "rtl", className }: { icon: React.ReactNode; label: string; value: string; dir?: "ltr" | "rtl"; className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${className}`}>
      <div className="shrink-0 p-2 rounded-lg bg-white/60 dark:bg-black/20 text-foreground">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "size-5" })}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground/80 mb-0.5">{label}</p>
        <p className={`text-sm font-bold text-foreground truncate ${dir === "ltr" ? "text-left font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

