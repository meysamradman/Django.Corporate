export interface PortfolioCategoryFilterParams {
  search?: string;
  status?: "draft" | "published";
  "categories__in"?: string[];
  "categories__name"?: string;
  "title__icontains"?: string;
  is_active?: boolean;
  is_public?: boolean;
  is_featured?: boolean;
  page?: number;
  limit?: number;
  offset?: number;

  [key: string]:
    | string
    | number
    | boolean
    | string[]
    | undefined;
}
