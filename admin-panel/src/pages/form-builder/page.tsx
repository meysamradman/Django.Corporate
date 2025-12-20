import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { FormFieldsSection } from "@/components/form-builder/FormFieldsSection";

export default function FormSettingsPage() {
    return (
        <div className="space-y-6">
            <PageHeader title="تنظیمات فرم تماس" />

            <FormFieldsSection />
        </div>
    );
}

