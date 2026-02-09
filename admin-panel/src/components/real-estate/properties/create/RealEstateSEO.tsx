
import { RealEstateSEOMetaFields } from "./seo/RealEstateSEOMetaFields";
import { RealEstateSEOSocialPreview } from "./seo/RealEstateSEOSocialPreview";

interface SEOTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    propertyId?: number | string;
}

export default function RealEstateSEO({ formData, handleInputChange, editMode, propertyId }: SEOTabProps) {
    return (
        <div className="space-y-6">
            <RealEstateSEOMetaFields
                formData={formData}
                handleInputChange={handleInputChange}
                editMode={editMode}
            />

            <RealEstateSEOSocialPreview
                formData={formData}
                handleInputChange={handleInputChange}
                editMode={editMode}
                propertyId={propertyId}
            />
        </div>
    );
}

export { RealEstateSEO };

