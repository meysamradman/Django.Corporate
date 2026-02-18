"use client";

import BlogCard from "@/components/blogs/BlogCard";
import type { Blog } from "@/types/blog/blog";

type BlogListProps = {
  blogs: Blog[];
};

export default function BlogList({ blogs }: BlogListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {blogs.map((blog, index) => (
        <BlogCard key={blog.public_id} blog={blog} priorityImage={index === 0} />
      ))}
    </div>
  );
}
