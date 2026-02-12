export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    extension: string;
    category: MediaType;
  };
}