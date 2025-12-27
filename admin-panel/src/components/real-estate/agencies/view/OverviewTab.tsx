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
} from "lucide-react";

interface OverviewTabProps {
  agency: any;
}

export function OverviewTab({ agency }: OverviewTabProps) {
  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <CardWithIcon
        icon={Building2}
        title="اطلاعات تماس"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        headerClassName="pb-3"
      >
        <div className="space-y-4">
          {agency.phone && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue flex-shrink-0">
                <Phone className="w-4 h-4 stroke-blue-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-font-s mb-1">شماره تماس</p>
                <p className="text-font-p font-medium">{agency.phone}</p>
              </div>
            </div>
          )}

          {agency.email && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple flex-shrink-0">
                <Mail className="w-4 h-4 stroke-purple-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-font-s mb-1">ایمیل</p>
                <p className="text-font-p font-medium break-all">{agency.email}</p>
              </div>
            </div>
          )}

          {agency.website && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo flex-shrink-0">
                <Globe className="w-4 h-4 stroke-indigo-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-font-s mb-1">وب‌سایت</p>
                <a 
                  href={agency.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-font-p font-medium text-primary hover:underline break-all"
                >
                  {agency.website}
                </a>
              </div>
            </div>
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
      >
        <div className="space-y-4">
          {(agency.province_name || agency.city_name) && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green flex-shrink-0">
                <MapPin className="w-4 h-4 stroke-green-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-font-s mb-1">استان و شهر</p>
                <p className="text-font-p font-medium">
                  {agency.province_name && agency.city_name
                    ? `${agency.province_name}، ${agency.city_name}`
                    : agency.province_name || agency.city_name || "-"}
                </p>
              </div>
            </div>
          )}

          {agency.address && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal flex-shrink-0">
                <MapPin className="w-4 h-4 stroke-teal-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-font-s mb-1">آدرس کامل</p>
                <p className="text-font-p">{agency.address}</p>
              </div>
            </div>
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
      >
        <div className="space-y-4">
          {agency.license_number && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange flex-shrink-0">
                <FileText className="w-4 h-4 stroke-orange-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-font-s mb-1">شماره پروانه</p>
                <p className="text-font-p font-medium">{agency.license_number}</p>
              </div>
            </div>
          )}

          {agency.license_expire_date && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber flex-shrink-0">
                <Calendar className="w-4 h-4 stroke-amber-2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-font-s mb-1">تاریخ انقضای پروانه</p>
                <p className="text-font-p font-medium">
                  {new Date(agency.license_expire_date).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardWithIcon>

      {(agency.rating || agency.total_reviews) && (
        <CardWithIcon
          icon={Star}
          title="امتیاز و نظرات"
          iconBgColor="bg-yellow"
          iconColor="stroke-yellow-2"
          borderColor="border-b-yellow-1"
          headerClassName="pb-3"
        >
          <div className="space-y-4">
            {agency.rating && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-yellow flex-shrink-0">
                  <Star className="w-4 h-4 stroke-yellow-2 fill-yellow-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s mb-1">امتیاز</p>
                  <p className="text-font-p font-medium">{agency.rating} از 5</p>
                </div>
              </div>
            )}

            {agency.total_reviews !== undefined && (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange flex-shrink-0">
                  <FileText className="w-4 h-4 stroke-orange-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-font-s mb-1">تعداد نظرات</p>
                  <p className="text-font-p font-medium">{agency.total_reviews} نظر</p>
                </div>
              </div>
            )}
          </div>
        </CardWithIcon>
      )}

      {agency.description && (
        <CardWithIcon
          icon={FileText}
          title="توضیحات"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          headerClassName="pb-3"
        >
          <ReadMore
            text={agency.description}
            maxLength={300}
            className="text-font-p leading-relaxed"
          />
        </CardWithIcon>
      )}
    </TabsContent>
  );
}

