import { DialogClose } from '@/components/elements/Dialog';
import { Button } from '@/components/elements/Button';
import { Upload, X } from 'lucide-react';

export function MediaUploadModalHeader() {
    return (
        <div className="bg-linear-to-r from-bg/80 to-bg/50 border-b px-6 py-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-font-p">آپلود رسانه</h3>
                </div>
                <div className="flex items-center">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-pointer hover:bg-font-s/10 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogClose>
                </div>
            </div>
        </div>
    );
}