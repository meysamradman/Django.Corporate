"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/core/config/fetch";
import type { Blog } from "@/types/blog/blog";

export default function BlogViewPage() {
  const params = useParams();
  const blogId = params?.id as string;

  const { data: blog, isLoading, isError } = useQuery({
    queryKey: ["public-blog", blogId],
    queryFn: async () => {
      const response = await fetchApi.get<Blog>(`/public/blog/${Number(blogId)}/`);
      return response.data;
    },
    enabled: !!blogId,
  });

  if (!blogId) {
    return <section className="container mr-auto ml-auto py-10">شناسه نامعتبر است.</section>;
  }

  if (isLoading) {
    return <section className="container mr-auto ml-auto py-10">در حال بارگذاری...</section>;
  }

  if (isError || !blog) {
    return <section className="container mr-auto ml-auto py-10 text-red-1">خطا در دریافت اطلاعات وبلاگ</section>;
  }

  return (
    <article className="container mr-auto ml-auto py-10 space-y-4">
      <h1 className="text-2xl font-bold">{blog.title}</h1>
      <p className="text-sm text-font-s">{blog.short_description}</p>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: blog.description || "" }} />
    </article>
  );
}
