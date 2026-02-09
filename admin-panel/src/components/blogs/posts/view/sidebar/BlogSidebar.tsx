import { Card } from "@/components/elements/Card";
import type { Blog } from "@/types/blog/blog";
import { BlogActions } from "./BlogActions";
import { BlogStatus } from "./BlogStatus";
import { BlogIdentity } from "./BlogIdentity";

interface BlogSidebarProps {
    blog: Blog;
    onPrint?: () => void;
    onPdf?: () => void;
    isExportingPdf?: boolean;
}

export function BlogSidebar({
    blog,
    onPrint,
    onPdf,
    isExportingPdf = false
}: BlogSidebarProps) {
    return (
        <Card className="overflow-hidden gap-0">
            <BlogActions
                blogId={blog.id}
                onPrint={onPrint}
                onPdf={onPdf}
                isExportingPdf={isExportingPdf}
            />
            <BlogStatus blog={blog} />
            <BlogIdentity blog={blog} />
        </Card>
    );
}
