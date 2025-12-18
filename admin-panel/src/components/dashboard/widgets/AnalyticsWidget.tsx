import { useNavigate } from "react-router-dom";
import { BarChart3, Eye, Calendar, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import { useAnalytics } from "@/hooks/dashboard/useAnalytics";
import { formatNumber } from "@/core/utils/format";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";

interface AnalyticsWidgetProps {
  isLoading?: boolean;
}

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ isLoading: externalLoading }) => {
  const navigate = useNavigate();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();
  const isLoading = externalLoading || analyticsLoading;

  const testData = {
    today: {
      total: 1250,
      unique: 890,
      web: 750,
      app: 500,
    },
    last_30_days: {
      total: 45230,
      unique: 28900,
      web: 26500,
      app: 18730,
      mobile: 32000,
      desktop: 13230,
    },
  };

  const displayData = analytics || testData;

  if (isLoading) {
    return (
      <CardWithIcon
        icon={BarChart3}
        title="آمار بازدید"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        borderColor="border-b-primary"
      >
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full mt-4 rounded-lg" />
      </CardWithIcon>
    );
  }

  return (
    <CardWithIcon
      icon={BarChart3}
      title="آمار بازدید"
      iconBgColor="bg-primary/10"
      iconColor="stroke-primary"
      borderColor="border-b-primary"
      titleExtra={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/analytics')}
          className="text-xs gap-1"
        >
          مشاهده بیشتر
          <ArrowLeft className="w-3 h-3" />
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-br bg-bg/50 hover:bg-bg transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-0">
              <Eye className="w-4 h-4 text-blue-1" />
            </div>
            <span className="text-xs text-font-s font-medium">بازدید امروز</span>
          </div>
          <p className="text-2xl font-bold text-font-p mb-1">
            {formatNumber(displayData.today.total)}
          </p>
          <p className="text-xs text-font-s">
            {formatNumber(displayData.today.unique)} بازدیدکننده یکتا
          </p>
        </div>

        <div className="p-4 rounded-lg border border-br bg-bg/50 hover:bg-bg transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-0">
              <Calendar className="w-4 h-4 text-green-1" />
            </div>
            <span className="text-xs text-font-s font-medium">30 روز گذشته</span>
          </div>
          <p className="text-2xl font-bold text-font-p mb-1">
            {formatNumber(displayData.last_30_days.total)}
          </p>
          <p className="text-xs text-font-s">
            {formatNumber(displayData.last_30_days.unique)} بازدیدکننده یکتا
          </p>
        </div>
      </div>
    </CardWithIcon>
  );
};
