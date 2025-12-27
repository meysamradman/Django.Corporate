import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaImage } from "@/components/media/base/MediaImage";
import { mediaService } from "@/components/media/services";
import { Image } from "lucide-react";

interface MediaInfoTabProps {
  agency: any;
}

export function MediaInfoTab({ agency }: MediaInfoTabProps) {
  const logoUrl = agency.logo?.file_url
    ? mediaService.getMediaUrlFromObject({ file_url: agency.logo.file_url } as any)
    : null;

  return (
    <TabsContent value="media" className="mt-0 space-y-6">
      <CardWithIcon
        icon={Image}
        title="لوگو آژانس"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        headerClassName="pb-3"
      >
        {logoUrl ? (
          <div className="relative aspect-square border rounded-lg overflow-hidden shadow-md">
            <MediaImage
              media={{ file_url: logoUrl } as any}
              alt={agency.name}
              className="object-cover"
              fill
            />
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-bg/50">
            <Image className="w-12 h-12 mx-auto mb-3 text-font-s" />
            <p className="text-font-s">لوگو آپلود نشده است</p>
          </div>
        )}
      </CardWithIcon>
    </TabsContent>
  );
}

