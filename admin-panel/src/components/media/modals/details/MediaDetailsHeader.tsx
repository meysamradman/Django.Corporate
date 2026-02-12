import { Button } from '@/components/elements/Button';
import { X } from 'lucide-react';

interface MediaDetailsHeaderProps {
    title: string;
    icon: React.ReactNode;
    onClose: () => void;
}

export function MediaDetailsHeader({ title, icon, onClose }: MediaDetailsHeaderProps) {
    return (
        <div className="bg-bg/50 border-b px-6 py-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 cursor-pointer hover:bg-font-s/10"
                    aria-label="بستن"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}