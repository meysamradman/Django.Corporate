import { Badge } from "@/components/elements/Badge";

export function BadgesShowcase() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">Default</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="green">فعال</Badge>
        <Badge variant="yellow">در انتظار</Badge>
        <Badge variant="red">غیرفعال</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="blue">اطلاعات</Badge>
        <Badge variant="purple">ویژه</Badge>
        <Badge variant="orange">هشدار</Badge>
        <Badge variant="pink">جدید</Badge>
        <Badge variant="gray">آرشیو</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="teal">Teal</Badge>
        <Badge variant="indigo">Indigo</Badge>
        <Badge variant="amber">Amber</Badge>
        <Badge variant="emerald">Emerald</Badge>
      </div>
    </div>
  );
}
