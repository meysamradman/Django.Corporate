import { Suspense } from "react";
import { blogApi } from "@/api/blogs/route";
import { resolvePaginatedData } from "@/core/utils/pagination";
import { buildBlogListHref, normalizeSlug, resolveBlogListQuery, toBlogListApiParams } from "@/components/blogs/query";
import BlogListPageClient from "@/components/blogs/BlogListPageClient";
import { permanentRedirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function BlogsPageFallback() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border bg-card">
              <div className="aspect-16/10 w-full bg-gray" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-24 rounded bg-gray" />
                <div className="h-5 w-3/4 rounded bg-gray" />
                <div className="h-4 w-full rounded bg-gray" />
                <div className="h-4 w-5/6 rounded bg-gray" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="lg:col-span-4 space-y-3">
        <div className="rounded-lg border bg-card p-4 md:p-5 flex items-center justify-between gap-2">
          <div className="h-5 w-28 rounded bg-gray" />
          <div className="h-4 w-16 rounded bg-gray" />
        </div>
        <div className="rounded-md border bg-card p-3 space-y-3">
          <div className="h-4 w-20 rounded bg-gray" />
          <div className="h-9 w-full rounded bg-gray" />
          <div className="h-3 w-2/3 rounded bg-gray" />
        </div>
        <div className="rounded-md border bg-card p-3 space-y-3">
          <div className="h-4 w-24 rounded bg-gray" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-9 w-full rounded bg-gray" />
          ))}
        </div>
      </aside>
    </div>
  );
}

async function BlogsCategoryBody({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const { page, search } = resolveBlogListQuery(sp);

  const normalizedSlug = normalizeSlug(slug) || slug;

  // Canonicalize broken/double-encoded URLs.
  if (normalizedSlug !== slug) {
    permanentRedirect(
      buildBlogListHref({ page, search, category_slug: normalizedSlug, tag_slug: undefined })
    );
  }

  const response = await blogApi
    .getBlogList(toBlogListApiParams({ page, search, category_slug: normalizedSlug }))
    .catch(() => null);

  const { items: blogs, pagination } = resolvePaginatedData(response, page);

  const categoryResponse = await blogApi
    .getCategories({ size: 50 })
    .catch(() => null);
  const { items: categories } = resolvePaginatedData(categoryResponse, 1);

  const tagResponse = await blogApi
    .getTags({ size: 50 })
    .catch(() => null);
  const { items: tags } = resolvePaginatedData(tagResponse, 1);

  return (
    <BlogListPageClient
      initialBlogs={blogs}
      initialPagination={pagination}
      initialSearch={search}
      initialCategorySlug={normalizedSlug}
      categories={categories}
      tags={tags}
    />
  );
}

export default function BlogCategoryPage({ params, searchParams }: PageProps) {
  return (
    <main className="container mx-auto px-4 py-10 md:py-12">
      <div className="mb-8">
        <h1 className="mb-3 text-3xl font-bold text-font-p md:text-4xl">وبلاگ</h1>
        <p className="max-w-2xl text-font-s">نمایش مطالب براساس دسته‌بندی انتخاب‌شده.</p>
      </div>

      <Suspense fallback={<BlogsPageFallback />}>
        <BlogsCategoryBody params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return {
    title: `وبلاگ | دسته‌بندی ${slug}`,
    description: `مطالب وبلاگ در دسته‌بندی ${slug}.`,
  };
}
