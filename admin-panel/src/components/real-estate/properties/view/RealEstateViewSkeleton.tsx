import { Card } from "@/components/elements/Card";
import { Skeleton } from "@/components/elements/Skeleton";

export function RealEstateViewSkeleton() {
    return (
        <div className="relative flex flex-col gap-6 animate-pulse">
            {/* Header Skeleton */}
            <Card className="flex-row items-center justify-between gap-4 p-4 lg:px-6 py-4.5 border-br shadow-xs shrink-0 bg-card h-20">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-64 rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
            </Card>

            {/* Main Grid: Gallery/CRM + Location */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-8 xl:col-span-9 space-y-5">
                    {/* Gallery Skeleton */}
                    <Skeleton className="w-full h-[400px] rounded-2xl" />

                    {/* CRM Skeleton */}
                    <Card className="p-4 border-br shadow-sm bg-card">
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 xl:col-span-3">
                    {/* Location Map Skeleton */}
                    <Card className="h-full min-h-[400px] overflow-hidden border-br shadow-2xl bg-card p-0">
                        <Skeleton className="w-full h-full" />
                    </Card>
                </div>
            </div>

            {/* Content Grid: Overview + Sidebar */}
            <div className="flex flex-col xl:flex-row gap-6 items-start relative min-w-0">
                <div className="flex-1 grid grid-cols-1 gap-6 min-w-0 w-full">
                    {/* Details Cards Skeletons */}
                    <Card className="h-80 border-br shadow-sm bg-card p-6 gap-6">
                        <Skeleton className="h-6 w-40 mb-6" />
                        <div className="grid grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    </Card>

                    {/* Stats/Media Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-40 rounded-2xl" />
                        <Skeleton className="h-40 rounded-2xl" />
                    </div>

                    {/* Description Skeleton */}
                    <Card className="h-60 border-br shadow-sm bg-card p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </Card>
                </div>

                {/* Navigation Sidebar Skeleton */}
                <aside className="hidden xl:block w-16 sticky top-24 self-start flex-none space-y-4">
                    <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                    <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                    <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                    <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                    <Skeleton className="w-12 h-12 rounded-full mx-auto" />
                </aside>
            </div>
        </div>
    );
}
