import { Badge } from "@/components/elements/Badge";

export function StatusStaticBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="green">فعال</Badge>
      <Badge variant="yellow">پیش‌نویس</Badge>
      <Badge variant="red">غیرفعال</Badge>
    </div>
  );
}
