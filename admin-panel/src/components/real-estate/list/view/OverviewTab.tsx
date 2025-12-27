import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Property } from "@/types/real_estate/realEstate";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import {
  Tag,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  MapPin,
  Building2,
  DollarSign,
} from "lucide-react";

interface OverviewTabProps {
  property: Property;
}

export function OverviewTab({ property }: OverviewTabProps) {
  const imagesCount = property.media_count ? Math.floor(property.media_count * 0.6) : 0;
  const videosCount = property.media_count ? Math.floor(property.media_count * 0.2) : 0;
  const audiosCount = property.media_count ? Math.floor(property.media_count * 0.1) : 0;
  const documentsCount = property.media_count ? Math.floor(property.media_count * 0.1) : 0;

  const labelsCount = property.labels?.length || 0;
  const tagsCount = property.tags?.length || 0;
  const featuresCount = property.features?.length || 0;

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "-";
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const getPriceDisplay = () => {
    if (property.price) return `${formatPrice(property.price)} ${property.currency || 'تومان'}`;
    if (property.sale_price) return `${formatPrice(property.sale_price)} ${property.currency || 'تومان'}`;
    if (property.pre_sale_price) return `${formatPrice(property.pre_sale_price)} ${property.currency || 'تومان'}`;
    if (property.monthly_rent) return `${formatPrice(property.monthly_rent)} ${property.currency || 'تومان'} (ماهانه)`;
    return "-";
  };

  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardWithIcon
          icon={Tag}
          title="برچسب‌ها"
          iconBgColor="bg-indigo"
          iconColor="stroke-indigo-2"
          borderColor="border-b-indigo-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="indigo">{labelsCount} مورد</Badge>}
        >
            <p className="text-font-s mb-4">
              برچسب‌های مرتبط با این ملک
            </p>
            {property.labels && property.labels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="indigo"
                    className="cursor-default"
                  >
                    <Tag className="w-3 h-3 me-1" />
                    {label.title}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-font-s">
                برچسبی انتخاب نشده است
              </p>
            )}
        </CardWithIcon>

        <CardWithIcon
          icon={Tag}
          title="تگ‌ها"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="purple">{tagsCount} مورد</Badge>}
        >
            <p className="text-font-s mb-4">
              تگ‌های مرتبط با این ملک
            </p>
            {property.tags && property.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="purple"
                    className="cursor-default"
                  >
                    <Tag className="w-3 h-3 me-1" />
                    {tag.title}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-font-s">
                تگی انتخاب نشده است
              </p>
            )}
        </CardWithIcon>

        <CardWithIcon
          icon={Building2}
          title="ویژگی‌ها"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="teal">{featuresCount} مورد</Badge>}
        >
            <p className="text-font-s mb-4">
              ویژگی‌های این ملک
            </p>
            {property.features && property.features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature) => (
                  <Badge
                    key={feature.id}
                    variant="teal"
                    className="cursor-default"
                  >
                    {feature.title}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-font-s">
                ویژگی‌ای انتخاب نشده است
              </p>
            )}
        </CardWithIcon>

        <CardWithIcon
          icon={ImageIcon}
          title="مدیا"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="blue">{property.media_count || 0} مورد</Badge>}
          className="md:col-span-3"
        >
            <p className="text-font-s mb-4">
              تعداد کل رسانه‌های آپلود شده
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-blue rounded">
                <ImageIcon className="w-4 h-4 stroke-blue-2" />
                <span>{imagesCount} تصویر</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple rounded">
                <Video className="w-4 h-4 stroke-purple-2" />
                <span>{videosCount} ویدیو</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-pink rounded">
                <Music className="w-4 h-4 stroke-pink-2" />
                <span>{audiosCount} صدا</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray rounded">
                <FileText className="w-4 h-4 stroke-gray-2" />
                <span>{documentsCount} سند</span>
              </div>
            </div>
        </CardWithIcon>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardWithIcon
          icon={Building2}
          title="اطلاعات پایه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          contentClassName="space-y-4"
        >
          {property.property_type && (
            <div>
              <label className="text-font-s mb-2 block">نوع ملک</label>
              <div className="text-font-p font-medium">
                {property.property_type.title || "-"}
              </div>
            </div>
          )}
          {property.state && (
            <div>
              <label className="text-font-s mb-2 block">وضعیت ملک</label>
              <div className="text-font-p">
                {property.state.title || "-"}
              </div>
            </div>
          )}
        </CardWithIcon>

        <CardWithIcon
          icon={MapPin}
          title="اطلاعات مکانی"
          iconBgColor="bg-emerald"
          iconColor="stroke-emerald-2"
          borderColor="border-b-emerald-1"
          contentClassName="space-y-4"
        >
          <div>
            <label className="text-font-s mb-2 block">آدرس</label>
            <div className="text-font-p">
              {property.address || "-"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-font-s mb-2 block">شهر</label>
              <div className="text-font-p">
                {property.city_name || "-"}
              </div>
            </div>
            <div>
              <label className="text-font-s mb-2 block">استان</label>
              <div className="text-font-p">
                {property.province_name || "-"}
              </div>
            </div>
          </div>
          {property.district_name && (
            <div>
              <label className="text-font-s mb-2 block">محله</label>
              <div className="text-font-p">
                {property.district_name}
              </div>
            </div>
          )}
        </CardWithIcon>

        <CardWithIcon
          icon={DollarSign}
          title="اطلاعات قیمت"
          iconBgColor="bg-green"
          iconColor="stroke-green-2"
          borderColor="border-b-green-1"
          contentClassName="space-y-4"
        >
          <div>
            <label className="text-font-s mb-2 block">قیمت</label>
            <div className="text-font-p font-medium">
              {getPriceDisplay()}
            </div>
          </div>
          {property.price_per_sqm && (
            <div>
              <label className="text-font-s mb-2 block">قیمت هر متر مربع</label>
              <div className="text-font-p">
                {formatPrice(property.price_per_sqm)} {property.currency || 'تومان'}
              </div>
            </div>
          )}
          {property.built_area && (
            <div>
              <label className="text-font-s mb-2 block">متراژ</label>
              <div className="text-font-p">
                {formatPrice(property.built_area)} متر مربع
              </div>
            </div>
          )}
        </CardWithIcon>
      </div>

      <CardWithIcon
        icon={FileText}
        title="توضیحات"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        contentClassName="space-y-6"
      >
          <div>
            <label className="text-font-s mb-3 block">
              توضیحات کوتاه
            </label>
            <div className="text-font-p leading-relaxed p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
              {property.short_description || (
                <span className="text-font-s">
                  توضیحی وارد نشده است
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-font-s mb-3 block">
              توضیحات کامل
            </label>
            <div className="p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
              {property.description ? (
                <ReadMore
                  content={property.description}
                  isHTML={true}
                  maxHeight="200px"
                />
              ) : (
                <span className="text-font-s">
                  توضیحی وارد نشده است
                </span>
              )}
            </div>
          </div>
      </CardWithIcon>
    </TabsContent>
  );
}

