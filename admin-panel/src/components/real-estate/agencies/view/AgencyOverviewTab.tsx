import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Award,
  Star,
  FileText,
} from "lucide-react";

interface AgencyOverviewTabProps {
  agency: RealEstateAgency;
}

export function AgencyOverviewTab({ agency }: AgencyOverviewTabProps) {
  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardWithIcon
          icon={FileText}
          title="اطلاعات تماس"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          headerClassName="pb-3"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-font-s">نام آژانس:</label>
              <p className="text-font-p font-medium">{agency.name}</p>
            </div>
            {agency.phone && (
              <div className="space-y-2">
                <label className="text-font-s flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  تلفن:
                </label>
                <p className="text-font-p">{agency.phone}</p>
              </div>
            )}
            {agency.email && (
              <div className="space-y-2">
                <label className="text-font-s flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ایمیل:
                </label>
                <p className="text-font-p">{agency.email}</p>
              </div>
            )}
            {agency.website && (
              <div className="space-y-2">
                <label className="text-font-s flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  وب‌سایت:
                </label>
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-2 hover:underline text-font-p"
                >
                  {agency.website}
                </a>
              </div>
            )}
            {agency.license_number && (
              <div className="space-y-2">
                <label className="text-font-s flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  شماره پروانه:
                </label>
                <p className="text-font-p">{agency.license_number}</p>
              </div>
            )}
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={MapPin}
          title="موقعیت مکانی"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          headerClassName="pb-3"
        >
          <div className="space-y-4">
            {agency.province_name && (
              <div className="space-y-2">
                <label className="text-font-s">استان:</label>
                <p className="text-font-p">{agency.province_name}</p>
              </div>
            )}
            {agency.city_name && (
              <div className="space-y-2">
                <label className="text-font-s">شهر:</label>
                <p className="text-font-p">{agency.city_name}</p>
              </div>
            )}
            {agency.address && (
              <div className="space-y-2">
                <label className="text-font-s">آدرس:</label>
                <p className="text-font-p">{agency.address}</p>
              </div>
            )}
          </div>
        </CardWithIcon>

        {agency.description && (
          <CardWithIcon
            icon={FileText}
            title="توضیحات"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            borderColor="border-b-indigo-1"
            headerClassName="pb-3"
          >
            <ReadMore text={agency.description} maxLength={200} />
          </CardWithIcon>
        )}

        {(agency.rating || agency.total_reviews) && (
          <CardWithIcon
            icon={Star}
            title="آمار و امتیاز"
            iconBgColor="bg-orange"
            iconColor="stroke-orange-2"
            borderColor="border-b-orange-1"
            headerClassName="pb-3"
          >
            <div className="space-y-4">
              {agency.rating != null && !isNaN(Number(agency.rating)) && (
                <div className="space-y-2">
                  <label className="text-font-s">امتیاز:</label>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-orange-2 stroke-orange-2" />
                    <span className="text-font-p font-medium">
                      {typeof agency.rating === 'number' ? agency.rating.toFixed(1) : Number(agency.rating).toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
              {agency.total_reviews !== undefined && (
                <div className="space-y-2">
                  <label className="text-font-s">تعداد نظرات:</label>
                  <Badge variant="orange">{agency.total_reviews} مورد</Badge>
                </div>
              )}
            </div>
          </CardWithIcon>
        )}
      </div>
    </TabsContent>
  );
}

