import { useMemo } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import type { PropertyAgent } from "@/types/real_estate/agent/realEstateAgent";
import type { CardItemAction } from "@/components/elements/CardItem";
import { mediaService } from "@/components/media/services";

interface UsePropertyAdvisorCardHelpersParams {
  navigate: (to: string) => void;
}

export function usePropertyAdvisorCardHelpers({ navigate }: UsePropertyAdvisorCardHelpersParams) {
  const getInitial = (agent: PropertyAgent) => {
    if (agent.full_name) {
      const parts = agent.full_name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return agent.full_name.charAt(0).toUpperCase();
    }
    if (agent.first_name && agent.last_name) {
      return `${agent.first_name.charAt(0)}${agent.last_name.charAt(0)}`.toUpperCase();
    }
    if (agent.first_name) {
      return agent.first_name.charAt(0).toUpperCase();
    }
    return "؟";
  };

  const getImageUrl = (agent: PropertyAgent) => {
    if (agent.profile_image?.file_url) {
      return mediaService.getMediaUrlFromObject({ file_url: agent.profile_image.file_url } as any);
    }
    return null;
  };

  const actions: CardItemAction<PropertyAgent>[] = useMemo(
    () => [
      {
        label: "مشاهده",
        icon: <Eye className="h-4 w-4" />,
        onClick: (agent) => navigate(`/real-estate/agents/${agent.id}/view`),
      },
      {
        label: "ویرایش",
        icon: <Edit className="h-4 w-4" />,
        onClick: (agent) => navigate(`/real-estate/agents/${agent.id}/edit`),
      },
      {
        label: "حذف",
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => {},
        isDestructive: true,
      },
    ],
    [navigate]
  );

  return {
    getInitial,
    getImageUrl,
    actions,
  };
}
