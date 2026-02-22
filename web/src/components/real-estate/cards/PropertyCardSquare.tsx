import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { cn } from "@/core/utils/cn";
import { realEstateMedia } from "@/core/utils/media";
import type { Property } from "@/types/real-estate/property";
import { TruncatedText } from "@/components/elements/custom/truncatedText";
import {
  getAgentAvatar,
  getAgentInitials,
  getAgentName,
  getOwnerRoleLabel,
  getMetaItems,
  getPropertyCanonicalPath,
  toLocationLabel,
  toPriceLabel,
} from "./propertyCard.utils";

type PropertyCardSquareProps = {
  property: Property;
  className?: string;
  priority?: boolean;
};

export default function PropertyCardSquare({ property, className, priority = false }: PropertyCardSquareProps) {
  const href = getPropertyCanonicalPath(property);
  const imageSrc = realEstateMedia.getPropertyMainImage(property.main_image || null);
  const metaItems = getMetaItems(property);
  const agentName = getAgentName(property);
  const agentInitials = getAgentInitials(property);
  const agentAvatar = getAgentAvatar(property);
  const ownerRoleLabel = getOwnerRoleLabel(property);

  return (
    <Link
      href={href}
      className={cn(
        "group block overflow-hidden rounded-xl border border-br bg-card transition-smooth hover:shadow-sm",
        className
      )}
      aria-label={property.title || "جزئیات ملک"}
    >
      <article className="flex h-full flex-col">
        <div className="relative h-44 w-full overflow-hidden bg-bg">
          <Image
            src={imageSrc}
            alt={property.main_image?.alt_text || property.title || "ملک"}
            fill
            className="object-cover"
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 text-right">
          <h3 className="line-clamp-2 text-base font-semibold leading-7 text-font-p">{property.title || "ملک"}</h3>
          <p className="line-clamp-2 text-sm text-font-s">{property.short_description || "-"}</p>

          {metaItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-font-s">
              {metaItems.map((item) => (
                <span key={item.key} className="inline-flex items-center gap-1">
                  {item.icon}
                  {item.value}
                </span>
              ))}
            </div>
          )}

          <div className="inline-flex items-center gap-1 text-xs text-font-s">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{toLocationLabel(property)}</span>
          </div>

          <div className="mt-1 flex items-center gap-2 border-t border-br pt-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-br bg-bg">
              {agentAvatar ? (
                <img
                  src={agentAvatar}
                  alt={agentName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-[11px] font-semibold text-font-p">{agentInitials}</span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] leading-5 text-font-s">{ownerRoleLabel}</p>
              <TruncatedText text={agentName} maxLength={24} className="text-xs font-medium text-font-p" />
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-1">
            <span className="text-sm font-semibold text-primary">{toPriceLabel(property)}</span>
            <span className="text-xs text-font-s">مشاهده</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
