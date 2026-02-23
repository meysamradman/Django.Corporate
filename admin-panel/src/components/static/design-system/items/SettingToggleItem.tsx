import { Switch } from "@/components/elements/Switch";
import { MessageSquareText, Eye } from "lucide-react";

interface SettingToggleItemProps {
  title: string;
  checked: boolean;
  icon: "chat" | "eye";
}

function SettingToggleItem({ title, checked, icon }: SettingToggleItemProps) {
  const isChat = icon === "chat";
  const rowTone = checked ? "border-blue bg-blue" : "border-gray bg-gray";
  const iconTone = checked ? "bg-blue-0 text-blue-2" : "bg-gray-0 text-gray-2";
  const titleTone = checked ? "text-blue-2" : "text-gray-2";

  return (
    <div
      className={`w-full rounded-2xl border px-4 py-2.5 ${rowTone}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`flex size-9 items-center justify-center rounded-xl ${iconTone}`}>
          {isChat ? <MessageSquareText className="size-3.5" /> : <Eye className="size-3.5" />}
        </div>

        <h3 className={`text-right text-lg font-bold ${titleTone}`}>
          {title}
        </h3>

        <Switch checked={checked} />
      </div>
    </div>
  );
}

export function SettingToggleItemSamples() {
  return (
    <div className="w-full max-w-190 space-y-3">
      <SettingToggleItem title="مدیریت چت‌بات" checked={false} icon="chat" />
      <SettingToggleItem title="نمایش عمومی" checked={true} icon="eye" />
    </div>
  );
}
