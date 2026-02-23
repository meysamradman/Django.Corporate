
import { FileText, Download } from "lucide-react";
import { Item, ItemContent, ItemTitle } from "@/components/elements/Item";
import { Button } from "@/components/elements/Button";
import { cn } from "@/core/utils/cn";

interface DocumentItemProps {
    title?: string;
    fileUrl?: string;
    fileSize?: number;
    downloadUrl: string;
    className?: string;
}

export function DocumentItem({
    title = 'سند پیوست',
    fileUrl = '',
    fileSize,
    downloadUrl,
    className,
}: DocumentItemProps) {
    const fileIcon = <FileText className="size-5 text-red-1" />;

    const formatSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    const extension = fileUrl.split('.').pop() || 'FILE';

    return (
        <Item className={cn("p-3 border-br/40 bg-bg/40 hover:bg-wt hover:border-purple-1/30 transition-smooth group/d-item flex-nowrap rounded-xl", className)}>
            <div className="size-11 rounded-lg bg-wt flex items-center justify-center border border-br/30 group-hover/d-item:scale-105 transition-transform shadow-xs">
                {fileIcon}
            </div>
            <ItemContent className="p-0 flex-1 min-w-0 mr-3">
                <ItemTitle className="text-[12px] font-black text-font-p truncate">
                    {title}
                </ItemTitle>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-font-s/60">{formatSize(fileSize)}</span>
                    <div className="size-1 rounded-full bg-purple-1/20" />
                    <span className="text-[10px] font-black text-purple-1/70 uppercase">{extension}</span>
                </div>
            </ItemContent>
            <Button variant="outline" size="icon" className="size-8.5 text-font-s hover:bg-purple-0/40 hover:text-purple-1 rounded-lg shrink-0 transition-colors" asChild>
                <a href={downloadUrl} target="_blank" rel="noreferrer">
                    <Download className="size-4" />
                </a>
            </Button>
        </Item>
    );
}
