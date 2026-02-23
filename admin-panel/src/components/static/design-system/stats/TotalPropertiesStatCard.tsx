import { Card } from "@/components/elements/Card";
import { Home } from "lucide-react";

export function TotalPropertiesStatCard() {
  return (
    <Card className="w-full max-w-90 justify-between gap-0 border-br bg-card px-5 py-4 shadow-none">
      <div className="flex items-start justify-between">
        <div className="flex size-9 items-center justify-center rounded-md bg-blue-0 text-blue-1">
          <Home className="size-4" />
        </div>
        <h3 className="text-base font-semibold text-font-p">کل املاک</h3>
      </div>

      <div className="mt-10 space-y-2 text-right">
        <p className="text-4xl font-bold leading-none text-font-p">1,250</p>
        <p className="text-sm text-font-s">تعداد کل املاک ثبت شده</p>
      </div>

      <div className="mt-4 h-1 w-full rounded-full bg-blue-1" />
    </Card>
  );
}
