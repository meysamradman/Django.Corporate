import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Phone, Mail, MapPin, Star, Building2 } from "lucide-react";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle,
} from "lucide-react";
import type { Agency } from "@/types/real-estate/agent";
import { Button } from "@/components/elements/Button";
import { cn } from "@/core/utils/cn";

type AgencyCardProps = {
  agency: Agency;
  className?: string;
};

/**
 * AgencyCard - Display agency profile information in a card format
 * 
 * Features:
 * - Agency logo/profile picture
 * - Verified badge
 * - Star rating display
 * - Location information
 * - Contact information (office, mobile, fax, email)
 * - Social media links
 * - Link to agency's listings
 * 
 * @example
 * ```tsx
 * <AgencyCard agency={agencyData} />
 * ```
 */
export default function AgencyCard({ agency, className }: AgencyCardProps) {
  const logo = agency.logo || agency.profile_picture || "/images/agency-placeholder.jpg";

  // Calculate star rating
  const fullStars = Math.floor(agency.rating);
  const hasHalfStar = agency.rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const socialLinks = agency.social_links || {};

  const socialIcons = [
    { key: "facebook", Icon: Facebook, url: socialLinks.facebook, color: "text-blue-600" },
    { key: "instagram", Icon: Instagram, url: socialLinks.instagram, color: "text-pink-600" },
    { key: "twitter", Icon: Twitter, url: socialLinks.twitter, color: "text-blue-400" },
    { key: "linkedin", Icon: Linkedin, url: socialLinks.linkedin, color: "text-blue-700" },
    { key: "youtube", Icon: Youtube, url: socialLinks.youtube, color: "text-red-600" },
    { key: "whatsapp", Icon: MessageCircle, url: socialLinks.whatsapp, color: "text-green-600" },
  ].filter((item) => item.url);

  const location = [agency.city_name, agency.province_name].filter(Boolean).join("، ");

  return (
    <div
      className={cn(
        "bg-card rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow",
        className
      )}
    >
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="relative shrink-0">
            <div className="size-20 rounded-lg bg-bg flex items-center justify-center overflow-hidden border">
              {logo.startsWith("/") || logo.startsWith("http") ? (
                <Image
                  src={logo}
                  alt={agency.name}
                  width={80}
                  height={80}
                  className="size-full object-contain"
                />
              ) : (
                <Building2 className="size-10 text-font-t" />
              )}
            </div>
          </div>

          {/* Agency Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="text-lg font-semibold text-font-p">
                  {agency.name}
                </h3>
              </div>
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-font-s mt-1">
                <MapPin className="size-4 text-font-t" />
                <span>{location}</span>
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5" dir="ltr">
                {[...Array(fullStars)].map((_, i) => (
                  <Star key={`full-${i}`} className="size-4 fill-yellow-400 text-yellow-400" />
                ))}
                {hasHalfStar && (
                  <Star className="size-4 fill-yellow-400 text-yellow-400 [clip-path:inset(0_50%_0_0)]" />
                )}
                {[...Array(emptyStars)].map((_, i) => (
                  <Star key={`empty-${i}`} className="size-4 text-gray-300" />
                ))}
              </div>
              <span className="text-xs text-font-s">
                ({agency.total_reviews} نظر)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-6 pb-4 space-y-2 text-sm border-t pt-4">
        {agency.phone && (
          <div className="flex items-center gap-2 text-font-s">
            <Phone className="size-4 text-font-t" />
            <span className="font-medium text-font-t ml-2">دفتر:</span>
            <a href={`tel:${agency.phone}`} className="text-primary hover:underline" dir="ltr">
              {agency.phone}
            </a>
          </div>
        )}
        {agency.mobile && (
          <div className="flex items-center gap-2 text-font-s">
            <Phone className="size-4 text-font-t" />
            <span className="font-medium text-font-t ml-2">موبایل:</span>
            <a href={`tel:${agency.mobile}`} className="text-primary hover:underline" dir="ltr">
              {agency.mobile}
            </a>
          </div>
        )}
        {agency.fax && (
          <div className="flex items-center gap-2 text-font-s">
            <Phone className="size-4 text-font-t" />
            <span className="font-medium text-font-t ml-2">فکس:</span>
            <span dir="ltr">{agency.fax}</span>
          </div>
        )}
        {agency.email && (
          <div className="flex items-center gap-2 text-font-s">
            <Mail className="size-4 text-font-t" />
            <span className="font-medium text-font-t ml-2">ایمیل:</span>
            <a
              href={`mailto:${agency.email}`}
              className="text-primary hover:underline truncate flex-1"
              dir="ltr"
            >
              {agency.email}
            </a>
          </div>
        )}
      </div>

      {/* Social Links & Action */}
      <div className="px-6 pb-6 flex items-center justify-between gap-4 border-t pt-4">
        {/* Social Media Icons */}
        {socialIcons.length > 0 && (
          <div className="flex items-center gap-2">
            {socialIcons.map(({ key, Icon, url, color }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "hover:opacity-70 transition-opacity",
                  color
                )}
                aria-label={key}
              >
                <Icon className="size-5" />
              </a>
            ))}
          </div>
        )}

        {/* View Listings Button */}
        <Button asChild size="sm" className="shrink-0">
          <Link href={`/agencies/${agency.slug}`}>مشاهده آگهی‌ها</Link>
        </Button>
      </div>
    </div>
  );
}
