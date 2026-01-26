import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import type { AgencyFormData } from "@/types/real_estate/agency/realEstateAgency";

interface AgencySEOTabProps {
    formData: AgencyFormData;
    editMode: boolean;
    handleInputChange: (field: string, value: string) => void;
}

export function AgencySEO({
    formData: _formData,
    editMode: _editMode,
    handleInputChange: _handleInputChange,
}: AgencySEOTabProps) {
    return (
        <div className="space-y-6 mt-6">
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">تنظیمات سئو</h3>
                <p className="text-sm text-gray-2 mb-4">این بخش فعلاً غیرفعال است</p>
                <div className="grid grid-cols-1 gap-6 opacity-50">
                    <div>
                        <label className="block text-sm font-medium mb-2">عنوان متا</label>
                        <Input disabled placeholder="عنوان متا" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">توضیحات متا</label>
                        <Textarea disabled placeholder="توضیحات متا" rows={3} />
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default AgencySEO;
