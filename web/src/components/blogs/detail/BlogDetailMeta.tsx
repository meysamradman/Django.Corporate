import { Hash, Info } from "lucide-react";

import { Badge } from "@/components/elements/badge";
import { formatDate } from "@/core/utils/format";
import type { Blog } from "@/types/blog/blog";

type BlogDetailMetaProps = {
  blog: Pick<Blog, "created_at" | "tags" | "slug">;
};

export default function BlogDetailMeta({ blog }: BlogDetailMetaProps) {
  return (
    <aside className="space-y-6">
      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-font-p">
          <Info className="size-4" />
          <h3 className="font-black">اطلاعات مطلب</h3>
        </div>

        <div className="space-y-3 text-sm text-font-s">
          <div className="flex items-center justify-between gap-3">
            <span>تاریخ انتشار</span>
            <span className="font-bold text-font-p">{formatDate(blog.created_at)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span>شناسه مطلب</span>
            <span className="font-bold text-font-p" dir="ltr">
              {blog.slug}
            </span>
          </div>
        </div>
      </section>

      {blog.tags?.length ? (
        <section className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-font-p">
            <Hash className="size-4" />
            <h3 className="font-black">تگ‌ها</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag) => (
              <Badge key={tag.public_id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
