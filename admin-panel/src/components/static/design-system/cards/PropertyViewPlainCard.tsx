import { Card } from "@/components/elements/Card";

export function PropertyViewPlainCard() {
  return (
    <Card className="overflow-hidden border-br shadow-3xs bg-card ring-1 ring-br">
      <div className="p-4">
        <div className="mb-2 text-sm font-bold text-font-p">Card ساده (الگوی View ملک)</div>
        <p className="text-sm text-font-s">این نمونه بر اساس الگوی card ساده در صفحه view ملک ساخته شده است.</p>
      </div>
    </Card>
  );
}
