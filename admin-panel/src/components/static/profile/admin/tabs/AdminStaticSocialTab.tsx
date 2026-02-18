import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Share2 } from "lucide-react";

interface AdminStaticSocialTabProps {
  isEditMode: boolean;
  instagram: string;
  telegram: string;
  whatsapp: string;
  linkedin: string;
  website: string;
  onChange: (field: string, value: string) => void;
}

export function AdminStaticSocialTab(props: AdminStaticSocialTabProps) {
  const { isEditMode, instagram, telegram, whatsapp, linkedin, website, onChange } = props;

  return (
    <CardWithIcon
      icon={Share2}
      title="شبکه‌های اجتماعی"
      iconBgColor="bg-pink"
      iconColor="stroke-pink-2"
      cardBorderColor="border-b-pink-1"
      className="gap-0"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="static-instagram">اینستاگرام</Label>
          <Input id="static-instagram" value={instagram} disabled={!isEditMode} onChange={(e) => onChange("instagram", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="static-telegram">تلگرام</Label>
          <Input id="static-telegram" value={telegram} disabled={!isEditMode} onChange={(e) => onChange("telegram", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="static-whatsapp">واتساپ</Label>
          <Input id="static-whatsapp" value={whatsapp} disabled={!isEditMode} onChange={(e) => onChange("whatsapp", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="static-linkedin">لینکدین</Label>
          <Input id="static-linkedin" value={linkedin} disabled={!isEditMode} onChange={(e) => onChange("linkedin", e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="static-website">وب‌سایت</Label>
          <Input id="static-website" value={website} disabled={!isEditMode} onChange={(e) => onChange("website", e.target.value)} />
        </div>
      </div>
    </CardWithIcon>
  );
}
