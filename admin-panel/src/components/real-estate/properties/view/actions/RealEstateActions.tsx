
import { useNavigate } from "react-router-dom";
import { Edit2, Printer, FileText } from "lucide-react";
import { Button } from "@/components/elements/Button";

interface RealEstateActionsProps {
    propertyId: string;
    onPrint: () => void;
    onPdf: () => void;
    isExportingPdf: boolean;
}

export function RealEstateActions({
    propertyId,
    onPrint,
    onPdf,
    isExportingPdf,
}: RealEstateActionsProps) {
    const navigate = useNavigate();

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="default"
                size="sm"
                className="gap-2 text-[11px] font-black bg-blue-1 hover:bg-blue-2 text-wt shadow-md shadow-blue-1/10 transition-all active:scale-95"
                onClick={() => navigate(`/real-estate/properties/${propertyId}/edit`)}
            >
                <Edit2 className="w-3.5 h-3.5" />
                ویرایش
            </Button>

            <div className="flex items-center gap-1.5 bg-bg/40 p-1 rounded-xl border border-br/40">
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-[10.5px] font-bold border-0 hover:bg-card bg-transparent rounded-lg text-font-s transition-all active:scale-95"
                    onClick={onPrint}
                >
                    <Printer className="w-3.5 h-3.5 opacity-70" />
                    چاپ
                </Button>
                <div className="w-px h-3.5 bg-br/60" />
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-[10.5px] font-bold border-0 hover:bg-card bg-transparent rounded-lg text-font-s transition-all active:scale-95"
                    onClick={onPdf}
                    isLoading={isExportingPdf}
                >
                    <FileText className="w-3.5 h-3.5 opacity-70" />
                    PDF
                </Button>
            </div>
        </div>
    );
}
