
import { Skeleton } from "@/components/elements/Skeleton";
import { Card } from "@/components/elements/Card";

export function PortfolioViewSkeleton() {
    return (
        <div className="relative flex flex-col gap-6 animate-pulse">
            {/* Header Skeleton */}
            <Card className="flex-row items-center justify-between gap-4 p-4 lg:px-6 py-4.5 bg-card border-br shadow-xs h-24">
                <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <Skeleton className="h-8 w-64 rounded-lg" />
                    <Skeleton className="h-3 w-48 rounded-full" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-11 w-28 rounded-xl" />
                    <Skeleton className="h-11 w-32 rounded-xl" />
                </div>
            </Card>

            {/* Gallery Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-8 xl:col-span-9">
                    <Skeleton className="w-full h-[500px] rounded-2xl border border-br" />
                </div>
                <div className="lg:col-span-4 xl:col-span-3">
                    <Skeleton className="w-full h-full min-h-[500px] rounded-2xl border border-br" />
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex flex-col xl:flex-row gap-6 items-start">
                <div className="flex-1 space-y-6 w-full">
                    <Skeleton className="w-full h-64 rounded-2xl border border-br" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-20 w-full rounded-2xl border border-br" />
                        ))}
                    </div>
                </div>
                <div className="hidden xl:block w-16 h-96 sticky top-24 rounded-full bg-card border border-br shadow-lg" />
            </div>
        </div>
    );
}

export default PortfolioViewSkeleton;
