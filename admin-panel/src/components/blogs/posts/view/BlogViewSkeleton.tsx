import { Skeleton } from "@/components/elements/Skeleton";
import { Card } from "@/components/elements/Card";

export function BlogViewSkeleton() {
    return (
        <div className="relative flex flex-col gap-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-8 xl:col-span-9">
                    <Skeleton className="w-full h-[500px] rounded-2xl border border-br/30" />
                </div>
                <div className="lg:col-span-4 xl:col-span-3">
                    <Card className="h-full min-h-[500px] p-0 overflow-hidden bg-wt border-br/20">
                        <Skeleton className="h-14 w-full rounded-none" />
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                                ))}
                            </div>
                            <Skeleton className="h-24 w-full rounded-xl" />
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-full rounded-full" />
                                <Skeleton className="h-5 w-full rounded-full" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 items-start relative">
                <div className="flex-1 grid grid-cols-1 gap-8 w-full">
                    <Card className="p-6 h-96 border-br/20">
                        <div className="space-y-6">
                            <Skeleton className="h-6 w-32 rounded-full" />
                            <Skeleton className="h-4 w-full rounded-full" />
                            <Skeleton className="h-4 w-full rounded-full" />
                            <Skeleton className="h-4 w-3/4 rounded-full" />
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
                        <Card className="p-6 h-48 border-br/20">
                            <div className="grid grid-cols-5 gap-3">
                                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                            </div>
                        </Card>
                        <Card className="p-6 h-48 border-br/20">
                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                            </div>
                        </Card>
                    </div>

                    <Skeleton className="w-full h-32 rounded-2xl border border-br/20" />
                    <Skeleton className="w-full h-32 rounded-2xl border border-br/20" />
                </div>

                <div className="hidden xl:block w-16 h-[400px] sticky top-24 self-start rounded-full bg-wt border border-br/20 shadow-lg" />
            </div>
        </div>
    );
}

export default BlogViewSkeleton;
