"use client";

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/elements/Dialog';

interface ConfirmationDialogProps {
    open: boolean;
    activeModelName: string;
    newModelName: string;
    onConfirm: () => void;
    onClose: () => void;
}

export function ConfirmationDialog({
    open,
    activeModelName,
    newModelName,
    onConfirm,
    onClose,
}: ConfirmationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow/10">
                            <AlertTriangle className="h-6 w-6 text-yellow-1" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-right">تغییر مدل فعال</DialogTitle>
                            <DialogDescription className="text-right">
                                آیا از تغییر مدل فعال اطمینان دارید؟
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="rounded-lg bg-bg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-2 h-2 rounded-full bg-red-1"></div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-font-p mb-1">مدل فعلی (غیرفعال می‌شود):</p>
                                <p className="text-sm text-font-s">{activeModelName}</p>
                            </div>
                        </div>
                        
                        <div className="border-t border-border pt-3">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-green-1"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-font-p mb-1">مدل جدید (فعال می‌شود):</p>
                                    <p className="text-sm text-font-s">{newModelName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-sm text-font-s text-center">
                        با فعال کردن این مدل، مدل قبلی به صورت خودکار غیرفعال خواهد شد.
                    </p>
                </div>
                
                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        انصراف
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        onClick={onConfirm}
                        className="bg-green-1 hover:bg-green-2"
                    >
                        تایید و فعال‌سازی
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
