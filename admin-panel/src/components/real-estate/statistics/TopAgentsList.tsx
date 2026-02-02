import { Avatar, AvatarFallback, AvatarImage } from "@/components/elements/Avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Skeleton } from "@/components/elements/Skeleton";
import { formatNumber, formatPrice } from "@/core/utils/commonFormat";
import { Trophy, Star, TrendingUp } from "lucide-react";

interface Agent {
    id: number;
    name: string;
    avatar: string | null;
    rating: number;
    total_sales: number;
    total_commissions: number;
    sold_count: number;
}

interface TopAgentsListProps {
    agents?: Agent[];
    isLoading?: boolean;
}

export function TopAgentsList({ agents, isLoading }: TopAgentsListProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!agents || agents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        برترین مشاورین
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 text-font-s">
                    هنوز داده‌ای برای نمایش وجود ندارد
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    برترین مشاورین (کل دوران)
                </CardTitle>
                <CardDescription>
                    رده‌بندی بر اساس ارزش کل فروش
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {agents.map((agent, index) => (
                    <div key={agent.id} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-bg shadow-sm group-hover:border-primary transition-colors">
                                    <AvatarImage src={agent.avatar || ""} />
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {agent.name.slice(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                {index < 3 && (
                                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white
                        ${index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : 'bg-amber-700'}
                    `}>
                                        {index + 1}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-font-p group-hover:text-primary transition-colors">{agent.name}</p>
                                <div className="flex items-center gap-3 text-xs text-font-s mt-1">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        <span>{agent.rating.toFixed(1)}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-border" />
                                    <span>{agent.sold_count} فروش</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-font-p">
                                {formatPrice(agent.total_sales)}
                            </div>
                            <div className="text-xs text-green-600 flex items-center justify-end gap-1 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                {formatPrice(agent.total_commissions)} کمیسیون
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
