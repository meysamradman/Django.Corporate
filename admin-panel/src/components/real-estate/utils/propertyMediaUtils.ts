import type { PropertyMedia } from "@/types/real_estate/propertyMedia";
import type { PropertyMediaItem } from "@/types/real_estate/property";
import type { Media } from "@/types/shared/media";

export function parsePropertyMedia(propertyMediaArray: PropertyMediaItem[]): PropertyMedia {
  const featuredImage = propertyMediaArray.find(m => 
    m.media && ('is_main_image' in m && m.is_main_image)
  )?.media || null;
  
  const imageGallery = propertyMediaArray
    .filter(m => 
      m.media && 
      m.media.media_type === 'image' && 
      !('is_main_image' in m && m.is_main_image)
    )
    .map(m => m.media);
  
  const videoGallery = propertyMediaArray
    .filter(m => m.media && m.media.media_type === 'video')
    .map(m => m.media);
  
  const audioGallery = propertyMediaArray
    .filter(m => m.media && m.media.media_type === 'audio')
    .map(m => m.media);
  
  const pdfDocuments = propertyMediaArray
    .filter(m => m.media && (m.media.media_type === 'pdf' || m.media.media_type === 'document'))
    .map(m => m.media);
  
  return {
    featuredImage,
    imageGallery,
    videoGallery,
    audioGallery,
    pdfDocuments
  };
}

export function collectMediaIds(propertyMedia: PropertyMedia): number[] {
  const allMediaIds: number[] = [];
  
  if (propertyMedia.featuredImage?.id) {
    allMediaIds.push(propertyMedia.featuredImage.id);
  }
  
  propertyMedia.imageGallery.forEach(img => {
    if (img?.id && !allMediaIds.includes(img.id)) {
      allMediaIds.push(img.id);
    }
  });
  
  propertyMedia.videoGallery.forEach(video => {
    if (video?.id && !allMediaIds.includes(video.id)) {
      allMediaIds.push(video.id);
    }
  });
  
  propertyMedia.audioGallery.forEach(audio => {
    if (audio?.id && !allMediaIds.includes(audio.id)) {
      allMediaIds.push(audio.id);
    }
  });
  
  propertyMedia.pdfDocuments.forEach(pdf => {
    if (pdf?.id && !allMediaIds.includes(pdf.id)) {
      allMediaIds.push(pdf.id);
    }
  });
  
  return allMediaIds;
}

function extractCoverImageId(media: Media): number | null {
  if (!media?.cover_image) return null;
  return typeof media.cover_image === 'object' ? media.cover_image.id : media.cover_image;
}

export function collectMediaCovers(propertyMedia: PropertyMedia): { [mediaId: number]: number | null } {
  const mediaCovers: { [mediaId: number]: number | null } = {};
  
  propertyMedia.videoGallery.forEach(video => {
    if (video?.id) {
      mediaCovers[video.id] = extractCoverImageId(video);
    }
  });
  
  propertyMedia.audioGallery.forEach(audio => {
    if (audio?.id) {
      mediaCovers[audio.id] = extractCoverImageId(audio);
    }
  });
  
  propertyMedia.pdfDocuments.forEach(pdf => {
    if (pdf?.id) {
      mediaCovers[pdf.id] = extractCoverImageId(pdf);
    }
  });
  
  return mediaCovers;
}

