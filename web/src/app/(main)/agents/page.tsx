import AgentCard from "@/components/agents/AgentCard";
import { agentApi } from "@/api/real-estate/agent";
import type { Agent } from "@/types/real-estate/agent";
import { resolvePaginatedData } from "@/core/utils/pagination";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Agents List Page
 * Server-side rendered page displaying all real estate agents
 * 
 * Features:
 * - SSR for SEO optimization
 * - Pagination support
 * - Filtering by agency, verification status, etc.
 * - Responsive grid layout
 */
export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Extract pagination and filter parameters
  const page = Number(params.page) || 1;
  const size = 12; // Items per page
  const search = typeof params.search === "string" ? params.search : undefined;
  const agencyId = params.agency_id ? Number(params.agency_id) : undefined;
  const isVerified = params.verified === "true" ? true : undefined;

  // Fetch agents data on server
  const response = await agentApi.getAgents({
    page,
    size,
    search,
    agency_id: agencyId,
    is_verified: isVerified,
    order_by: "rating",
    order_desc: true,
  }).catch(() => null);

  const { items: agents, pagination } = resolvePaginatedData(response, page);
  const totalCount = pagination.count;
  const totalPages = pagination.total_pages;
  const currentPage = pagination.current_page;

  return (
    <main className="container mx-auto px-4 py-10 md:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-font-p mb-3">
          مشاورین املاک
        </h1>
        <p className="text-font-s max-w-2xl">
          با مشاورین حرفه‌ای و کارآزموده در زمینه معاملات املاک آشنا شوید.
          تمامی مشاورین دارای مجوز و تأییدیه لازم هستند.
        </p>
      </div>

      {/* Stats */}
      {totalCount > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-font-s">
            <span className="font-semibold text-font-p">{totalCount}</span> مشاور یافت شد
          </p>
          <p className="text-sm text-font-s">
            صفحه {currentPage} از {totalPages}
          </p>
        </div>
      )}

      {/* Agents Grid */}
      {agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent: Agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-font-s text-lg">هیچ مشاوری یافت نشد.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <a
              href={`/agents?page=${currentPage - 1}`}
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
                  href={`/agents?page=${pageNum}`}
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
              href={`/agents?page=${currentPage + 1}`}
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
    title: "مشاورین املاک | لیست مشاوران معتبر",
    description: "مشاهده لیست کامل مشاورین معتبر و متخصص املاک. ارتباط مستقیم با متخصصان حرفه‌ای در خرید، فروش و اجاره ملک.",
  };
}
