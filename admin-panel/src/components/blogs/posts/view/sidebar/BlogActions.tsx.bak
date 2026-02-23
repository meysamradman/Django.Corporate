import { useNavigate } from "react-router-dom";
import { CardContent } from "@/components/elements/Card";
import { Button } from "@/components/elements/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/elements/Tooltip";
import { Printer, FileDown, Edit2, Loader2 } from "lucide-react";

interface BlogActionsProps {
    blogId: string | number;
    onPrint?: () => void;
    onPdf?: () => void;
    isExportingPdf?: boolean;
}

export function BlogActions({
    blogId,
    onPrint,
    onPdf,
    isExportingPdf = false
}: BlogActionsProps) {
    const navigate = useNavigate();

    return (
        <CardContent className="p-3 border-b bg-bg/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9 text-font-s hover:text-blue-1 hover:bg-blue-0/50 rounded-xl border-dashed border-br/60"
                                onClick={onPrint}
                            >
                                <Printer className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-[10px] font-black">چاپ جزئیات</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9 text-font-s hover:text-red-1 hover:bg-red-0/50 rounded-xl border-dashed border-br/60"
                                disabled={isExportingPdf}
                                onClick={onPdf}
                            >
                                {isExportingPdf ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <FileDown className="w-4 h-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-[10px] font-black">خروجی PDF</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 gap-2 text-[10px] font-black text-blue-1 bg-blue-0/50 hover:bg-blue-0 hover:text-blue-2 rounded-xl border-dashed border-br/60"
                onClick={() => navigate(`/blogs/${blogId}/edit`)}
            >
                <Edit2 className="w-3.5 h-3.5" />
                ویرایش
            </Button>
        </CardContent>
    );
}
