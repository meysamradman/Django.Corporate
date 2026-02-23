import { CardContent } from "@/components/elements/Card";
import type { Blog } from "@/types/blog/blog";
import { Link as LinkIcon, Clock } from "lucide-react";
import { TruncatedText } from "@/components/elements/TruncatedText";

interface BlogIdentityProps {
    blog: Blog;
}

export function BlogIdentity({ blog }: BlogIdentityProps) {
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
        <>
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

            <CardContent className="p-6">
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
        </>
    );
}
