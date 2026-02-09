import { type FC } from "react";
import { MessageSquare, Mail, Ticket, Activity, Inbox, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/elements/Skeleton";
import type { DashboardStats } from "@/types/analytics";
import { formatNumber } from "@/core/utils/commonFormat";
import { CardWithIcon } from "@/components/elements/CardWithIcon";

interface SupportStatsProps {
  stats: DashboardStats | undefined;
  isLoading?: boolean;
}

export const SupportStats: FC<SupportStatsProps> = ({ stats, isLoading = false }) => {
  const totalItems = (stats?.total_emails || 0) + (stats?.total_tickets || 0);
  const totalUnanswered = (stats?.unanswered_emails || 0) + (stats?.unanswered_tickets || 0);

  const responseRate = totalItems > 0
    ? Math.round(((totalItems - totalUnanswered) / totalItems) * 100)
    : 100;

  const emailProgress = stats?.total_emails
    ? Math.round(((stats.total_emails - stats.unanswered_emails) / stats.total_emails) * 100)
    : 100;

  const ticketProgress = stats?.total_tickets
    ? Math.round(((stats.total_tickets - stats.open_tickets) / stats.total_tickets) * 100)
    : 100;

  if (isLoading) {
    return (
      <CardWithIcon
        icon={MessageSquare}
        title="وضعیت پشتیبانی"
        iconBgColor="bg-primary/10"
        iconColor="stroke-primary"
        cardBorderColor="border-b-primary"
        className="h-full w-full"
      >
        <div className="flex flex-col gap-6 h-full p-2">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </CardWithIcon>
    );
  }

  return (
    <CardWithIcon
      icon={MessageSquare}
      title="وضعیت پشتیبانی"
      iconBgColor="bg-primary/10"
      iconColor="stroke-primary"
      cardBorderColor="border-b-primary"
      className="h-full w-full flex flex-col transition-all duration-500 group/card"
      contentClassName="flex-1 flex flex-col pt-5 px-5 pb-0 gap-6"
      titleExtra={<p className="text-[10px] text-font-s opacity-60 font-black tracking-widest uppercase">Support Analytics</p>}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-primary/10 p-5 group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity className="w-5 h-5 text-primary" />
              <div className="absolute inset-0 bg-primary/20 blur-lg" />
            </div>
            <div>
              <h3 className="text-sm font-black text-font-p">نرخ پاسخ‌دهی کل</h3>
              <p className="text-[10px] text-font-s font-bold opacity-60">بر اساس تیکت‌ها و ایمیل‌ها</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-primary tracking-tighter">{responseRate}%</span>
          </div>
        </div>

        <div className="flex gap-1.5 h-2">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-700 ${i / 12 * 100 < responseRate ? 'bg-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-br/30'
                }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 border border-br/50 bg-bg/30 hover:bg-wt hover:shadow-md transition-all duration-300 group/item">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-0 text-pink-1 group-hover/item:scale-110 transition-transform duration-300">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-font-p">ایمیل‌ها</p>
                <p className="text-[10px] text-font-s font-bold opacity-60 tracking-tight">
                  {formatNumber(stats?.total_emails || 0)} مورد ثبت شده
                </p>
              </div>
            </div>
            <div className="text-left">
              <span className="text-sm font-black text-pink-1">{formatNumber(stats?.unanswered_emails || 0)}</span>
              <p className="text-[9px] font-black text-pink-1/60 uppercase">بی‌پاسخ</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-font-s">پیشرفت پاسخ‌دهی</span>
              <span className="text-font-p">{emailProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-br/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-1 rounded-full transition-all duration-1000"
                style={{ width: `${emailProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border border-br/50 bg-bg/30 hover:bg-wt hover:shadow-md transition-all duration-300 group/item">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-0 text-teal-1 group-hover/item:scale-110 transition-transform duration-300">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-font-p">تیکت‌ها</p>
                <p className="text-[10px] text-font-s font-bold opacity-60 tracking-tight">
                  {formatNumber(stats?.total_tickets || 0)} تیکت فعال
                </p>
              </div>
            </div>
            <div className="text-left">
              <span className="text-sm font-black text-teal-1">{formatNumber(stats?.open_tickets || 0)}</span>
              <p className="text-[9px] font-black text-teal-1/60 uppercase">تیکت باز</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-font-s">حل و فصل تیکت‌ها</span>
              <span className="text-font-p">{ticketProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-br/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-1 rounded-full transition-all duration-1000"
                style={{ width: `${ticketProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-2 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-amber-0 border border-amber-1/20">
          <AlertCircle className="w-3.5 h-3.5 text-amber-1" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-amber-1 leading-none">{formatNumber(stats?.active_tickets || 0)}</span>
            <span className="text-[8px] font-bold text-amber-1/70">تیکت در جریان</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-blue-0 border border-blue-1/20">
          <Inbox className="w-3.5 h-3.5 text-blue-1" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-1 leading-none">{formatNumber(stats?.new_emails || 0)}</span>
            <span className="text-[8px] font-bold text-blue-1/70">ایمیل جدید</span>
          </div>
        </div>
      </div>
    </CardWithIcon>
  );
};
