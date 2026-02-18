import type { ReactNode } from "react";
import { Badge } from "@/components/elements/Badge";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Switch } from "@/components/elements/Switch";
import { Textarea } from "@/components/elements/Textarea";
import { BadgeCheck } from "lucide-react";

interface ConsultantStaticTabProps {
  isEditMode: boolean;
  isConsultant: boolean;
  licenseNumber: string;
  licenseExpireDate: string;
  specialization: string;
  agencyName: string;
  consultantBio: string;
  isVerified: boolean;
  onChange: (field: string, value: string | boolean) => void;
  titleExtra?: ReactNode;
}

export function ConsultantStaticTab({
  isEditMode,
  isConsultant,
  licenseNumber,
  licenseExpireDate,
  specialization,
  agencyName,
  consultantBio,
  isVerified,
  onChange,
  titleExtra,
}: ConsultantStaticTabProps) {
  return (
    <CardWithIcon
      icon={BadgeCheck}
      title="اطلاعات مشاور"
      iconBgColor="bg-teal"
      iconColor="stroke-teal-2"
      cardBorderColor="border-b-teal-1"
      className="gap-0"
      titleExtra={titleExtra}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-br bg-card-2 p-3 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-font-p">حالت مشاور</p>
            <p className="text-xs text-font-s">در صورت فعال بودن، اطلاعات حرفه‌ای مشاور نمایش و ویرایش می‌شود.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConsultant ? "green" : "gray"}>{isConsultant ? "فعال" : "غیرفعال"}</Badge>
            <Switch
              checked={isConsultant}
              disabled={!isEditMode}
              onCheckedChange={(checked) => onChange("isConsultant", checked)}
            />
          </div>
        </div>

        {!isConsultant ? (
          <div className="rounded-xl border border-dashed border-br p-4 text-sm text-font-s">
            این کاربر در حالت ادمین معمولی است و پروفایل مشاور برای او فعال نشده است.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultant-license-number">شماره پروانه کسب</Label>
                <Input
                  id="consultant-license-number"
                  value={licenseNumber}
                  disabled={!isEditMode}
                  onChange={(e) => onChange("consultantLicenseNumber", e.target.value)}
                  placeholder="مثال: 12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultant-license-expire">تاریخ انقضای پروانه</Label>
                <Input
                  id="consultant-license-expire"
                  value={licenseExpireDate}
                  disabled={!isEditMode}
                  onChange={(e) => onChange("consultantLicenseExpireDate", e.target.value)}
                  placeholder="1405/12/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultant-specialization">تخصص</Label>
                <Input
                  id="consultant-specialization"
                  value={specialization}
                  disabled={!isEditMode}
                  onChange={(e) => onChange("consultantSpecialization", e.target.value)}
                  placeholder="مثال: مسکونی و اداری"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consultant-agency">آژانس همکار</Label>
                <Input
                  id="consultant-agency"
                  value={agencyName}
                  disabled={!isEditMode}
                  onChange={(e) => onChange("consultantAgencyName", e.target.value)}
                  placeholder="نام آژانس (اختیاری)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultant-bio">بیوگرافی مشاور</Label>
              <Textarea
                id="consultant-bio"
                rows={4}
                value={consultantBio}
                disabled={!isEditMode}
                onChange={(e) => onChange("consultantBio", e.target.value)}
                placeholder="تجربه و سوابق حرفه‌ای مشاور..."
              />
            </div>

            <div className="rounded-xl border border-br bg-card-2 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-font-p">تایید مشاور</p>
                <p className="text-xs text-font-s">نمایش نشان مشاور تایید شده در پروفایل</p>
              </div>
              <Switch
                checked={isVerified}
                disabled={!isEditMode}
                onCheckedChange={(checked) => onChange("consultantIsVerified", checked)}
              />
            </div>
          </>
        )}
      </div>
    </CardWithIcon>
  );
}
