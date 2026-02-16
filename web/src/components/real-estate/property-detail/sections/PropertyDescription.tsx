import { Download, SquareCheck } from "lucide-react";

import type { Property, PropertyDocumentItem } from "@/types/real-estate/property";

type PropertyDescriptionProps = {
  property: Pick<Property, "description" | "documents">;
  className?: string;
};

function getDocumentUrl(item: PropertyDocumentItem | null | undefined): string | null {
  if (!item) return null;
  const url = item.media?.file_url || item.media_detail?.file_url;
  return typeof url === "string" && url.trim() ? url : null;
}

function getDocumentTitle(item: PropertyDocumentItem): string {
  const title = item.title || item.media?.title || item.media_detail?.title;
  return (typeof title === "string" && title.trim()) ? title : "فایل";
}

export default function PropertyDescription({ property, className }: PropertyDescriptionProps) {
  const description = typeof property.description === "string" ? property.description.trim() : "";
  const documents = Array.isArray(property.documents) ? property.documents.filter(Boolean) : [];

  if (!description && !documents.length) return null;

  return (
    <section
      className={
        className ||
        "bg-wt border border-br/50 rounded-2xl overflow-hidden"
      }
    >
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-lg font-black text-font-p">توضیحات</h2>
      </div>

      <div className="px-6 py-6">
        {description ? (
          <div className="text-sm leading-7 text-font-s whitespace-pre-line">
            {description}
          </div>
        ) : null}

        {documents.length ? (
          <div className={description ? "mt-8" : ""}>
            <div className="pt-2 border-t border-br/40">
              <h3 className="mt-6 text-sm font-black text-font-p">مدارک ملک</h3>

              <div className="mt-4 space-y-3">
                {documents.map((doc) => {
                  const url = getDocumentUrl(doc);
                  if (!url) return null;

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 text-sm text-font-p"
                    >
                      <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                        <SquareCheck className="w-4.5 h-4.5 text-font-s" />
                      </span>

                      <span className="font-bold">{getDocumentTitle(doc)}</span>

                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-auto inline-flex items-center gap-2 text-blue-1 font-black text-xs hover:underline"
                      >
                        دانلود
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
