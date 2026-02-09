import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Blog } from "@/types/blog/blog";
import { FileText } from "lucide-react";
import { ReadMore } from "@/components/elements/ReadMore";

interface BlogDescriptionsProps {
    blog: Blog;
}

export function BlogDescriptions({ blog }: BlogDescriptionsProps) {
    return (
        <CardWithIcon
            icon={FileText}
            title="توضیحات و جزئیات تکمیلی"
            iconBgColor="bg-orange"
            iconColor="stroke-orange-2"
            cardBorderColor="border-b-orange-1"
        >
            <div className="flex flex-col gap-6">
                <div>
                    <label className="text-[10px] font-black text-font-s tracking-widest uppercase mb-3 block opacity-40">
                        توضیحات کوتاه
                    </label>
                    <div className="text-sm text-font-p border-r-2 border-orange-1/30 pr-4 leading-relaxed">
                        {blog.short_description || "توضیحی وارد نشده است"}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-font-s tracking-widest uppercase mb-3 block opacity-40">
                        محتوای کامل
                    </label>
                    <div className="text-sm text-font-p bg-bg/40 rounded-2xl overflow-hidden leading-loose border border-br/30 shadow-inner">
                        {blog.description ? (
                            <div className="p-6">
                                <ReadMore content={blog.description} isHTML={true} maxHeight="400px" />
                            </div>
                        ) : (
                            <div className="p-10 text-font-s italic text-center opacity-40 flex flex-col items-center gap-4">
                                <FileText className="size-10 opacity-20" />
                                <div className="space-y-1">
                                    <p className="font-bold text-sm">محتوایی ثبت نشده است</p>
                                    <p className="text-[10px]">هیچ محتوای تکمیلی برای این وبلاگ در سیستم موجود نیست.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </CardWithIcon>
    );
}
