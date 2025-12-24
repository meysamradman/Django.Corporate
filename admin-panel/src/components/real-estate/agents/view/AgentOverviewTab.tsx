import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { PropertyAgent } from "@/types/real_estate/agent/propertyAgent";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Award,
  Briefcase,
  Star,
  FileText,
} from "lucide-react";

interface AgentOverviewTabProps {
  agent: PropertyAgent;
}

export function AgentOverviewTab({ agent }: AgentOverviewTabProps) {
  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardWithIcon
          icon={User}
          title="اطلاعات شخصی"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          headerClassName="pb-3"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-font-s">نام و نام خانوادگی:</label>
              <p className="text-font-p font-medium">
                {agent.first_name} {agent.last_name}
              </p>
            </div>
            {agent.phone && (
              <div className="space-y-2">
                <label className="text-font-s flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  تلفن:
                </label>
                <p className="text-font-p">{agent.phone}</p>
              </div>
            )}
            {agent.email && (
              <div className="space-y-2">
                <label className="text-font-s flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ایمیل:
                </label>
                <p className="text-font-p">{agent.email}</p>
              </div>
            )}
            {agent.license_number && (
              <div className="space-y-2">
                <label className="text-font-s flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  شماره پروانه:
                </label>
                <p className="text-font-p">{agent.license_number}</p>
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
            {agent.province_name && (
              <div className="space-y-2">
                <label className="text-font-s">استان:</label>
                <p className="text-font-p">{agent.province_name}</p>
              </div>
            )}
            {agent.city_name && (
              <div className="space-y-2">
                <label className="text-font-s">شهر:</label>
                <p className="text-font-p">{agent.city_name}</p>
              </div>
            )}
            {agent.address && (
              <div className="space-y-2">
                <label className="text-font-s">آدرس:</label>
                <p className="text-font-p">{agent.address}</p>
              </div>
            )}
            {agent.agency && (
              <div className="space-y-2">
                <label className="text-font-s flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  آژانس:
                </label>
                <Badge variant="purple">{agent.agency.name}</Badge>
              </div>
            )}
          </div>
        </CardWithIcon>

        {agent.bio && (
          <CardWithIcon
            icon={FileText}
            title="بیوگرافی"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            borderColor="border-b-indigo-1"
            headerClassName="pb-3"
          >
            <ReadMore text={agent.bio} maxLength={200} />
          </CardWithIcon>
        )}

        {(agent.specialization || agent.experience_years) && (
          <CardWithIcon
            icon={Briefcase}
            title="اطلاعات حرفه‌ای"
            iconBgColor="bg-emerald"
            iconColor="stroke-emerald-2"
            borderColor="border-b-emerald-1"
            headerClassName="pb-3"
          >
            <div className="space-y-4">
              {agent.specialization && (
                <div className="space-y-2">
                  <label className="text-font-s">تخصص:</label>
                  <p className="text-font-p">{agent.specialization}</p>
                </div>
              )}
              {agent.experience_years && (
                <div className="space-y-2">
                  <label className="text-font-s">سال‌های تجربه:</label>
                  <Badge variant="emerald">{agent.experience_years} سال</Badge>
                </div>
              )}
            </div>
          </CardWithIcon>
        )}

        <CardWithIcon
          icon={Star}
          title="آمار و عملکرد"
          iconBgColor="bg-orange"
          iconColor="stroke-orange-2"
          borderColor="border-b-orange-1"
          headerClassName="pb-3"
        >
          <div className="grid grid-cols-2 gap-4">
            {agent.total_sales !== undefined && (
              <div className="space-y-2">
                <label className="text-font-s text-muted-foreground">تعداد فروش:</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-orange-2">
                    {agent.total_sales}
                  </span>
                  <span className="text-font-s text-muted-foreground">مورد</span>
                </div>
              </div>
            )}
            {agent.property_count !== undefined && (
              <div className="space-y-2">
                <label className="text-font-s text-muted-foreground">تعداد املاک:</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-orange-2">
                    {agent.property_count}
                  </span>
                  <span className="text-font-s text-muted-foreground">مورد</span>
                </div>
              </div>
            )}
            {agent.rating != null && !isNaN(Number(agent.rating)) && (
              <div className="space-y-2">
                <label className="text-font-s text-muted-foreground">امتیاز:</label>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-orange-2 stroke-orange-2" />
                  <span className="text-2xl font-bold text-orange-2">
                    {typeof agent.rating === 'number' ? agent.rating.toFixed(1) : Number(agent.rating).toFixed(1)}
                  </span>
                  <span className="text-font-s text-muted-foreground">از 5</span>
                </div>
              </div>
            )}
            {agent.total_reviews !== undefined && (
              <div className="space-y-2">
                <label className="text-font-s text-muted-foreground">تعداد نظرات:</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-orange-2">
                    {agent.total_reviews}
                  </span>
                  <span className="text-font-s text-muted-foreground">مورد</span>
                </div>
              </div>
            )}
          </div>
        </CardWithIcon>
      </div>
    </TabsContent>
  );
}

