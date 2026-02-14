
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Printer, FileText, BadgeCheck } from "lucide-react";
import { Button } from "@/components/elements/Button";
import type { Property } from "@/types/real_estate/realEstate";
import { FinalizeDealDialog } from "./FinalizeDealDialog";

interface RealEstateActionsProps {
    property: Property;
    propertyId: string;
    onPrint: () => void;
    onPdf: () => void;
    isExportingPdf: boolean;
    onFinalized?: () => void;
}

export function RealEstateActions({
    property,
    propertyId,
    onPrint,
    onPdf,
    isExportingPdf,
    onFinalized,
}: RealEstateActionsProps) {
    const navigate = useNavigate();
    const [openFinalizeDialog, setOpenFinalizeDialog] = useState(false);
    const isClosed = property.status === "sold" || property.status === "rented";

    return (
        <>
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

                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-[11px] font-black border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => setOpenFinalizeDialog(true)}
                    disabled={isClosed}
                >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {isClosed ? "معامله نهایی شده" : "نهایی‌سازی معامله"}
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

            <FinalizeDealDialog
                open={openFinalizeDialog}
                onOpenChange={setOpenFinalizeDialog}
                property={property}
                onSuccess={onFinalized}
            />
        </>
    );
}
