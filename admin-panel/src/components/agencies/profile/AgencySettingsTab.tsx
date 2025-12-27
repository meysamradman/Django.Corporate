import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import type { RealEstateAgency } from "@/types/real_estate/agency/realEstateAgency";
import type { AgencyFormData } from "@/types/real_estate/agency/realEstateAgency";

interface AgencySettingsTabProps {
    agency: RealEstateAgency;
    formData: AgencyFormData;
    handleInputChange: (field: string, value: any) => void;
}

export function AgencySettingsTab({
    agency,
}: AgencySettingsTabProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('fa-IR');
        } catch {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 mt-6">
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">اطلاعات سیستم</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-2">شناسه:</span>
                        <span className="font-medium mr-2">{agency.id}</span>
                    </div>
                    <div>
                        <span className="text-gray-2">شناسه عمومی:</span>
                        <span className="font-medium mr-2">{agency.public_id}</span>
                    </div>
                    <div>
                        <span className="text-gray-2">تاریخ ثبت:</span>
                        <span className="font-medium mr-2">{formatDate(agency.created_at)}</span>
                    </div>
                    {agency.updated_at && (
                        <div>
                            <span className="text-gray-2">آخرین به‌روزرسانی:</span>
                            <span className="font-medium mr-2">{formatDate(agency.updated_at)}</span>
                        </div>
                    )}
                    <div className="md:col-span-2">
                        <span className="text-gray-2">وضعیت:</span>
                        <Badge variant={agency.is_active ? "green" : "red"} className="mr-2">
                            {agency.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                        {agency.is_verified && (
                            <Badge variant="blue" className="mr-2">تأیید شده</Badge>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default AgencySettingsTab;
