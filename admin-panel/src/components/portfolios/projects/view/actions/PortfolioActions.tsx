
import { Button } from "@/components/elements/Button";
import { Edit2, Printer, FileDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PortfolioActionsProps {
    portfolioId: string | number;
    onPrint?: () => void;
    onPdf?: () => void;
    isExportingPdf?: boolean;
}

export function PortfolioActions({
    portfolioId,
    onPrint,
    onPdf,
    isExportingPdf = false,
}: PortfolioActionsProps) {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-2 lg:gap-3">
            <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-2.5 h-10 px-5 border-br/60 hover:border-primary/30 hover:bg-primary/5 text-font-p font-black text-[11px] transition-all"
                onClick={onPrint}
            >
                <Printer className="w-4 h-4 text-font-s" />
                چاپ جزئیات
            </Button>

            <Button
                variant="outline"
                size="sm"
                className="flex gap-2.5 h-10 px-5 border-br/60 hover:border-primary/30 hover:bg-primary/5 text-font-p font-black text-[11px] transition-all"
                disabled={isExportingPdf}
                onClick={onPdf}
            >
                {isExportingPdf ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <FileDown className="w-4 h-4 text-font-s" />
                )}
                خروجی PDF
            </Button>

            <div className="w-px h-6 bg-br/40 mx-1 hidden sm:block" />

            <Button
                variant="default"
                size="sm"
                className="flex gap-2.5 h-10 px-6 bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 text-wt font-black text-[11px] transition-all group"
                onClick={() => navigate(`/portfolios/${portfolioId}/edit`)}
            >
                <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                ویرایش پروژه
            </Button>
        </div>
    );
}
