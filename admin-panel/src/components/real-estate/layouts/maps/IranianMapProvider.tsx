import type { MapProviderProps } from "@/types/real_estate/mapProvider";

export interface IranianMapProviderProps extends MapProviderProps {
    type: 'neshan' | 'cedarmaps';
}

export default function IranianMapProvider({
    latitude,
    longitude,
    type,
    apiKey
}: IranianMapProviderProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-center p-8">
            <div className="p-4 rounded-full bg-blue/10 mb-4">
                <span className="text-2xl font-bold text-blue tracking-tighter capitalize">{type}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{type === 'neshan' ? 'نقشه نشان' : 'نقشه سیدار'}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
                این سرویس نقشه ایرانی آماده پیاده‌سازی است. کلید API: {apiKey ? 'موجود' : 'تایید نشده'}
            </p>
            {latitude && longitude && (
                <div className="mt-4 p-2 bg-bg rounded border text-xs">
                    موقعیت انتخاب شده: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </div>
            )}
        </div>
    );
}
