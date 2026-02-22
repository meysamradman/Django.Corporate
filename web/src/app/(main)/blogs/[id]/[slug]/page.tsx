import { notFound } from "next/navigation";

import { blogApi } from "@/api/blogs/route";
import BlogDetailHeader from "@/components/blogs/detail/BlogDetailHeader";
import BlogDetailContent from "@/components/blogs/detail/BlogDetailContent";
import BlogDetailMeta from "@/components/blogs/detail/BlogDetailMeta";
import { ensureCanonicalDetailRedirect } from "@/core/seo/canonical/detail";

type PageProps = {
  params: Promise<{ id: string; slug: string }>;
};

export default async function BlogDetailPage({ params }: PageProps) {
  const { id, slug } = await params;

  const blog = await blogApi.getBlogByNumericId(id).catch(() => null);

  if (!blog) {
    notFound();
  }

  ensureCanonicalDetailRedirect({
    basePath: "/blogs",
    routeId: id,
    routeSlug: slug,
    entity: blog,
  });

  return (
    <main className="container mx-auto px-4 py-10 md:py-12">
      <div className="space-y-8">
        <BlogDetailHeader blog={blog} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <BlogDetailContent blog={blog} />
          <BlogDetailMeta blog={blog} />
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  const blog = await blogApi.getBlogByNumericId(id).catch(() => null);

  if (!blog) {
    return {
      title: "وبلاگ",
      description: "جزئیات مطلب وبلاگ",
    };
  }

  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description || blog.short_description,
    openGraph: {
      title: blog.og_title || blog.title,
      description: blog.og_description || blog.short_description,
    },
  };
}
