import { useSearchParams } from "react-router-dom";
import { FormFieldsSection } from "@/components/form-builder/FormFieldsSection";
import { FormFieldSide } from "@/components/form-builder/FormFieldSide";

export default function FormSettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const action = searchParams.get("action");
    const editId = searchParams.get("id") ? parseInt(searchParams.get("id")!) : null;

    const handleCloseSide = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("action");
        newParams.delete("id");
        setSearchParams(newParams);
    };

    return (
        <div className="space-y-6">
            <FormFieldsSection />

            <FormFieldSide
                isOpen={action === "create-field" || action === "edit-field"}
                onClose={handleCloseSide}
                editId={action === "edit-field" ? editId : null}
            />
        </div>
    );
}
