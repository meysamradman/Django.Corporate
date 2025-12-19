import type { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import type { Media } from "@/types/shared/media";

export function parsePortfolioMedia(portfolioMediaArray: any[]): PortfolioMedia {
  const featuredImage = portfolioMediaArray.find(m => 
    m.media && 'is_main_image' in m && m.is_main_image
  )?.media || null;
  
  const imageGallery = portfolioMediaArray
    .filter(m => 
      m.media && 
      m.media.media_type === 'image' && 
      !('is_main_image' in m && m.is_main_image)
    )
    .map(m => m.media);
  
  const videoGallery = portfolioMediaArray
    .filter(m => m.media && m.media.media_type === 'video')
    .map(m => m.media);
  
  const audioGallery = portfolioMediaArray
    .filter(m => m.media && m.media.media_type === 'audio')
    .map(m => m.media);
  
  const pdfDocuments = portfolioMediaArray
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

export function collectMediaIds(portfolioMedia: PortfolioMedia): number[] {
  const allMediaIds: number[] = [];
  
  if (portfolioMedia.featuredImage?.id) {
    allMediaIds.push(portfolioMedia.featuredImage.id);
  }
  
  portfolioMedia.imageGallery.forEach(img => {
    if (img?.id && !allMediaIds.includes(img.id)) {
      allMediaIds.push(img.id);
    }
  });
  
  portfolioMedia.videoGallery.forEach(video => {
    if (video?.id && !allMediaIds.includes(video.id)) {
      allMediaIds.push(video.id);
    }
  });
  
  portfolioMedia.audioGallery.forEach(audio => {
    if (audio?.id && !allMediaIds.includes(audio.id)) {
      allMediaIds.push(audio.id);
    }
  });
  
  portfolioMedia.pdfDocuments.forEach(pdf => {
    if (pdf?.id && !allMediaIds.includes(pdf.id)) {
      allMediaIds.push(pdf.id);
    }
  });
  
  return allMediaIds;
}

export function collectMediaFilesAndIds(portfolioMedia: PortfolioMedia, featuredImage?: Media | null) {
  const allMediaFiles: File[] = [];
  const allMediaIds: number[] = [];
  
  if (featuredImage?.id) {
    allMediaIds.push(featuredImage.id);
  }
  
  if (portfolioMedia.featuredImage && portfolioMedia.featuredImage.id !== featuredImage?.id) {
    if ((portfolioMedia.featuredImage as any).file instanceof File) {
      allMediaFiles.push((portfolioMedia.featuredImage as any).file);
    } else if (portfolioMedia.featuredImage.id) {
      allMediaIds.push(portfolioMedia.featuredImage.id);
    }
  }
  
  const processMediaArray = (mediaArray: Media[]) => {
    mediaArray.forEach(media => {
      if ((media as any).file instanceof File) {
        allMediaFiles.push((media as any).file);
      } else if (media.id) {
        allMediaIds.push(media.id);
      }
    });
  };
  
  processMediaArray(portfolioMedia.imageGallery);
  processMediaArray(portfolioMedia.videoGallery);
  processMediaArray(portfolioMedia.audioGallery);
  processMediaArray(portfolioMedia.pdfDocuments);
  
  return { allMediaFiles, allMediaIds };
}

function extractCoverImageId(media: Media): number | null {
  if (!media?.cover_image) return null;
  return typeof media.cover_image === 'object' ? media.cover_image.id : media.cover_image;
}

export function collectMediaCovers(portfolioMedia: PortfolioMedia): { [mediaId: number]: number | null } {
  const mediaCovers: { [mediaId: number]: number | null } = {};
  
  portfolioMedia.videoGallery.forEach(video => {
    if (video?.id) {
      mediaCovers[video.id] = extractCoverImageId(video);
    }
  });
  
  portfolioMedia.audioGallery.forEach(audio => {
    if (audio?.id) {
      mediaCovers[audio.id] = extractCoverImageId(audio);
    }
  });
  
  portfolioMedia.pdfDocuments.forEach(pdf => {
    if (pdf?.id) {
      mediaCovers[pdf.id] = extractCoverImageId(pdf);
    }
  });
  
  return mediaCovers;
}
