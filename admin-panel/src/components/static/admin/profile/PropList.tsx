import { ProfilePropertiesList, type ProfilePropertyItem } from "@/components/static/agent/profile/ProfilePropertiesList";
import type { AdminPropertyItem } from "./types";

interface PropListProps {
  items: AdminPropertyItem[];
}

export function PropList(props: PropListProps) {
  const { items } = props;

  const mappedItems: ProfilePropertyItem[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    city: item.city,
    propertyType: item.propertyType ?? "آپارتمان",
    dealType: item.dealType ?? "فروش",
    status: item.status,
    price: item.price ?? "0 میلیون",
    viewLink: item.viewLink ?? `/real-estate/properties/${item.id}/view`,
  }));

  return <ProfilePropertiesList isConsultant={false} properties={mappedItems} />;
}
