import { FileText } from "lucide-react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { formatNumber } from "@/core/utils/commonFormat";
import { msg } from "@/core/messages";
import { Skeleton } from "@/components/elements/Skeleton";

interface TopPage {
  path: string;
  count: number;
}

interface TopPagesProps {
  topPages?: TopPage[];
  isLoading?: boolean;
}

export function TopPages({ topPages = [], isLoading }: TopPagesProps) {
  if (isLoading) {
    return (
      <CardWithIcon
        icon={FileText}
        title="صفحات پربازدید"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        cardBorderColor="border-b-blue-1"
      >
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardWithIcon>
    );
  }

  if (!topPages || topPages.length === 0) {
    return (
      <CardWithIcon
        icon={FileText}
        title="صفحات پربازدید"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        cardBorderColor="border-b-blue-1"
      >
        <div className="text-center py-4 text-font-s text-sm">
          داده‌ای برای نمایش وجود ندارد
        </div>
      </CardWithIcon>
    );
  }

  const total = topPages.reduce((sum, p) => sum + p.count, 0);

  return (
    <CardWithIcon
      icon={FileText}
      title="صفحات پربازدید"
      iconBgColor="bg-blue"
      iconColor="stroke-blue-2"
      cardBorderColor="border-b-blue-1"
      titleExtra={<span className="text-xs text-font-s">{topPages.length} صفحه</span>}
      contentClassName="max-h-[340px] overflow-y-auto scrollbar-thick"
    >
      <div className="space-y-2">
        {topPages.map((page, index) => {
          const pageName = msg.pagePath(page.path || '/');
          const percentage = total > 0 ? ((page.count / total) * 100).toFixed(1) : '0';

          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border border-br bg-bg/30 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-0 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-1" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-font-p truncate">
                    {pageName}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-font-s">({percentage}%)</span>
                    <span className="text-sm font-bold text-font-p">
                      {formatNumber(page.count)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-1 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CardWithIcon>
  );
}

