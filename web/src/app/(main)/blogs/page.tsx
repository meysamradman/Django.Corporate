import { blogApi } from "@/api/blogs/route";
import BlogList from "@/components/blogs/BlogList";
import BlogPagination from "@/components/blogs/BlogPagination";
import { resolvePaginatedData } from "@/core/utils/pagination";
import { resolveBlogListQuery, toBlogListApiParams } from "@/components/blogs/query";

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BlogsPage({ searchParams }: PageProps) {
	const params = await searchParams;
	const { page, search } = resolveBlogListQuery(params);

	const response = await blogApi
		.getBlogList(toBlogListApiParams({ page, search }))
		.catch(() => null);

	const { items: blogs, pagination } = resolvePaginatedData(response, page);

	return (
		<main className="container mx-auto px-4 py-10 md:py-12">
			<div className="mb-8">
				<h1 className="mb-3 text-3xl font-bold text-font-p md:text-4xl">وبلاگ</h1>
				<p className="max-w-2xl text-font-s">
					تازه‌ترین مطالب، تحلیل‌ها و نکات کاربردی بازار املاک را به‌صورت داینامیک از بک‌اند دنبال کنید.
				</p>
			</div>

			{pagination.count > 0 && (
				<div className="mb-6 flex items-center justify-between text-sm text-font-s">
					<p>
						<span className="font-semibold text-font-p">{pagination.count}</span> مطلب یافت شد
					</p>
					<p>
						صفحه {pagination.current_page} از {pagination.total_pages}
					</p>
				</div>
			)}

			{blogs.length > 0 ? (
				<>
					<BlogList blogs={blogs} />
					<div className="mt-10">
						<BlogPagination
							currentPage={pagination.current_page}
							totalPages={pagination.total_pages}
							search={search}
						/>
					</div>
				</>
			) : (
				<div className="rounded-lg border bg-card px-6 py-16 text-center">
					<p className="text-lg text-font-s">مطلبی برای نمایش یافت نشد.</p>
				</div>
			)}
		</main>
	);
}

export async function generateMetadata() {
	return {
		title: "وبلاگ | تازه‌ترین مطالب",
		description: "لیست به‌روز مقالات و مطالب وبلاگ با بارگذاری سروری برای سرعت و سئوی بهتر.",
	};
}
