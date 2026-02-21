import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { BadgeCheck, FileBadge, Calendar, Briefcase, Building, FileText, CheckCircle2 } from "lucide-react";
import { InfoItem } from "@/components/static/profile/InfoItem";
import { Label } from "@/components/elements/Label";

interface ConsultantStaticTabProps {
  isConsultant: boolean;
  licenseNumber?: string;
  licenseExpireDate?: string;
  specialization?: string;
  agencyName?: string;
  consultantBio?: string;
  isVerified: boolean;
}

export function ConsultantStaticTab({
  isConsultant,
  licenseNumber,
  licenseExpireDate,
  specialization,
  agencyName,
  consultantBio,
  isVerified,
}: ConsultantStaticTabProps) {
  return (
    <CardWithIcon
      icon={BadgeCheck}
      title="اطلاعات مشاور"
      iconBgColor="bg-teal"
      iconColor="stroke-teal-2"
      cardBorderColor="border-b-teal-1"
      className="gap-0"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-card-2/50 rounded-xl border border-br/60">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-font-p">وضعیت حساب مشاور</p>
            <p className="text-xs text-font-s/80">
              {isConsultant 
                ? "حساب کاربری به عنوان مشاور فعال است." 
                : "این کاربر در حال حاضر تنها دسترسی ادمین معمولی دارد."}
            </p>
          </div>
          <Badge variant={isConsultant ? "teal" : "gray"} className="px-3 py-1.5 h-auto text-xs font-medium">
            {isConsultant ? "فعال" : "غیرفعال"}
          </Badge>
        </div>

        {isConsultant && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem label="شماره پروانه کسب" value={licenseNumber} dir="ltr" icon={FileBadge} />
              <InfoItem label="تاریخ انقضا پروانه" value={licenseExpireDate} dir="ltr" icon={Calendar} />
              <InfoItem label="تخصص" value={specialization} icon={Briefcase} />
              <InfoItem label="نام آژانس" value={agencyName} icon={Building} />
              
              <div className="group relative flex items-start gap-4 rounded-xl border border-br/60 bg-card p-4 transition-all duration-300 hover:border-primary/20 hover:bg-card-2/50 hover:shadow-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary/10">
                     <CheckCircle2 className="size-5" />
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1.5 min-w-0">
                      <span className="text-xs font-medium text-font-s/80 select-none group-hover:text-primary/80 transition-colors">وضعیت تایید</span>
                      <Badge variant={isVerified ? "blue" : "orange"} className="w-fit text-[11px] px-2 h-6">
                          {isVerified ? "تایید شده" : "در انتظار بررسی"}
                      </Badge>
                  </div>
              </div>
            </div>


          </>
        )}
      </div>
    </CardWithIcon>
  );
}
