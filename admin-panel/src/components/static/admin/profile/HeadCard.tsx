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
    <Card className="group relative overflow-hidden rounded-lg border-0 shadow-lg bg-card h-full flex flex-col">
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
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-1 to-purple-1 blur-md opacity-40" />
              <Avatar className="size-28 sm:size-36 rounded-2xl border-[4px] border-card shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-300">
                <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />
                <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue to-blue-1 text-3xl font-black text-blue-2">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-xl border-4 border-card ${active ? 'bg-green-1 text-white' : 'bg-red-1 text-white'} shadow-md`}>
                <Star className="size-3.5 fill-current" />
              </div>
           </div>

           {/* Name & Role (Desktop) */}
           <div className="flex-1 text-right pr-6 hidden sm:block pb-2">
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-3xl font-black text-font-p tracking-tight">{fullName}</h2>
                 {active && <Badge variant="outline" className="border-green text-green-2 bg-green-0 text-[10px] px-2 py-0.5 h-6">فعال</Badge>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                 <Badge variant="secondary" className="font-bold text-primary bg-divi hover:bg-divi px-3 py-1 text-xs">
                    <Briefcase className="size-3.5 ml-1.5" />
                    {roleTitle}
                 </Badge>
                 <span className="text-xs text-font-s">•</span>
                 <span className="text-xs text-font-s mr-1">عضویت: <span className="font-mono">{createdAt}</span></span>
              </div>
           </div>

           {/* Socials */}
           <div className="flex gap-2 pb-1">
             <SocialButton icon={<Mail />} color="text-orange-2 bg-orange-0 hover:bg-orange" />
             <SocialButton icon={<Instagram />} color="text-pink-2 bg-pink-0 hover:bg-pink" />
             <SocialButton icon={<Linkedin />} color="text-blue-2 bg-blue-0 hover:bg-blue" />
           </div>
        </div>

        {/* Mobile Name */}
        <div className="sm:hidden mb-6 text-center space-y-2">
            <h2 className="text-2xl font-black text-font-p">{fullName}</h2>
            <div className="flex justify-center gap-2">
               <Badge variant="secondary" className="px-2 text-font-s bg-divi">{roleTitle}</Badge>
            </div>
        </div>


        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-2">
          
          {/* Left Col: Info Grid & Bio */}
          <div className="md:col-span-8 flex flex-col gap-6">
             {/* Info Cards Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard 
                  icon={<User className="text-blue-1" />}
                  label="نام و نام خانوادگی"
                  value={`${firstName} ${lastName}`}
                  className="bg-blue-0 border-blue hover:border-blue-1"
                />
                <InfoCard 
                  icon={<Phone className="text-green-1" />}
                  label="شماره همراه"
                  value={mobile}
                  dir="ltr"
                  className="bg-green-0 border-green hover:border-green-1"
                />
                 <InfoCard 
                  icon={<Phone className="text-purple-1" />}
                  label="تلفن ثابت"
                  value={phone}
                  dir="ltr"
                  className="bg-purple-0 border-purple hover:border-purple-1"
                />
                <InfoCard 
                  icon={<Fingerprint className="text-purple-1" />}
                  label="کد ملی"
                  value={nationalId}
                  dir="ltr"
                  className="bg-purple-0 border-purple hover:border-purple-1"
                />
                <InfoCard 
                  icon={<CalendarDays className="text-orange-1" />}
                  label="تاریخ تولد"
                  value={birthDate}
                  className="bg-orange-0 border-orange hover:border-orange-1 sm:col-span-2"
                />
             </div>

             {/* Bio Section */}
             <div className="rounded-lg border border-br bg-bg p-5 flex-1">
               <div className="flex items-center gap-2 mb-3 text-font-s">
                 <div className="w-1 h-5 rounded-full bg-primary" />
                 <span className="text-sm font-bold text-font-p">درباره ادمین</span>
               </div>
               <p className="text-sm leading-7 text-font-p text-justify">
                 {bio}
               </p>
             </div>
          </div>

          {/* Right Col: Contact & Location */}
          <div className="md:col-span-4 flex flex-col gap-4">
             <div className="rounded-lg border border-br bg-gradient-to-b from-card to-bg p-5 space-y-4 h-full">
                
                <h3 className="font-bold text-base flex items-center gap-2 border-b border-divi pb-3 text-font-p">
                  <span className="flex items-center justify-center size-7 rounded-lg bg-divi text-primary">
                    <MapPin className="size-4" />
                  </span>
                  اطلاعات تماس و آدرس
                </h3>

                <div className="space-y-5">
                   <div>
                      <p className="text-xs text-font-s mb-1.5">استان و شهر</p>
                      <p className="font-medium text-font-p">{province}، {city}</p>
                   </div>
                   
                   <div>
                      <p className="text-xs text-font-s mb-1.5">آدرس پستی</p>
                      <p className="text-sm font-medium leading-relaxed text-font-p">{address}</p>
                   </div>

                   <div>
                      <p className="text-xs text-font-s mb-1.5">پست الکترونیک</p>
                      <p className="font-mono text-sm break-all text-primary">{email}</p>
                   </div>
                   
                   <div className="pt-4 mt-auto flex gap-2">
                      <Button variant="outline" className="w-full h-9 text-xs border-dashed border-br text-font-s">
                        ویرایش اطلاعات
                      </Button>
                      <Button className="w-full h-9 text-xs bg-bg text-font-s hover:bg-divi shadow-none">
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

// --- Sub-components ---

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] uppercase text-white/70 mb-0.5">{label}</span>
      <span className="font-mono text-sm font-bold leading-none">{value}</span>
    </div>
  );
}

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

function InfoCard({ icon, label, value, dir = "rtl", className }: { icon: React.ReactNode; label: string; value: string; dir?: "ltr" | "rtl", className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${className}`}>
      <div className="shrink-0 p-2 rounded-lg bg-card/60 text-font-p">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "size-5" })}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-font-s mb-0.5">{label}</p>
        <p className={`text-sm font-bold text-font-p truncate ${dir === "ltr" ? "text-left font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
