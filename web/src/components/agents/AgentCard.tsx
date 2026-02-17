import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Phone, Mail, MapPin, Star } from "lucide-react";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle,
} from "lucide-react";
import type { Agent } from "@/types/real-estate/agent";
import { Button } from "@/components/elements/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { cn } from "@/core/utils/cn";

type AgentCardProps = {
  agent: Agent;
  className?: string;
};

/**
 * AgentCard - Display agent profile information in a card format
 * 
 * Features:
 * - Profile picture with fallback
 * - Verified badge
 * - Star rating display
 * - Contact information (office, mobile, fax, email)
 * - Social media links
 * - Link to agent's listings
 * 
 * @example
 * ```tsx
 * <AgentCard agent={agentData} />
 * ```
 */
export default function AgentCard({ agent, className }: AgentCardProps) {
  const profilePicture = agent.profile_picture || "/images/avatar-placeholder.jpg";
  const initials = agent.user_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  // Calculate star rating
  const fullStars = Math.floor(agent.rating);
  const hasHalfStar = agent.rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const socialLinks = agent.social_links || {};
  const agentPath = `/agents/${agent.id}/${encodeURIComponent(agent.slug)}`;

  const socialIcons = [
    { key: "facebook", Icon: Facebook, url: socialLinks.facebook, color: "text-blue-600" },
    { key: "instagram", Icon: Instagram, url: socialLinks.instagram, color: "text-pink-600" },
    { key: "twitter", Icon: Twitter, url: socialLinks.twitter, color: "text-blue-400" },
    { key: "linkedin", Icon: Linkedin, url: socialLinks.linkedin, color: "text-blue-700" },
    { key: "youtube", Icon: Youtube, url: socialLinks.youtube, color: "text-red-600" },
    { key: "whatsapp", Icon: MessageCircle, url: socialLinks.whatsapp, color: "text-green-600" },
  ].filter((item) => item.url);

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
          {/* Profile Picture */}
          <div className="relative shrink-0">
            <Avatar className="size-20 rounded-lg">
              <AvatarImage src={profilePicture} alt={agent.user_name} />
              <AvatarFallback className="rounded-lg text-lg">{initials}</AvatarFallback>
            </Avatar>
            {agent.is_verified && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                <CheckCircle2 className="size-4 text-white" />
              </div>
            )}
          </div>

          {/* Agent Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="text-lg font-semibold text-font-p truncate">
                  {agent.user_name}
                </h3>
                {agent.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="size-3" />
                    تایید شده
                  </span>
                )}
              </div>
            </div>

            {/* Agency & Specialization */}
            <div className="text-sm space-y-0.5">
              {agent.agency_name && (
                <p className="text-font-s">
                  مشاور در <span className="text-primary font-medium">{agent.agency_name}</span>
                </p>
              )}
              {agent.specialization && (
                <p className="text-font-t text-xs">{agent.specialization}</p>
              )}
            </div>

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
                ({agent.total_reviews} نظر)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="px-6 pb-4 space-y-2 text-sm border-t pt-4">
        {agent.phone && (
          <div className="flex items-center gap-2 text-font-s">
            <Phone className="size-4 text-font-t" />
            <span className="font-medium text-font-t ml-2">دفتر:</span>
            <a href={`tel:${agent.phone}`} className="text-primary hover:underline" dir="ltr">
              {agent.phone}
            </a>
          </div>
        )}
        {agent.mobile && (
          <div className="flex items-center gap-2 text-font-s">
            <Phone className="size-4 text-font-t" />
            <span className="font-medium text-font-t ml-2">موبایل:</span>
            <a href={`tel:${agent.mobile}`} className="text-primary hover:underline" dir="ltr">
              {agent.mobile}
            </a>
          </div>
        )}
        {agent.fax && (
          <div className="flex items-center gap-2 text-font-s">
            <Phone className="size-4 text-font-t" />
            <span className="font-medium text-font-t ml-2">فکس:</span>
            <span dir="ltr">{agent.fax}</span>
          </div>
        )}
        {agent.email && (
          <div className="flex items-center gap-2 text-font-s">
            <Mail className="size-4 text-font-t" />
            <span className="font-medium text-font-t ml-2">ایمیل:</span>
            <a
              href={`mailto:${agent.email}`}
              className="text-primary hover:underline truncate flex-1"
              dir="ltr"
            >
              {agent.email}
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
          <Link href={agentPath}>مشاهده آگهی‌ها</Link>
        </Button>
      </div>
    </div>
  );
}
