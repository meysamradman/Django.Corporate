import type { PropertyMedia } from "@/types/real_estate/realEstateMedia";
import type { Media } from "@/types/shared/media";

export function parsePropertyMedia(propertyMediaArray: any[]): PropertyMedia {
  const featuredImage = propertyMediaArray.find(m => 
    m.media && 'is_main_image' in m && m.is_main_image
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

export function collectMediaFilesAndIds(propertyMedia: PropertyMedia, featuredImage?: Media | null) {
  const allMediaFiles: File[] = [];
  const allMediaIds: number[] = [];
  
  // Featured image from SEO tab
  if (featuredImage?.id) {
    allMediaIds.push(featuredImage.id);
  }
  
  // Main/featured image from media tab
  if (propertyMedia.featuredImage && propertyMedia.featuredImage.id !== featuredImage?.id) {
    if ((propertyMedia.featuredImage as any).file instanceof File) {
      allMediaFiles.push((propertyMedia.featuredImage as any).file);
    } else if (propertyMedia.featuredImage.id) {
      allMediaIds.push(propertyMedia.featuredImage.id);
    }
  }
  
  // Helper function to process media arrays
  const processMediaArray = (mediaArray: Media[]) => {
    mediaArray.forEach(media => {
      if ((media as any).file instanceof File) {
        allMediaFiles.push((media as any).file);
      } else if (media.id) {
        allMediaIds.push(media.id);
      }
    });
  };
  
  // Process all media types
  processMediaArray(propertyMedia.imageGallery);
  processMediaArray(propertyMedia.videoGallery);
  processMediaArray(propertyMedia.audioGallery);
  processMediaArray(propertyMedia.pdfDocuments);
  
  return { allMediaFiles, allMediaIds };
}

function extractCoverImageId(media: Media): number | null {
  if (!media?.cover_image) return null;
  return typeof media.cover_image === 'object' ? media.cover_image.id : media.cover_image;
}

export function collectMediaCovers(propertyMedia: PropertyMedia): { [mediaId: number]: number | null } {
  const mediaCovers: { [mediaId: number]: number | null } = {};
  
  // Collect covers for videos
  propertyMedia.videoGallery.forEach(video => {
    if (video?.id) {
      mediaCovers[video.id] = extractCoverImageId(video);
    }
  });
  
  // Collect covers for audios
  propertyMedia.audioGallery.forEach(audio => {
    if (audio?.id) {
      mediaCovers[audio.id] = extractCoverImageId(audio);
    }
  });
  
  // Collect covers for PDFs
  propertyMedia.pdfDocuments.forEach(pdf => {
    if (pdf?.id) {
      mediaCovers[pdf.id] = extractCoverImageId(pdf);
    }
  });
  
  return mediaCovers;
}
