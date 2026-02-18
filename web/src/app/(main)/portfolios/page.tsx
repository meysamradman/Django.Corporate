import { portfolioApi } from "@/api/portfolios/route";
import PortfolioList from "@/components/portfolios/PortfolioList";
import PortfolioPagination from "@/components/portfolios/PortfolioPagination";
import { resolvePaginatedData } from "@/core/utils/pagination";

type PageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PORTFOLIOS_PAGE_SIZE = 9;

export default async function PortfoliosPage({ searchParams }: PageProps) {
	const params = await searchParams;

	const pageParam = typeof params.page === "string" ? Number(params.page) : 1;
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
	const search = typeof params.search === "string" ? params.search : undefined;

	const response = await portfolioApi
		.getPortfolioList({
			page,
			size: PORTFOLIOS_PAGE_SIZE,
			search,
			order_by: "created_at",
			order_desc: true,
		})
		.catch(() => null);

	const { items: portfolios, pagination } = resolvePaginatedData(response, page);

	return (
		<main className="container mx-auto px-4 py-10 md:py-12">
			<div className="mb-8">
				<h1 className="mb-3 text-3xl font-bold text-font-p md:text-4xl">نمونه‌کارها</h1>
				<p className="max-w-2xl text-font-s">
					جدیدترین نمونه‌کارها و پروژه‌ها به‌صورت داینامیک از بک‌اند بارگذاری می‌شوند.
				</p>
			</div>

			{pagination.count > 0 && (
				<div className="mb-6 flex items-center justify-between text-sm text-font-s">
					<p>
						<span className="font-semibold text-font-p">{pagination.count}</span> نمونه‌کار یافت شد
					</p>
					<p>
						صفحه {pagination.current_page} از {pagination.total_pages}
					</p>
				</div>
			)}

			{portfolios.length > 0 ? (
				<>
					<PortfolioList portfolios={portfolios} />
					<div className="mt-10">
						<PortfolioPagination
							currentPage={pagination.current_page}
							totalPages={pagination.total_pages}
							search={search}
						/>
					</div>
				</>
			) : (
				<div className="rounded-lg border bg-card px-6 py-16 text-center">
					<p className="text-lg text-font-s">نمونه‌کاری برای نمایش یافت نشد.</p>
				</div>
			)}
		</main>
	);
}

export async function generateMetadata() {
	return {
		title: "نمونه‌کارها | پروژه‌های انجام‌شده",
		description: "لیست به‌روز نمونه‌کارها با رندر سروری برای سرعت و سئوی بهتر.",
	};
}
