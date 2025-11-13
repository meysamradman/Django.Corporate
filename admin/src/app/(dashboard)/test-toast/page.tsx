"use client";

import React from "react";
import { Button } from "@/components/elements/Button";
import { toast } from "@/components/elements/Sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";

export default function TestToastPage() {
    const handleSuccessToast = () => {
        toast.success("این یک پیام موفقیت است");
    };

    const handleErrorToast = () => {
        toast.error("این یک پیام خطا است");
    };

    const handleWarningToast = () => {
        toast.warning("این یک پیام هشدار است");
    };

    const handleInfoToast = () => {
        toast.info("این یک پیام اطلاعاتی است");
    };

    const handleLoadingToast = () => {
        toast.loading("در حال بارگذاری...");
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>تست Toast Messages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">انواع Toast:</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button 
                                    onClick={handleSuccessToast}
                                    className="bg-green-100 text-white hover:bg-green-100"
                                >
                                    نمایش Success Toast
                                </Button>
                                
                                <Button 
                                    onClick={handleErrorToast}
                                    className="bg-red-100 text-white hover:bg-red-100"
                                >
                                    نمایش Error Toast
                                </Button>
                                
                                <Button 
                                    onClick={handleWarningToast}
                                    className="bg-amber-100 text-white hover:bg-amber-100"
                                >
                                    نمایش Warning Toast
                                </Button>
                                
                                <Button 
                                    onClick={handleInfoToast}
                                    className="bg-primary text-white hover:bg-primary"
                                >
                                    نمایش Info Toast
                                </Button>
                                
                                <Button 
                                    onClick={handleLoadingToast}
                                    variant="outline"
                                    className="col-span-2"
                                >
                                    نمایش Loading Toast
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-bg rounded-lg border">
                            <h4 className="font-semibold mb-2">رنگ‌های استفاده شده از Theme:</h4>
                            <ul className="space-y-1 text-sm text-font-s">
                                <li>
                                    <span className="inline-block w-4 h-4 rounded bg-green-100 mr-2"></span>
                                    Success: <code className="text-xs">--green-100 (#10B981)</code>
                                </li>
                                <li>
                                    <span className="inline-block w-4 h-4 rounded bg-red-100 mr-2"></span>
                                    Error: <code className="text-xs">--red-100 (#DC2626)</code>
                                </li>
                                <li>
                                    <span className="inline-block w-4 h-4 rounded bg-amber-100 mr-2"></span>
                                    Warning: <code className="text-xs">--amber-100 (#F59E0B)</code>
                                </li>
                                <li>
                                    <span className="inline-block w-4 h-4 rounded bg-primary mr-2"></span>
                                    Info: <code className="text-xs">--primary (#1379f0)</code>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

