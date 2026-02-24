
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { FileJson } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface PortfolioAttributesProps {
    portfolio: Portfolio;
}

export function PortfolioAttributes({ portfolio }: PortfolioAttributesProps) {
    const extraAttributes = portfolio.extra_attributes || {};
    const attributesEntries = Object.entries(extraAttributes);

    return (
        <Card className="gap-0">
            <CardHeader className="border-b">
                <CardTitle>مشخصات فنی و ویژگی‌های اضافی</CardTitle>
            </CardHeader>
            <CardContent>
            {attributesEntries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {attributesEntries.map(([key, value], idx) => (
                        <div key={idx} className="flex flex-col gap-1.5 p-4 rounded-2xl bg-bg border border-br/50 hover:border-indigo-1/30 transition-all group">
                            <span className="text-[10px] font-black text-font-s tracking-widest opacity-50 uppercase group-hover:opacity-100 transition-opacity">
                                {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm font-black text-font-p">
                                {String(value)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="ویژگی ثبت نشده"
                    description="هیچ فیلد اضافی یا مشخصات فنی برای این پروژه تعریف نشده است"
                    icon={FileJson}
                    size="sm"
                    fullBleed={true}
                />
            )}
            </CardContent>
        </Card>
    );
}
