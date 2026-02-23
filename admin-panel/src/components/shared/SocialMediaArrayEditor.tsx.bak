import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { ImageSelector } from "@/components/media/selectors/ImageSelector";
import type { SocialMediaItem } from "@/types/shared/socialMedia";
import type { Media } from "@/types/shared/media";
import { Plus, Trash2 } from "lucide-react";

interface SocialMediaArrayEditorProps {
  items: SocialMediaItem[];
  onChange: (items: SocialMediaItem[]) => void;
  canEdit?: boolean;
}

const createEmptyItem = (order: number): SocialMediaItem => ({
  name: "",
  url: "",
  icon: null,
  icon_data: null,
  order,
});

const resolveIconMedia = (item: SocialMediaItem): Media | null => {
  if (item.icon_data) {
    return item.icon_data;
  }

  if (item.icon_url) {
    return {
      id: item.icon ?? 0,
      public_id: item.public_id || `social-icon-${item.icon ?? 'temp'}`,
      file_url: item.icon_url,
    } as Media;
  }

  return null;
};

export function SocialMediaArrayEditor({
  items,
  onChange,
  canEdit = true,
}: SocialMediaArrayEditorProps) {
  const handleItemChange = (index: number, patch: Partial<SocialMediaItem>) => {
    const nextItems = items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    );
    onChange(nextItems);
  };

  const handleAdd = () => {
    onChange([...items, createEmptyItem(items.length)]);
  };

  const handleRemove = (index: number) => {
    const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
    onChange(nextItems.map((item, itemIndex) => ({ ...item, order: itemIndex })));
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-font-s">هنوز شبکه اجتماعی اضافه نشده است.</p>
      ) : null}

      {items.map((item, index) => (
        <div key={item.id ?? `social-${index}`} className="rounded-lg border p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نام شبکه</Label>
              <Input
                value={item.name || ""}
                onChange={(event) => handleItemChange(index, { name: event.target.value })}
                placeholder="مثال: اینستاگرام"
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label>لینک</Label>
              <Input
                value={item.url || ""}
                onChange={(event) => handleItemChange(index, { url: event.target.value })}
                placeholder="https://..."
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label>ترتیب</Label>
              <Input
                type="number"
                value={item.order ?? index}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  handleItemChange(index, {
                    order: Number.isFinite(nextValue) ? nextValue : index,
                  });
                }}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label>آیکون</Label>
              <ImageSelector
                selectedMedia={resolveIconMedia(item)}
                onMediaSelect={(media) =>
                  handleItemChange(index, {
                    icon: media?.id ?? null,
                    icon_data: media,
                  })
                }
                size="sm"
                context="media_library"
              />
            </div>
          </div>

          {canEdit ? (
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => handleRemove(index)}>
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          ) : null}
        </div>
      ))}

      {canEdit ? (
        <Button type="button" variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          افزودن شبکه اجتماعی
        </Button>
      ) : null}
    </div>
  );
}
