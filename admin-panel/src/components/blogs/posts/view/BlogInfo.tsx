import { Card, CardContent } from "@/components/elements/Card";
import type { Blog } from "@/types/blog/blog";
import {
    CheckCircle2,
    XCircle,
    Star,
    Zap,
    Globe,
    Link as LinkIcon,
    Clock
} from "lucide-react";
import { TruncatedText } from "@/components/elements/TruncatedText";

interface BlogBasicInfoProps {
    blog: Blog;
}

export function BlogInfo({ blog }: BlogBasicInfoProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return "نامشخص";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(date);
    };

    return (
        <Card className="overflow-hidden gap-0">
            <CardContent className="p-6 border-b bg-wt/50">
                <div className="grid grid-cols-2 gap-3">
                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${blog.is_public ? "bg-blue" : "bg-gray"}`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${blog.is_public ? "bg-blue-0" : "bg-gray-0"}`}>
                            <Globe className={`w-4 h-4 ${blog.is_public ? "stroke-blue-2" : "stroke-gray-1"}`} />
                        </div>
                        <span className={`text-sm font-medium ${blog.is_public ? "text-blue-2" : "text-gray-1"}`}>
                            {blog.is_public ? "عمومی" : "غیرعمومی"}
                        </span>
                    </div>

                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${blog.is_active ? "bg-blue" : "bg-red"}`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${blog.is_active ? "bg-blue-0" : "bg-red-0"}`}>
                            <Zap className={`w-4 h-4 ${blog.is_active ? "stroke-blue-2" : "stroke-red-2"}`} />
                        </div>
                        <span className={`text-sm font-medium ${blog.is_active ? "text-blue-2" : "text-red-2"}`}>
                            {blog.is_active ? "فعال" : "غیرفعال"}
                        </span>
                    </div>

                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${blog.is_featured ? "bg-orange" : "bg-gray"}`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${blog.is_featured ? "bg-orange-0" : "bg-gray-0"}`}>
                            <Star className={`w-4 h-4 ${blog.is_featured ? "stroke-orange-2 fill-orange-2" : "stroke-gray-1"}`} />
                        </div>
                        <span className={`text-sm font-medium ${blog.is_featured ? "text-orange-2" : "text-gray-1"}`}>
                            {blog.is_featured ? "ویژه" : "عادی"}
                        </span>
                    </div>

                    <div className={`flex flex-col items-center justify-center py-4 px-3 rounded-lg transition-colors ${blog.status === "published" ? "bg-green" : "bg-yellow"}`}>
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 ${blog.status === "published" ? "bg-green-0" : "bg-yellow-0"}`}>
                            {blog.status === "published" ? (
                                <CheckCircle2 className="w-4 h-4 stroke-green-2" />
                            ) : (
                                <XCircle className="w-4 h-4 stroke-yellow-2" />
                            )}
                        </div>
                        <span className={`text-sm font-medium ${blog.status === "published" ? "text-green-2" : "text-yellow-2"}`}>
                            {blog.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardContent className="p-6 border-b">
                <div className="bg-bg rounded-xl overflow-hidden border border-br/30">
                    <div className="p-5">
                        <h3 className="text-font-p font-bold text-lg leading-tight mb-2">
                            <TruncatedText
                                text={blog.title}
                                maxLength={50}
                            />
                        </h3>
                        <span className="text-font-s text-xs opacity-70">#{blog.id}</span>
                    </div>
                </div>
            </CardContent>

            <CardContent className="p-6 border-b">
                <div className="space-y-0 [&>div:not(:last-child)]:border-b [&>div:not(:last-child)]:border-br">
                    <div className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-font-s shrink-0" />
                            <label className="text-font-s text-sm">نامک:</label>
                        </div>
                        <div className="flex-1 ms-2 text-left min-w-0 overflow-hidden">
                            <TruncatedText
                                text={blog.slug || "-"}
                                maxLength={35}
                                className="font-mono text-font-p text-sm"
                            />
                        </div>
                    </div>

                    {blog.created_at && (
                        <div className="flex items-center justify-between gap-3 pt-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-font-s shrink-0" />
                                <label className="text-font-s text-sm">تاریخ ایجاد:</label>
                            </div>
                            <p className="text-font-p text-sm font-medium text-left">
                                {formatDate(blog.created_at)}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
