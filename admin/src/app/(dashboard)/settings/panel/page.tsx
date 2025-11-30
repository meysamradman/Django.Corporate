"use client";

import React, { useRef } from 'react';
import { ProtectedButton } from '@/core/permissions';
import { Save, Loader2 } from 'lucide-react';
import PanelSettingsForm, { PanelSettingsFormRef } from './PanelSettingsForm';

export default function PanelSettingsPage() {
    const formRef = useRef<PanelSettingsFormRef>(null);

    return (
        <div className="space-y-6 pb-28 relative">
            <div className="flex items-center justify-between">
                <h1 className="page-title">تنظیمات پنل</h1>
            </div>
            <PanelSettingsForm ref={formRef} />
            
            {/* Sticky Save Buttons Footer */}
            <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
                <ProtectedButton 
                    onClick={() => formRef.current?.handleSubmit()}
                    permission="panel.manage"
                    size="lg"
                    disabled={formRef.current?.isSubmitting || !formRef.current?.hasChanges}
                >
                    {formRef.current?.isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            در حال ذخیره...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            ذخیره تغییرات
                        </>
                    )}
                </ProtectedButton>
            </div>
        </div>
    );
}
