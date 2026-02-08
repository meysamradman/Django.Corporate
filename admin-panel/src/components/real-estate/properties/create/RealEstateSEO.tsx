import { SEOMetaFields } from "./seo/SEOMetaFields";
import { SEOSocialPreview } from "./seo/SEOSocialPreview";

interface SEOTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    propertyId?: number | string;
}

export default function RealEstateSEO({ formData, handleInputChange, editMode, propertyId }: SEOTabProps) {
    return (
        <div className="space-y-6">
            <SEOMetaFields
                formData={formData}
                handleInputChange={handleInputChange}
                editMode={editMode}
            />

            <SEOSocialPreview
                formData={formData}
                handleInputChange={handleInputChange}
                editMode={editMode}
                propertyId={propertyId}
            />
        </div>
    );
}

