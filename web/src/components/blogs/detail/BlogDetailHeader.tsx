import Image from "next/image";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/elements/Badge";
import { formatDate } from "@/core/utils/format";
import { blogMedia } from "@/core/utils/media";
import type { Blog } from "@/types/blog/blog";

type BlogDetailHeaderProps = {
  blog: Blog;
};

type BlogWithDetailMedia = Blog & {
  main_image_url?: string | null;
  media?: Array<{
    media?: {
      file_url?: string | null;
      media_type?: string;
    } | null;
    is_main_image?: boolean;
  }>;
};

function getCoverImage(blog: BlogWithDetailMedia): string {
  const mainImage = blog.main_image?.file_url || blog.main_image_url;
  if (mainImage) {
    return blogMedia.getPostImage(mainImage);
  }

  const mediaItems = Array.isArray(blog.media) ? blog.media : [];
  const preferredImage =
    mediaItems.find((item) => item?.is_main_image && item?.media?.file_url)?.media?.file_url ||
    mediaItems.find((item) => item?.media?.media_type === "image" && item?.media?.file_url)?.media?.file_url ||
    null;

  return blogMedia.getPostImage(preferredImage);
}

export default function BlogDetailHeader({ blog }: BlogDetailHeaderProps) {
  const blogData = blog as BlogWithDetailMedia;
  const coverImage = getCoverImage(blogData);

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {blog.categories?.map((category) => (
            <Badge key={category.public_id} variant="gray">
              {category.name}
            </Badge>
          ))}

          {blog.is_featured && <Badge>ویژه</Badge>}
        </div>

        <h1 className="text-2xl font-black text-font-p md:text-4xl">{blog.title}</h1>

        <p className="max-w-3xl text-sm leading-7 text-font-s md:text-base">{blog.short_description}</p>

        <div className="flex items-center gap-2 text-sm text-font-t">
          <CalendarDays className="size-4" />
          <span>{formatDate(blog.created_at)}</span>
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border bg-card">
        <Image
          src={coverImage}
          alt={blog.title}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
    </section>
  );
}
