import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import {
  FileText,
  Activity,
  Eye,
  Heart,
  Globe,
  Smartphone,
  ImageIcon,
  Video,
  Music,
  Info,
  Layers,
  Calendar,
  Hash,
  Star,
  Tag
} from "lucide-react";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import { EmptyState } from "@/components/shared/EmptyState";
import { ValueFallback } from "@/components/shared/ValueFallback";

interface OverviewTabProps {
  portfolio: Portfolio;
}

export function PortfolioOverview({ portfolio }: OverviewTabProps) {
  const imagesCount = portfolio.images_count || 0;
  const videosCount = portfolio.videos_count || 0;
  const audiosCount = portfolio.audios_count || 0;
  const documentsCount = portfolio.documents_count || 0;

  return (
    <div className="flex flex-col gap-6" id="section-overview">
      {/* Project Specs - Like Real Estate Details */}
      <CardWithIcon
        icon={Info}
        title="جزئیات و مشخصات پروژه"
        iconBgColor="bg-blue-0/50"
        iconColor="text-blue-1"
        cardBorderColor="border-b-blue-1"
        className="shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-0 text-font-p">
          <div className="flex flex-col">
            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-orange-1/60">
                <Activity className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center gap-2">
                <span className="text-[10px] font-bold text-font-s">وضعیت:</span>
                <span className="text-xs font-black">
                  <Badge variant={portfolio.status === "published" ? "green" : "yellow"} className="h-5 px-2 text-[10px] font-black">
                    {portfolio.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                  </Badge>
                </span>
              </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-blue-1/60">
                <Hash className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center gap-2">
                <span className="text-[10px] font-bold text-font-s">شناسه پروژه:</span>
                <span className="text-xs font-black">
                  {portfolio.id ? `PF-${portfolio.id}` : <ValueFallback value={null} />}
                </span>
              </ItemContent>
            </Item>
          </div>

          <div className="flex flex-col">
            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-emerald-1/60">
                <Calendar className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center gap-2">
                <span className="text-[10px] font-bold text-font-s">تاریخ ثبت:</span>
                <span className="text-xs font-black">
                  {portfolio.created_at ? new Date(portfolio.created_at).toLocaleDateString('fa-IR') : <ValueFallback value={null} />}
                </span>
              </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-amber-1/60">
                <Star className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center gap-2">
                <span className="text-[10px] font-bold text-font-s">ویژه (Featured):</span>
                <span className="text-xs font-black">
                  {portfolio.is_featured ? "بله" : "خیر"}
                </span>
              </ItemContent>
            </Item>
          </div>

          <div className="flex flex-col">
            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-indigo-1/60">
                <Layers className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center gap-2">
                <span className="text-[10px] font-bold text-font-s">تعداد دسته‌ها:</span>
                <span className="text-xs font-black">{portfolio.categories_count?.toLocaleString('fa-IR') || "۰"}</span>
              </ItemContent>
            </Item>

            <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
              <ItemMedia className="text-purple-1/60">
                <Tag className="size-4" />
              </ItemMedia>
              <ItemContent className="flex-row items-center gap-2">
                <span className="text-[10px] font-bold text-font-s">تعداد تگ‌ها:</span>
                <span className="text-xs font-black">{portfolio.tags_count?.toLocaleString('fa-IR') || "۰"}</span>
              </ItemContent>
            </Item>
          </div>
        </div>
      </CardWithIcon>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats & Status */}
        <CardWithIcon
          icon={Activity}
          title="آمار و وضعیت بازخورد"
          iconBgColor="bg-teal-0/50"
          iconColor="text-teal-1"
          cardBorderColor="border-b-teal-1"
          className="shadow-sm"
          showHeaderBorder={false}
          titleExtra={
            <Badge variant={portfolio.status === "published" ? "green" : "yellow"} className="h-5 px-2 text-[10px] font-black">
              {portfolio.status === "published" ? "فعال/منتشر شده" : "پیش‌نویس"}
            </Badge>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
              <Eye className="w-4 h-4 text-blue-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{portfolio.views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید کل</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-emerald-1/30 transition-all">
              <Globe className="w-4 h-4 text-emerald-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{portfolio.web_views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">وب</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-purple-1/30 transition-all">
              <Smartphone className="w-4 h-4 text-purple-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{portfolio.app_views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">اپلیکیشن</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-red-1/30 transition-all">
              <Heart className="w-4 h-4 text-red-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{portfolio.favorites_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">علاقه</span>
            </div>
          </div>
        </CardWithIcon>

        {/* Media Summary */}
        <CardWithIcon
          icon={ImageIcon}
          title="خلاصه رسانه‌ها"
          iconBgColor="bg-blue-0/50"
          iconColor="text-blue-1"
          cardBorderColor="border-b-blue-1"
          className="shadow-sm"
          showHeaderBorder={false}
          titleExtra={<Badge variant="blue">{portfolio.media_count || 0} فایل</Badge>}
        >
          <div className="grid grid-cols-2 gap-3 h-full content-start">
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">تصویر</span>
              </div>
              <span className="font-bold text-font-p">{imagesCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">ویدیو</span>
              </div>
              <span className="font-bold text-font-p">{videosCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">صدا</span>
              </div>
              <span className="font-bold text-font-p">{audiosCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">سند</span>
              </div>
              <span className="font-bold text-font-p">{documentsCount}</span>
            </div>
          </div>
        </CardWithIcon>
      </div>

      {/* Descriptions */}
      <CardWithIcon
        icon={FileText}
        title="توضیحات و شرح پروژه"
        iconBgColor="bg-orange-0/50"
        iconColor="text-orange-1"
        cardBorderColor="border-b-orange-1"
        className="shadow-sm"
      >
        <div className="flex flex-col gap-6">
          <div>
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block opacity-50">
              شرح پروژه
            </label>
            <div className="text-sm text-font-p border-r-2 border-orange-1/30 pr-4 leading-relaxed whitespace-pre-wrap">
              {portfolio.short_description || <ValueFallback value={null} fallback="توضیح کوتاهی برای این پروژه ثبت نشده است" />}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block opacity-50">
              توضیحات تکمیلی
            </label>
            <div className="text-sm text-font-p bg-bg/50 rounded-xl overflow-hidden leading-loose">
              {portfolio.description ? (
                <div className="p-5">
                  <ReadMore content={portfolio.description} isHTML={true} maxHeight="300px" />
                </div>
              ) : (
                <EmptyState
                  title="توضیحاتی ثبت نشده است"
                  description="هیچ توضیحات تکمیلی برای این پروژه در سیستم موجود نیست"
                  icon={FileText}
                  size="sm"
                  fullBleed={true}
                />
              )}
            </div>
          </div>
        </div>
      </CardWithIcon>
    </div>
  );
}

