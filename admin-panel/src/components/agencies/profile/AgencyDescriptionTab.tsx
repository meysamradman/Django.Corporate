import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { Textarea } from "@/components/elements/Textarea";
import { FileText } from "lucide-react";
import type { AgencyFormData } from "@/types/real_estate/agency/realEstateAgency";

interface AgencyDescriptionTabProps {
    formData: AgencyFormData;
    editMode: boolean;
    handleInputChange: (field: string, value: string) => void;
    handleSaveProfile: () => void;
    isSaving?: boolean;
}

export function AgencyDescriptionTab({
    formData,
    editMode,
    handleInputChange,
    handleSaveProfile,
    isSaving = false,
}: AgencyDescriptionTabProps) {
    return (
        <div className="space-y-6 mt-6">
            <CardWithIcon
                icon={FileText}
                title="توضیحات آژانس"
                titleExtra={
                    editMode && (
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving ? "در حال ذخیره..." : "ذخیره"}
                            </Button>
                        </div>
                    )
                }
            >
                <div className="space-y-4">
                    <Textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="توضیحات کامل در مورد آژانس..."
                        rows={10}
                        disabled={!editMode}
                    />
                </div>
            </CardWithIcon>
        </div>
    );
}

export default AgencyDescriptionTab;
