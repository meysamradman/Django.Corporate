import { Hash, Info } from "lucide-react";

import { Badge } from "@/components/elements/Badge";
import { formatDate } from "@/core/utils/format";
import type { Portfolio } from "@/types/portfolio/portfolio";

type PortfolioDetailMetaProps = {
  portfolio: Pick<Portfolio, "created_at" | "tags" | "slug" | "options">;
};

export default function PortfolioDetailMeta({ portfolio }: PortfolioDetailMetaProps) {
  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-font-p">
          <Info className="size-4" />
          <h3 className="font-black">اطلاعات نمونه‌کار</h3>
        </div>

        <div className="space-y-3 text-sm text-font-s">
          <div className="flex items-center justify-between gap-3">
            <span>تاریخ انتشار</span>
            <span className="font-bold text-font-p">{formatDate(portfolio.created_at)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span>شناسه نمونه‌کار</span>
            <span className="font-bold text-font-p" dir="ltr">
              {portfolio.slug}
            </span>
          </div>
        </div>
      </section>

      {portfolio.tags?.length ? (
        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-font-p">
            <Hash className="size-4" />
            <h3 className="font-black">تگ‌ها</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {portfolio.tags.map((tag) => (
              <Badge key={tag.public_id} variant="gray">
                {tag.name}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {portfolio.options?.length ? (
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="mb-4 font-black text-font-p">ویژگی‌ها</h3>

          <div className="flex flex-wrap gap-2">
            {portfolio.options.map((option) => (
              <Badge key={option.public_id} variant="gray">
                {option.name}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
