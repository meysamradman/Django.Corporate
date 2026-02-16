"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/core/utils/cn";

export type PropertyGalleryItem = {
  id: string;
  url: string;
  title?: string;
  alt?: string;
  isMain?: boolean;
};

interface LightboxApiLike {
  scrollPrev?: () => void;
  scrollNext?: () => void;
  scrollTo?: (index: number) => void;
}

type PropertyGalleryLightboxProps = {
  isOpen: boolean;
  items: PropertyGalleryItem[];
  title?: string;
  selectedIndex: number;
  lightboxRef: (node: HTMLDivElement | null) => void;
  lightboxApi: LightboxApiLike | undefined;
  onClose: () => void;
};

export default function PropertyGalleryLightbox({
  isOpen,
  items,
  title,
  selectedIndex,
  lightboxRef,
  lightboxApi,
  onClose,
}: PropertyGalleryLightboxProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 bg-static-b flex flex-col animate-in fade-in duration-300" dir="rtl">
      <div className="flex items-center justify-between p-6 bg-linear-to-b from-static-b/80 to-transparent z-10">
        <div className="flex items-center gap-4 text-wt">
          <div className="px-3 py-1 rounded-full bg-wt/10 backdrop-blur-md border border-wt/10 text-xs font-black">
            {selectedIndex + 1} / {items.length}
          </div>
          {title ? (
            <h3 className="text-sm font-bold opacity-80 hidden md:block text-wt">
              {title}
            </h3>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-3 rounded-full bg-wt/10 hover:bg-wt/20 text-wt transition-all cursor-pointer border border-wt/10 hover:rotate-90 duration-300"
          aria-label="بستن"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div ref={lightboxRef} className="w-full h-full overflow-hidden">
          <div className="flex h-full" dir="rtl">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex-[0_0_100%] min-w-0 h-full flex flex-col items-center justify-center p-4 md:p-12"
              >
                <div className="relative max-w-full max-h-full group/image flex items-center justify-center">
                  <img
                    src={item.url}
                    alt={item.alt || ""}
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-500"
                    loading={index === selectedIndex ? "eager" : "lazy"}
                  />
                  {item.isMain ? (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-blue-1 text-wt text-[10px] font-black rounded-lg shadow-lg">
                      عکس شاخص
                    </div>
                  ) : null}
                </div>

                {item.title ? (
                  <p className="text-wt/60 text-xs font-medium mt-6 bg-wt/5 px-4 py-2 rounded-full border border-wt/5">
                    {item.title}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => lightboxApi?.scrollPrev?.()}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-wt/5 hover:bg-wt/15 text-wt transition-all cursor-pointer backdrop-blur-md border border-wt/10 group/nav"
              aria-label="قبلی"
            >
              <ChevronRight className="w-8 h-8 group-hover/nav:scale-110 duration-300" />
            </button>
            <button
              type="button"
              onClick={() => lightboxApi?.scrollNext?.()}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-wt/5 hover:bg-wt/15 text-wt transition-all cursor-pointer backdrop-blur-md border border-wt/10 group/nav"
              aria-label="بعدی"
            >
              <ChevronLeft className="w-8 h-8 group-hover/nav:scale-110 duration-300" />
            </button>
          </>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="py-2 px-6 bg-static-b border-t border-wt/5">
          <div className="max-w-4xl mx-auto flex gap-4 overflow-x-auto py-5 snap-x justify-center">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => lightboxApi?.scrollTo?.(index)}
                className={cn(
                  "relative shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-xl overflow-hidden transition-all duration-300 border-2 snap-center cursor-pointer",
                  selectedIndex === index
                    ? "border-blue-1 scale-110 shadow-lg shadow-blue-1/20"
                    : "border-transparent opacity-40 hover:opacity-100"
                )}
                aria-label={`رفتن به تصویر ${index + 1}`}
              >
                <img src={item.url} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
