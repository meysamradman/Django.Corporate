import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Property } from "@/types/real_estate/realEstate";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import { Link } from "react-router-dom";
import {
  Tag,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  MapPin,
  Building2,
  DollarSign,
  ExternalLink,
  Phone,
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
          {property.agent && (
            <div>
              <label className="text-font-s mb-2 block">کارشناس</label>
              <Link 
                to={`/real-estate/advisors/${property.agent.id}/view`}
                className="flex items-center gap-2 text-font-p font-medium text-blue-2 hover:text-blue-1 transition-colors group"
              >
                <span>
                  {property.agent.full_name || 
                   `${property.agent.first_name} ${property.agent.last_name}` || 
                   "-"}
                </span>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              {property.agent.phone && (
                <div className="flex items-center gap-1 mt-1 text-font-s text-gray-2">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{property.agent.phone}</span>
                </div>
              )}
            </div>
          )}
          {property.agency && (
            <div>
              <label className="text-font-s mb-2 block">آژانس</label>
              <Link 
                to={`/real-estate/agencies/${property.agency.id}/view`}
                className="flex items-center gap-2 text-font-p font-medium text-blue-2 hover:text-blue-1 transition-colors group"
              >
                <span>{property.agency.name || "-"}</span>
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              {property.agency.phone && (
                <div className="flex items-center gap-1 mt-1 text-font-s text-gray-2">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{property.agency.phone}</span>
                </div>
              )}
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
          icon={Building2}
          title="مشخصات ملک"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          contentClassName="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {property.land_area && (
              <div>
                <label className="text-font-s mb-2 block">متراژ زمین</label>
                <div className="text-font-p">
                  {formatPrice(property.land_area)} متر مربع
                </div>
              </div>
            )}
            {property.built_area && (
              <div>
                <label className="text-font-s mb-2 block">زیربنا</label>
                <div className="text-font-p">
                  {formatPrice(property.built_area)} متر مربع
                </div>
              </div>
            )}
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <div>
                <label className="text-font-s mb-2 block">تعداد خواب</label>
                <div className="text-font-p">
                  {property.bedrooms === 0 ? 'استودیو' : `${property.bedrooms} اتاق`}
                </div>
              </div>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <div>
                <label className="text-font-s mb-2 block">سرویس/حمام</label>
                <div className="text-font-p">
                  {property.bathrooms === 0 ? 'ندارد' : `${property.bathrooms} عدد`}
                </div>
              </div>
            )}
            {property.kitchens !== null && property.kitchens !== undefined && (
              <div>
                <label className="text-font-s mb-2 block">آشپزخانه</label>
                <div className="text-font-p">
                  {property.kitchens === 0 ? 'ندارد' : `${property.kitchens} عدد`}
                </div>
              </div>
            )}
            {property.living_rooms !== null && property.living_rooms !== undefined && (
              <div>
                <label className="text-font-s mb-2 block">پذیرایی</label>
                <div className="text-font-p">
                  {property.living_rooms === 0 ? 'ندارد' : `${property.living_rooms} عدد`}
                </div>
              </div>
            )}
            {property.parking_spaces !== null && property.parking_spaces !== undefined && (
              <div>
                <label className="text-font-s mb-2 block">پارکینگ</label>
                <div className="text-font-p">
                  {property.parking_spaces === 0 ? 'ندارد' : `${property.parking_spaces} عدد`}
                </div>
              </div>
            )}
            {property.storage_rooms !== null && property.storage_rooms !== undefined && (
              <div>
                <label className="text-font-s mb-2 block">انباری</label>
                <div className="text-font-p">
                  {property.storage_rooms === 0 ? 'ندارد' : `${property.storage_rooms} عدد`}
                </div>
              </div>
            )}
            {property.floor_number !== null && property.floor_number !== undefined && (
              <div>
                <label className="text-font-s mb-2 block">طبقه</label>
                <div className="text-font-p">
                  {property.floor_number === 0 ? 'همکف' : 
                   property.floor_number === -1 ? 'زیرزمین' : 
                   property.floor_number === -2 ? 'زیرزمین دوم' : 
                   `طبقه ${property.floor_number}`}
                </div>
              </div>
            )}
            {property.floors_in_building && (
              <div>
                <label className="text-font-s mb-2 block">تعداد طبقات</label>
                <div className="text-font-p">
                  {property.floors_in_building} طبقه
                </div>
              </div>
            )}
            {property.year_built && (
              <div>
                <label className="text-font-s mb-2 block">سال ساخت</label>
                <div className="text-font-p">
                  {property.year_built}
                </div>
              </div>
            )}
            {property.document_type && (
              <div>
                <label className="text-font-s mb-2 block">نوع سند</label>
                <div className="text-font-p">
                  {property.document_type}
                </div>
              </div>
            )}
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={DollarSign}
          title="اطلاعات قیمت"
          iconBgColor="bg-green"
          iconColor="stroke-green-2"
          borderColor="border-b-green-1"
          contentClassName="space-y-4"
          className="md:col-span-2"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.price && (
              <div>
                <label className="text-font-s mb-2 block">قیمت کل</label>
                <div className="text-font-p font-medium">
                  {formatPrice(property.price)} {property.currency || 'تومان'}
                </div>
              </div>
            )}
            {property.sale_price && (
              <div>
                <label className="text-font-s mb-2 block">قیمت حراج</label>
                <div className="text-font-p font-medium">
                  {formatPrice(property.sale_price)} {property.currency || 'تومان'}
                </div>
              </div>
            )}
            {property.pre_sale_price && (
              <div>
                <label className="text-font-s mb-2 block">قیمت پیش‌فروش</label>
                <div className="text-font-p font-medium">
                  {formatPrice(property.pre_sale_price)} {property.currency || 'تومان'}
                </div>
              </div>
            )}
            {property.price_per_sqm && (
              <div>
                <label className="text-font-s mb-2 block">قیمت هر متر مربع</label>
                <div className="text-font-p">
                  {formatPrice(property.price_per_sqm)} {property.currency || 'تومان'}
                </div>
              </div>
            )}
            {property.mortgage_amount && (
              <div>
                <label className="text-font-s mb-2 block">رهن</label>
                <div className="text-font-p">
                  {formatPrice(property.mortgage_amount)} {property.currency || 'تومان'}
                </div>
              </div>
            )}
            {property.rent_amount && (
              <div>
                <label className="text-font-s mb-2 block">اجاره</label>
                <div className="text-font-p">
                  {formatPrice(property.rent_amount)} {property.currency || 'تومان'}
                </div>
              </div>
            )}
            {property.monthly_rent && (
              <div>
                <label className="text-font-s mb-2 block">اجاره ماهیانه</label>
                <div className="text-font-p">
                  {formatPrice(property.monthly_rent)} {property.currency || 'تومان'}
                </div>
              </div>
            )}
            {property.security_deposit && (
              <div>
                <label className="text-font-s mb-2 block">ودیعه</label>
                <div className="text-font-p">
                  {formatPrice(property.security_deposit)} {property.currency || 'تومان'}
                </div>
              </div>
            )}
          </div>
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

