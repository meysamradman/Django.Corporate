export type FeatureFlags = Record<string, boolean>;

export interface FeatureFlag {
  id?: number;
  public_id?: string;
  key: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
