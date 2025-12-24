import { useQuery } from "@tanstack/react-query";
import { realEstateApi } from "@/api/real-estate/properties";
import { Card, CardContent } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { Skeleton } from "@/components/elements/Skeleton";
import { showError } from '@/core/toast';
import {
  Building2,
  Home,
  FileText,
  CheckCircle2,
  Star,
  Tag,
  Award,
  Users,
  Building,
  TrendingUp,
  BarChart3,
} from "lucide-react";

interface PropertyStatistics {
  generated_at: string;
  properties: {
    total: number;
    published: number;
    draft: number;
    featured: number;
    verified: number;
    active: number;
    public: number;
    published_percentage: number;
    featured_percentage: number;
    verified_percentage: number;
  };
  types: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  states: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  labels: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  features: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  tags: {
    total: number;
    with_properties: number;
    without_properties: number;
  };
  agents: {
    total: number;
    active: number;
    verified: number;
    with_properties: number;
    active_percentage: number;
    verified_percentage: number;
  };
  agencies: {
    total: number;
    active: number;
    verified: number;
    with_properties: number;
    active_percentage: number;
    verified_percentage: number;
  };
  recent_properties?: any[];
}

export function RealEstateStatisticsOverview() {
  const { data: stats, isLoading, error } = useQuery<PropertyStatistics>({
    queryKey: ['real-estate-statistics'],
    queryFn: () => realEstateApi.getStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      showError(error, { customMessage: "خطا در دریافت آمار املاک" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-b-4 border-b-primary">
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border p-6">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری آمار املاک</p>
          <p className="text-font-s">
            لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* آمار کلی املاک */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-font-p">آمار کلی املاک</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-b-4 border-b-blue-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-font-s text-muted-foreground">کل املاک</p>
                <div className="p-2 rounded-lg bg-blue-0">
                  <Home className="w-5 h-5 stroke-blue-2" />
                </div>
              </div>
              <p className="text-3xl font-bold text-font-p">{stats.properties.total.toLocaleString('fa-IR')}</p>
            </CardContent>
          </Card>

          <Card className="border-b-4 border-b-green-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-font-s text-muted-foreground">منتشر شده</p>
                <div className="p-2 rounded-lg bg-green-0">
                  <CheckCircle2 className="w-5 h-5 stroke-green-2" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-font-p">{stats.properties.published.toLocaleString('fa-IR')}</p>
                <Badge variant="green">{stats.properties.published_percentage}%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-b-4 border-b-orange-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-font-s text-muted-foreground">ویژه</p>
                <div className="p-2 rounded-lg bg-orange-0">
                  <Star className="w-5 h-5 stroke-orange-2" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-font-p">{stats.properties.featured.toLocaleString('fa-IR')}</p>
                <Badge variant="orange">{stats.properties.featured_percentage}%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-b-4 border-b-purple-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-font-s text-muted-foreground">تأیید شده</p>
                <div className="p-2 rounded-lg bg-purple-0">
                  <Award className="w-5 h-5 stroke-purple-2" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-font-p">{stats.properties.verified.toLocaleString('fa-IR')}</p>
                <Badge variant="purple">{stats.properties.verified_percentage}%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آمار مشاورین و آژانس‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardWithIcon
          icon={Users}
          title="آمار مشاورین"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-font-s">کل مشاورین:</span>
              <span className="text-font-p font-semibold">{stats.agents.total.toLocaleString('fa-IR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">فعال:</span>
              <div className="flex items-center gap-2">
                <span className="text-font-p font-semibold">{stats.agents.active.toLocaleString('fa-IR')}</span>
                <Badge variant="blue">{stats.agents.active_percentage}%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">تأیید شده:</span>
              <div className="flex items-center gap-2">
                <span className="text-font-p font-semibold">{stats.agents.verified.toLocaleString('fa-IR')}</span>
                <Badge variant="green">{stats.agents.verified_percentage}%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">دارای ملک:</span>
              <span className="text-font-p font-semibold">{stats.agents.with_properties.toLocaleString('fa-IR')}</span>
            </div>
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={Building}
          title="آمار آژانس‌ها"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-font-s">کل آژانس‌ها:</span>
              <span className="text-font-p font-semibold">{stats.agencies.total.toLocaleString('fa-IR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">فعال:</span>
              <div className="flex items-center gap-2">
                <span className="text-font-p font-semibold">{stats.agencies.active.toLocaleString('fa-IR')}</span>
                <Badge variant="purple">{stats.agencies.active_percentage}%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">تأیید شده:</span>
              <div className="flex items-center gap-2">
                <span className="text-font-p font-semibold">{stats.agencies.verified.toLocaleString('fa-IR')}</span>
                <Badge variant="green">{stats.agencies.verified_percentage}%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-font-s">دارای ملک:</span>
              <span className="text-font-p font-semibold">{stats.agencies.with_properties.toLocaleString('fa-IR')}</span>
            </div>
          </div>
        </CardWithIcon>
      </div>

      {/* آمار دسته‌بندی‌ها */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-font-p">آمار دسته‌بندی‌ها</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardWithIcon
            icon={Building2}
            title="نوع‌های ملک"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-font-s">کل:</span>
                <span className="text-font-p font-semibold">{stats.types.total.toLocaleString('fa-IR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">دارای ملک:</span>
                <Badge variant="blue">{stats.types.with_properties.toLocaleString('fa-IR')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">بدون ملک:</span>
                <Badge variant="gray">{stats.types.without_properties.toLocaleString('fa-IR')}</Badge>
              </div>
            </div>
          </CardWithIcon>

          <CardWithIcon
            icon={FileText}
            title="وضعیت‌های ملک"
            iconBgColor="bg-green"
            iconColor="stroke-green-2"
            borderColor="border-b-green-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-font-s">کل:</span>
                <span className="text-font-p font-semibold">{stats.states.total.toLocaleString('fa-IR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">دارای ملک:</span>
                <Badge variant="green">{stats.states.with_properties.toLocaleString('fa-IR')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">بدون ملک:</span>
                <Badge variant="gray">{stats.states.without_properties.toLocaleString('fa-IR')}</Badge>
              </div>
            </div>
          </CardWithIcon>

          <CardWithIcon
            icon={Tag}
            title="برچسب‌ها"
            iconBgColor="bg-orange"
            iconColor="stroke-orange-2"
            borderColor="border-b-orange-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-font-s">کل:</span>
                <span className="text-font-p font-semibold">{stats.labels.total.toLocaleString('fa-IR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">دارای ملک:</span>
                <Badge variant="orange">{stats.labels.with_properties.toLocaleString('fa-IR')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">بدون ملک:</span>
                <Badge variant="gray">{stats.labels.without_properties.toLocaleString('fa-IR')}</Badge>
              </div>
            </div>
          </CardWithIcon>

          <CardWithIcon
            icon={Award}
            title="ویژگی‌ها"
            iconBgColor="bg-purple"
            iconColor="stroke-purple-2"
            borderColor="border-b-purple-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-font-s">کل:</span>
                <span className="text-font-p font-semibold">{stats.features.total.toLocaleString('fa-IR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">دارای ملک:</span>
                <Badge variant="purple">{stats.features.with_properties.toLocaleString('fa-IR')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">بدون ملک:</span>
                <Badge variant="gray">{stats.features.without_properties.toLocaleString('fa-IR')}</Badge>
              </div>
            </div>
          </CardWithIcon>

          <CardWithIcon
            icon={Tag}
            title="تگ‌ها"
            iconBgColor="bg-indigo"
            iconColor="stroke-indigo-2"
            borderColor="border-b-indigo-1"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-font-s">کل:</span>
                <span className="text-font-p font-semibold">{stats.tags.total.toLocaleString('fa-IR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">دارای ملک:</span>
                <Badge variant="indigo">{stats.tags.with_properties.toLocaleString('fa-IR')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-font-s">بدون ملک:</span>
                <Badge variant="gray">{stats.tags.without_properties.toLocaleString('fa-IR')}</Badge>
              </div>
            </div>
          </CardWithIcon>
        </div>
      </div>
    </div>
  );
}

