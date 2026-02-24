import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import type { Blog } from "@/types/blog/blog";
import { Badge } from "@/components/elements/Badge";
import { Eye, Globe, Smartphone, Heart, Activity } from "lucide-react";

interface BlogStatsProps {
    blog: Blog;
}

export function BlogStats({ blog }: BlogStatsProps) {
    const statusMap: Record<string, { label: string; variant: any }> = {
        published: { label: "منتشر شده", variant: "green" },
        draft: { label: "پیش‌نویس", variant: "yellow" },
    };
    const config = statusMap[blog.status] || { label: blog.status, variant: "gray" };

    return (
        <Card className="gap-0">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                    <span>آمار و وضعیت بازخورد</span>
                    <Badge variant={config.variant === "green" ? "green" : "yellow"}>{config.label}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-bg/40 border border-br/30 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
                    <Eye className="w-4 h-4 text-blue-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{blog.views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید کل</span>
                </div>

                <div className="p-4 rounded-xl bg-bg/40 border border-br/30 flex flex-col items-center gap-2 group hover:border-emerald-1/30 transition-all">
                    <Globe className="w-4 h-4 text-emerald-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{blog.web_views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید وب</span>
                </div>

                <div className="p-4 rounded-xl bg-bg/40 border border-br/30 flex flex-col items-center gap-2 group hover:border-purple-1/30 transition-all">
                    <Smartphone className="w-4 h-4 text-purple-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{blog.app_views_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید اپ</span>
                </div>

                <div className="p-4 rounded-xl bg-bg/40 border border-br/30 flex flex-col items-center gap-2 group hover:border-red-1/30 transition-all">
                    <Heart className="w-4 h-4 text-red-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{blog.favorites_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">علاقه‌مندی</span>
                </div>

                <div className="p-4 rounded-xl bg-bg/40 border border-br/30 flex flex-col items-center gap-2 group hover:border-orange-1/30 transition-all">
                    <Activity className="w-4 h-4 text-orange-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <span className="text-lg font-black text-font-p">{(blog as any).comments_count?.toLocaleString('fa-IR') || "۰"}</span>
                    <span className="text-[10px] font-bold text-font-s tracking-wider text-center">نظرات</span>
                </div>
            </div>
            </CardContent>
        </Card>
    );
}
