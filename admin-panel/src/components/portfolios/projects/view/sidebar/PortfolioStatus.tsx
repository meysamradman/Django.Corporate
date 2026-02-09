import { CardContent } from "@/components/elements/Card";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { CheckCircle2, XCircle, Star, Zap, Globe } from "lucide-react";

interface PortfolioStatusProps {
    portfolio: Portfolio;
}

export function PortfolioStatus({ portfolio }: PortfolioStatusProps) {
    return (
        <CardContent className="p-6 border-b bg-wt/50">
            <div className="grid grid-cols-2 gap-3">
                <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${portfolio.is_public ? "bg-blue" : "bg-gray"}`}>
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${portfolio.is_public ? "bg-blue-0" : "bg-gray-0"}`}>
                        <Globe className={`w-4 h-4 ${portfolio.is_public ? "stroke-blue-2" : "stroke-gray-1"}`} />
                    </div>
                    <span className={`text-sm font-medium ${portfolio.is_public ? "text-blue-2" : "text-gray-1"}`}>
                        {portfolio.is_public ? "عمومی" : "غیرعمومی"}
                    </span>
                </div>

                <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${portfolio.is_active ? "bg-blue" : "bg-red"}`}>
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${portfolio.is_active ? "bg-blue-0" : "bg-red-0"}`}>
                        <Zap className={`w-4 h-4 ${portfolio.is_active ? "stroke-blue-2" : "stroke-red-2"}`} />
                    </div>
                    <span className={`text-sm font-medium ${portfolio.is_active ? "text-blue-2" : "text-red-2"}`}>
                        {portfolio.is_active ? "فعال" : "غیرفعال"}
                    </span>
                </div>

                <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${portfolio.is_featured ? "bg-orange" : "bg-gray"}`}>
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${portfolio.is_featured ? "bg-orange-0" : "bg-gray-0"}`}>
                        <Star className={`w-4 h-4 ${portfolio.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"}`} />
                    </div>
                    <span className={`text-sm font-medium ${portfolio.is_featured ? "text-orange-2" : "text-gray-1"}`}>
                        {portfolio.is_featured ? "ویژه" : "عادی"}
                    </span>
                </div>

                <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${portfolio.status === "published" ? "bg-green" : "bg-yellow"}`}>
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${portfolio.status === "published" ? "bg-green-0" : "bg-yellow-0"}`}>
                        {portfolio.status === "published" ? (
                            <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                        ) : (
                            <XCircle className="w-4 h-4 stroke-yellow-2" />
                        )}
                    </div>
                    <span className={`text-sm font-medium ${portfolio.status === "published" ? "text-green-2" : "text-yellow-2"}`}>
                        {portfolio.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                    </span>
                </div>
            </div>
        </CardContent>
    );
}
