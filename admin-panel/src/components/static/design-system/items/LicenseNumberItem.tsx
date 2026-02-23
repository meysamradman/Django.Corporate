import { FileDigit } from "lucide-react";
import { InfoItem } from "@/components/static/agent/profile/InfoItem";

export function LicenseNumberItem() {
  return (
    <div className="w-full max-w-190">
      <InfoItem label="شماره پروانه" value="23434324" dir="ltr" icon={FileDigit} />
    </div>
  );
}
