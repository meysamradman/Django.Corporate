import AgencyCard from "@/components/agencies/AgencyCard";
import { agencyApi } from "@/api/real-estate/agent";
import type { Agency } from "@/types/real-estate/agent";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Agencies List Page
 * Server-side rendered page displaying all real estate agencies
 * 
 * Features:
 * - SSR for SEO optimization
 * - Pagination support
 * - Filtering by location, rating, etc.
 * - Responsive grid layout
 */
export default async function AgenciesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Extract pagination and filter parameters
  const page = Number(params.page) || 1;
  const size = 12; // Items per page
  const search = typeof params.search === "string" ? params.search : undefined;
  const provinceId = params.province_id ? Number(params.province_id) : undefined;
  const cityId = params.city_id ? Number(params.city_id) : undefined;

  // Fetch agencies data on server
  const response = await agencyApi.getAgencies({
    page,
    size,
    search,
    province_id: provinceId,
    city_id: cityId,
    order_by: "rating",
    order_desc: true,
  }).catch(() => null);

  const agencies = response?.data || [];
  const totalCount = response?.pagination?.count || 0;
  const totalPages = response?.pagination?.total_pages || 1;
  const currentPage = response?.pagination?.current_page || page;

  return (
    <main className="container mx-auto px-4 py-10 md:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-font-p mb-3">
          آژانس‌های املاک
        </h1>
        <p className="text-font-s max-w-2xl">
          با معتبرترین آژانس‌های املاک آشنا شوید. تمامی آژانس‌های ثبت شده دارای مجوز رسمی
          و تیم مشاورین متخصص هستند.
        </p>
      </div>

      {/* Stats */}
      {totalCount > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-font-s">
            <span className="font-semibold text-font-p">{totalCount}</span> آژانس یافت شد
          </p>
          <p className="text-sm text-font-s">
            صفحه {currentPage} از {totalPages}
          </p>
        </div>
      )}

      {/* Agencies Grid */}
      {agencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agencies.map((agency: Agency) => (
            <AgencyCard key={agency.id} agency={agency} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-font-s text-lg">هیچ آژانسی یافت نشد.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <a
              href={`/agencies?page=${currentPage - 1}`}
              className="px-4 py-2 rounded-md border bg-card hover:bg-bg transition-colors"
            >
              قبلی
            </a>
          )}
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              
              return (
                <a
                  key={pageNum}
                  href={`/agencies?page=${pageNum}`}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary text-white font-semibold"
                      : "border bg-card hover:bg-bg"
                  }`}
                >
                  {pageNum}
                </a>
              );
            })}
          </div>

          {currentPage < totalPages && (
            <a
              href={`/agencies?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-md border bg-card hover:bg-bg transition-colors"
            >
              بعدی
            </a>
          )}
        </div>
      )}
    </main>
  );
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata() {
  return {
    title: "آژانس‌های املاک | لیست آژانس‌های معتبر",
    description: "مشاهده لیست کامل آژانس‌های معتبر املاک در سراسر کشور. تیم‌های حرفه‌ای و مجرب برای خدمات خرید، فروش و اجاره ملک.",
  };
}
