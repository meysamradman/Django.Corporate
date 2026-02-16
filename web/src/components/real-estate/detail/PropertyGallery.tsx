"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LayoutGrid, Maximize2 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import { cn } from "@/core/utils/cn";
import PropertyGalleryLightbox, {
  type PropertyGalleryItem,
} from "@/components/real-estate/detail/PropertyGalleryLightbox";

type PropertyGalleryProps = {
  title: string;
  images: string[];
  mainImageUrl?: string | null;
  className?: string;
};

export default function PropertyGallery({ title, images, mainImageUrl, className }: PropertyGalleryProps) {
  const items = useMemo<PropertyGalleryItem[]>(() => {
    const list = Array.isArray(images) ? images.filter(Boolean) : [];
    return list.map((url, index) => ({
      id: `${index}-${url}`,
      url,
      alt: title,
      isMain: mainImageUrl ? url === mainImageUrl : index === 0,
    }));
  }, [images, mainImageUrl, title]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [lightboxRef, lightboxApi] = useEmblaCarousel({
    loop: true,
    direction: "rtl",
  });

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setIsLightboxOpen(true);
  };

  const onSelect = useCallback(() => {
    if (!lightboxApi) return;
    setSelectedIndex(lightboxApi.selectedScrollSnap());
  }, [lightboxApi]);

  useEffect(() => {
    if (!lightboxApi) return;
    onSelect();
    lightboxApi.on("select", onSelect);
    lightboxApi.on("reInit", onSelect);
    return () => {
      lightboxApi.off("select", onSelect);
    };
  }, [lightboxApi, onSelect]);

  useEffect(() => {
    if (!lightboxApi || !isLightboxOpen) return;
    lightboxApi.scrollTo(selectedIndex, true);
  }, [isLightboxOpen, lightboxApi, selectedIndex]);

  if (!items.length) return null;

  const gridItems = items.slice(0, 5);
  const itemCount = gridItems.length;
  const remainingCount = Math.max(0, items.length - 5);

  const mainItemClass = itemCount === 1 ? "col-span-4" : "col-span-4 lg:col-span-2";

  let rightSideClass = "hidden lg:grid col-span-2 gap-4 h-full";
  if (itemCount === 2) rightSideClass += " grid-cols-1 grid-rows-1";
  else if (itemCount === 3) rightSideClass += " grid-cols-1 grid-rows-2";
  else rightSideClass += " grid-cols-2 grid-rows-2";

  return (
    <>
      <div
        className={cn(
          "relative w-full h-[360px] md:h-[420px] lg:h-[520px] grid grid-cols-4 gap-4 overflow-hidden rounded-2xl group/gallery",
          className
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-bg cursor-pointer h-full border border-br/50",
            mainItemClass
          )}
          onClick={() => openLightbox(0)}
        >
          <img
            src={gridItems[0].url}
            alt={gridItems[0].alt || ""}
            className="w-full h-full object-cover transition-transform duration-700 group-hover/gallery:scale-105"
            loading="eager"
          />

          <div className="absolute inset-0 bg-static-b/0 group-hover/gallery:bg-static-b/10 transition-colors duration-300" />

          {gridItems[0].isMain ? (
            <div className="absolute top-4 right-4 z-10">
              <div className="px-3 py-1.5 bg-blue-1 text-wt text-[10px] font-black rounded-lg shadow-lg backdrop-blur-sm border border-wt/10 ring-1 ring-static-b/10">
                عکس شاخص
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="absolute bottom-4 right-4 lg:hidden z-10 px-4 py-2 bg-wt/90 backdrop-blur-md rounded-xl border border-br/50 shadow-sm flex items-center gap-2 text-xs font-black text-font-p cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(0);
            }}
          >
            <LayoutGrid className="w-4 h-4" />
            مشاهده همه ({items.length})
          </button>
        </div>

        {itemCount > 1 ? (
          <div className={rightSideClass}>
            {gridItems.slice(1, 5).map((item, index) => {
              const actualIndex = index + 1;
              const isLastVisible = actualIndex === 4 && remainingCount > 0;

              const isFour = itemCount === 4;
              const spanClass = isFour && index === 0 ? "col-span-2" : "";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative overflow-hidden bg-bg cursor-pointer group/item h-full border border-br/50",
                    spanClass
                  )}
                  onClick={() => openLightbox(actualIndex)}
                >
                  <img
                    src={item.url}
                    alt={item.alt || ""}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-static-b/5 group-hover/item:bg-static-b/20 transition-colors duration-300" />

                  {isLastVisible ? (
                    <div className="absolute inset-0 bg-static-b/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-wt">
                      <p className="text-xl font-black">+{remainingCount}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest mt-1">
                        مشاهده همه
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="absolute bottom-6 left-6 hidden lg:flex items-center gap-2.5 px-5 py-2.5 bg-wt/95 backdrop-blur-md text-font-p border border-br/60 rounded-xl shadow-xl hover:bg-wt hover:scale-105 transition-all duration-300 z-10 font-bold text-sm cursor-pointer active:scale-95"
        >
          <LayoutGrid className="w-4 h-4 text-blue-1" />
          مشاهده تمام {items.length} تصویر
        </button>

        <div className="absolute top-6 left-6 flex gap-3 z-10 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="p-3 rounded-xl bg-static-b/30 text-wt hover:bg-static-b/50 backdrop-blur-lg border border-wt/10 transition-all cursor-pointer shadow-lg"
            title="نمایش تمام صفحه"
            aria-label="نمایش تمام صفحه"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <PropertyGalleryLightbox
        isOpen={isLightboxOpen}
        items={items}
        title={title}
        selectedIndex={selectedIndex}
        lightboxRef={lightboxRef}
        lightboxApi={lightboxApi}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
}
