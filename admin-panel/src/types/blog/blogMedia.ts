import type { Media } from "@/types/shared/media";

export interface BlogMedia {
  featuredImage: Media | null;
  imageGallery: Media[];
  videoGallery: Media[];
  audioGallery: Media[];
  pdfDocuments: Media[];
}
