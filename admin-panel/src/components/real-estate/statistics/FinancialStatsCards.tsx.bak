import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Skeleton } from "@/components/elements/Skeleton";
import { formatPrice, formatNumber } from "@/core/utils/commonFormat";
import { DollarSign, Wallet, ShoppingBag } from "lucide-react";

interface FinancialStatsCardsProps {
    data?: {
        total_sales_value: number;
        total_commissions: number;
        total_sold_properties: number;
    };
    isLoading?: boolean;
}

export function FinancialStatsCards({ data, isLoading }: FinancialStatsCardsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32 mb-1" />
                            <Skeleton className="h-3 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ارزش کل فروش‌ها</CardTitle>
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-mono">
                        {formatPrice(data?.total_sales_value || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        مجموع ارزش معاملات انجام شده
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">کل درآمد کمیسیون</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-mono text-blue-600">
                        {formatPrice(data?.total_commissions || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        سهم آژانس از معاملات
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">تعداد معاملات</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatNumber(data?.total_sold_properties || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        ملک فروخته شده تا امروز
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
