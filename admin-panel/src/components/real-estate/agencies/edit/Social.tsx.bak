import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Share2 } from "lucide-react";
import { SocialMediaArrayEditor } from "@/components/shared/SocialMediaArrayEditor";
import type { SocialMediaItem } from "@/types/shared/socialMedia";

interface SocialProps {
  items: SocialMediaItem[];
  onChange: (items: SocialMediaItem[]) => void;
}

export default function Social({ items, onChange }: SocialProps) {
  return (
    <CardWithIcon
      icon={Share2}
      title="شبکه‌های اجتماعی"
      iconBgColor="bg-purple"
      iconColor="stroke-purple-2"
      cardBorderColor="border-b-purple-1"
    >
      <SocialMediaArrayEditor items={items} onChange={onChange} />
    </CardWithIcon>
  );
}
