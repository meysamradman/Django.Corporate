"use client";

import React from 'react';
import PanelSettingsForm from './PanelSettingsForm';

export default function PanelSettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="page-title">تنظیمات پنل</h1>
            </div>
            <PanelSettingsForm />
        </div>
    );
}

