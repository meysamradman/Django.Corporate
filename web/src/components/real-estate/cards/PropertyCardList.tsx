import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { TruncatedText } from "@/components/elements/custom/truncatedText";
import { cn } from "@/core/utils/cn";
import { realEstateMedia } from "@/core/utils/media";
import type { Property } from "@/types/real-estate/property";
import {
  getAgentAvatar,
  getAgentInitials,
  getAgentName,
  getMetaItems,
  getPropertyCanonicalPath,
  toLocationLabel,
  toPriceLabel,
} from "./propertyCard.utils";

type PropertyCardListProps = {
  property: Property;
  className?: string;
  priority?: boolean;
};

export default function PropertyCardList({ property, className, priority = false }: PropertyCardListProps) {
  const href = getPropertyCanonicalPath(property);
  const imageSrc = realEstateMedia.getPropertyMainImage(property.main_image || null);
  const metaItems = getMetaItems(property);
  const agentName = getAgentName(property);
  const agentInitials = getAgentInitials(property);
  const agentAvatar = getAgentAvatar(property);

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-xl border border-br bg-card p-3 transition-smooth hover:shadow-sm",
        className
      )}
      aria-label={property.title || "جزئیات ملک"}
    >
      <article className="flex items-stretch gap-3">
        <div className="relative h-[170px] w-[180px] shrink-0 overflow-hidden rounded-lg border border-br bg-bg sm:w-[200px]">
          <Image
            src={imageSrc}
            alt={property.main_image?.alt_text || property.title || "ملک"}
            fill
            className="object-cover"
            priority={priority}
            sizes="(max-width: 640px) 45vw, 200px"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2 text-right">
          <h3 className="text-base font-semibold text-font-p">
            <TruncatedText text={property.title || "ملک"} maxLength={52} className="text-base font-semibold text-font-p" />
          </h3>
          <p className="text-sm font-medium text-font-p">قیمت: {toPriceLabel(property)}</p>

          {metaItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-start gap-3 text-xs text-font-s">
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
            <TruncatedText text={toLocationLabel(property)} maxLength={34} className="text-xs text-font-s" />
          </div>

          <div className="mt-1 flex items-center gap-2 border-t border-br pt-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-br bg-bg">
              {agentAvatar ? (
                <img
                  src={agentAvatar}
                  alt={agentName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-xs font-semibold text-font-p">{agentInitials}</span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[11px] leading-5 text-font-s">مشاور</p>
              <TruncatedText text={agentName} maxLength={28} className="text-xs font-medium text-font-p" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
