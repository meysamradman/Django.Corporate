export type MediaFile = {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  title?: string;
  alt_text?: string;
  description?: string;
  is_public?: boolean;
  coverFile?: File | null;
};

export type UploadSettings = {
  sizeLimit: {
    image: number;
    video: number;
    audio: number;
    document: number;
  };
  allowedTypes: {
    image: string[];
    video: string[];
    audio: string[];
    document: string[];
  };
  sizeLimitFormatted: {
    image: string;
    video: string;
    audio: string;
    document: string;
  };
};

export type UploadCategory = keyof UploadSettings['allowedTypes'];