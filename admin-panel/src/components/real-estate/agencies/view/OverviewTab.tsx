import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Calendar,
  Star,
  Hash,
} from "lucide-react";

interface OverviewTabProps {
  agency: any;
}

export function OverviewTab({ agency }: OverviewTabProps) {
  const contactInfoCount = [
    agency.phone,
    agency.email,
    agency.website,
  ].filter(Boolean).length;

  const locationInfoCount = [
    agency.province_name || agency.city_name,
    agency.address,
  ].filter(Boolean).length;

  const licenseInfoCount = [
    agency.license_number,
    agency.license_expire_date,
  ].filter(Boolean).length;

  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardWithIcon
          icon={Building2}
          title="اطلاعات تماس"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="blue">{contactInfoCount} مورد</Badge>}
        >
          <p className="text-font-s mb-4">
            اطلاعات تماس و ارتباطی آژانس
          </p>
          <div className="space-y-3">
            {agency.phone ? (
              <div className="flex items-center gap-3 p-2 bg-blue/20 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue flex-shrink-0">
                  <Phone className="w-4 h-4 stroke-blue-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s text-xs mb-0.5">شماره تماس</p>
                  <p className="text-font-p font-medium">{agency.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-font-s text-sm">شماره تماس وارد نشده است</p>
            )}

            {agency.email ? (
              <div className="flex items-center gap-3 p-2 bg-purple/20 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple flex-shrink-0">
                  <Mail className="w-4 h-4 stroke-purple-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s text-xs mb-0.5">ایمیل</p>
                  <p className="text-font-p font-medium break-all text-sm">{agency.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-font-s text-sm">ایمیل وارد نشده است</p>
            )}

            {agency.website ? (
              <div className="flex items-center gap-3 p-2 bg-indigo/20 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo flex-shrink-0">
                  <Globe className="w-4 h-4 stroke-indigo-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s text-xs mb-0.5">وب‌سایت</p>
                  <a 
                    href={agency.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-font-p font-medium text-primary hover:underline break-all text-sm block"
                  >
                    {agency.website}
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-font-s text-sm">وب‌سایت وارد نشده است</p>
            )}
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={MapPin}
          title="موقعیت مکانی"
          iconBgColor="bg-green"
          iconColor="stroke-green-2"
          borderColor="border-b-green-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="green">{locationInfoCount} مورد</Badge>}
        >
          <p className="text-font-s mb-4">
            موقعیت جغرافیایی و آدرس آژانس
          </p>
          <div className="space-y-3">
            {(agency.province_name || agency.city_name) ? (
              <div className="flex items-center gap-3 p-2 bg-green/20 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green flex-shrink-0">
                  <MapPin className="w-4 h-4 stroke-green-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s text-xs mb-0.5">استان و شهر</p>
                  <p className="text-font-p font-medium">
                    {agency.province_name && agency.city_name
                      ? `${agency.province_name}، ${agency.city_name}`
                      : agency.province_name || agency.city_name || "-"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-font-s text-sm">استان و شهر وارد نشده است</p>
            )}

            {agency.address ? (
              <div className="flex items-center gap-3 p-2 bg-teal/20 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal flex-shrink-0">
                  <MapPin className="w-4 h-4 stroke-teal-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s text-xs mb-0.5">آدرس کامل</p>
                  <p className="text-font-p">{agency.address}</p>
                </div>
              </div>
            ) : (
              <p className="text-font-s text-sm">آدرس وارد نشده است</p>
            )}
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={FileText}
          title="اطلاعات پروانه"
          iconBgColor="bg-orange"
          iconColor="stroke-orange-2"
          borderColor="border-b-orange-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="orange">{licenseInfoCount} مورد</Badge>}
        >
          <p className="text-font-s mb-4">
            اطلاعات پروانه فعالیت آژانس
          </p>
          <div className="space-y-3">
            {agency.license_number ? (
              <div className="flex items-center gap-3 p-2 bg-orange/20 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange flex-shrink-0">
                  <Hash className="w-4 h-4 stroke-orange-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s text-xs mb-0.5">شماره پروانه</p>
                  <p className="text-font-p font-medium">{agency.license_number}</p>
                </div>
              </div>
            ) : (
              <p className="text-font-s text-sm">شماره پروانه وارد نشده است</p>
            )}

            {agency.license_expire_date ? (
              <div className="flex items-center gap-3 p-2 bg-amber/20 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber flex-shrink-0">
                  <Calendar className="w-4 h-4 stroke-amber-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s text-xs mb-0.5">تاریخ انقضای پروانه</p>
                  <p className="text-font-p font-medium">
                    {new Date(agency.license_expire_date).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-font-s text-sm">تاریخ انقضای پروانه وارد نشده است</p>
            )}
          </div>
        </CardWithIcon>

        {(agency.rating !== undefined || agency.total_reviews !== undefined) && (
          <CardWithIcon
            icon={Star}
            title="امتیاز و نظرات"
            iconBgColor="bg-yellow"
            iconColor="stroke-yellow-2"
            borderColor="border-b-yellow-1"
            headerClassName="pb-3"
            titleExtra={
              <Badge variant="yellow">
                {[agency.rating !== undefined, agency.total_reviews !== undefined].filter(Boolean).length} مورد
              </Badge>
            }
          >
            <p className="text-font-s mb-4">
              امتیاز و تعداد نظرات کاربران
            </p>
            <div className="space-y-3">
              {agency.rating !== undefined ? (
                <div className="flex items-center gap-3 p-2 bg-yellow/20 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow flex-shrink-0">
                    <Star className="w-4 h-4 stroke-yellow-2 fill-yellow-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-font-s text-xs mb-0.5">امتیاز</p>
                    <p className="text-font-p font-medium">{agency.rating} از 5</p>
                  </div>
                </div>
              ) : (
                <p className="text-font-s text-sm">امتیاز ثبت نشده است</p>
              )}

              {agency.total_reviews !== undefined ? (
                <div className="flex items-center gap-3 p-2 bg-orange/20 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange flex-shrink-0">
                    <FileText className="w-4 h-4 stroke-orange-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-font-s text-xs mb-0.5">تعداد نظرات</p>
                    <p className="text-font-p font-medium">{agency.total_reviews} نظر</p>
                  </div>
                </div>
              ) : (
                <p className="text-font-s text-sm">نظری ثبت نشده است</p>
              )}
            </div>
          </CardWithIcon>
        )}
      </div>

      {agency.description && (
        <CardWithIcon
          icon={FileText}
          title="توضیحات آژانس"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          contentClassName="space-y-6"
        >
          <div>
            <label className="text-font-s mb-3 block">
              توضیحات کامل
            </label>
            <div className="p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
              <ReadMore
                text={agency.description}
                maxLength={300}
                className="text-font-p leading-relaxed"
              />
            </div>
          </div>
        </CardWithIcon>
      )}
    </TabsContent>
  );
}

