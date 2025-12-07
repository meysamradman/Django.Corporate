import { Base } from "@/types/shared/base";

export interface FAQ extends Base {
  question: string;
  answer: string;
  keywords: string;
  patterns: string;
  order: number;
  is_active: boolean;
}

export interface ChatbotSettings extends Base {
  is_enabled: boolean;
  welcome_message: string;
  default_message: string;
  rate_limit_per_minute: number;
}

export interface CreateFAQData {
  question: string;
  answer: string;
  keywords?: string;
  patterns?: string;
  order?: number;
  is_active?: boolean;
}

export interface UpdateFAQData extends Partial<CreateFAQData> {}

export interface UpdateChatbotSettingsData {
  is_enabled?: boolean;
  welcome_message?: string;
  default_message?: string;
  rate_limit_per_minute?: number;
}
