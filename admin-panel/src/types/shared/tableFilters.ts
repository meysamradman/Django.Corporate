export interface BaseApiFilterParams {
  search?: string;
  limit?: number;
  offset?: number;
  size?: number;
  ordering?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface BaseClientFilterParams {
  search?: string;
  page: number;
  limit: number;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

