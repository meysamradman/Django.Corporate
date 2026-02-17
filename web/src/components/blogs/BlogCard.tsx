import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/elements/Badge";
import { formatDate } from "@/core/utils/format";
import { blogMedia } from "@/core/utils/media";
import type { Blog } from "@/types/blog/blog";

type BlogCardProps = {
  blog: Blog;
};

type BlogWithMainImageUrl = Blog & {
  main_image_url?: string | null;
};

const getCanonicalBlogId = (blog: Blog): string | number => {
  if (typeof blog.id === "number" && Number.isFinite(blog.id)) {
    return blog.id;
  }

  return blog.public_id;
};

export default function BlogCard({ blog }: BlogCardProps) {
  const blogData = blog as BlogWithMainImageUrl;
  const canonicalId = getCanonicalBlogId(blog);

  const imageSrc = blogMedia.getPostImage(
    blogData.main_image_url || blogData.main_image?.file_url || null
  );

  return (
    <article className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-16/10 w-full">
        <Image
          src={imageSrc}
          alt={blog.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          {blog.categories?.slice(0, 2).map((category) => (
            <Badge key={category.public_id} variant="gray">
              {category.name}
            </Badge>
          ))}

          {blog.is_featured && <Badge>ویژه</Badge>}
        </div>

        <h2 className="line-clamp-2 text-lg font-semibold text-font-p">
          <Link href={`/blogs/${canonicalId}/${blog.slug}`} className="hover:text-primary transition-colors">
            {blog.title}
          </Link>
        </h2>

        <p className="line-clamp-3 text-sm leading-6 text-font-s">{blog.short_description}</p>

        <div className="flex items-center gap-2 text-xs text-font-t">
          <CalendarDays className="size-4" />
          <span>{formatDate(blog.created_at)}</span>
        </div>

        <div>
          <Link
            href={`/blogs/${canonicalId}/${blog.slug}`}
            className="text-sm font-black text-primary hover:underline"
          >
            مشاهده مطلب
          </Link>
        </div>
      </div>
    </article>
  );
}
