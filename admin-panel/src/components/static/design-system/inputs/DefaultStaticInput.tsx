import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";

export function DefaultStaticInput() {
  return (
    <div className="w-full max-w-90 space-y-2">
      <Label htmlFor="static-title">عنوان</Label>
      <Input id="static-title" placeholder="عنوان را وارد کنید" />
    </div>
  );
}
