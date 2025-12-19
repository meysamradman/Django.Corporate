import React from "react";
import { FormFieldsSection } from "@/components/form-builder/FormFieldsSection";

export default function FormSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="page-title">تنظیمات فرم تماس</h1>
            </div>

            <FormFieldsSection />
        </div>
    );
}

