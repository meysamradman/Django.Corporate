export interface EditableFloorPlan {
  id?: number;
  title: string;
  slug: string;
  description: string;
  floor_size: number | null;
  size_unit: "sqm" | "sqft";
  bedrooms: number | null;
  bathrooms: number | null;
  price: number | null;
  currency: string;
  floor_number: number | null;
  unit_type: string;
  display_order: number;
  is_available: boolean;
  images: any[];
}
