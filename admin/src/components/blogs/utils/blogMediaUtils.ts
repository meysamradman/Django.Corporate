import { BlogMedia } from "@/types/blog/blogMedia";
import { Media } from "@/types/shared/media";

export function parseBlogMedia(blogMediaArray: any[]): BlogMedia {
  const featuredImage = blogMediaArray.find(m => 
    m.media && 'is_main_image' in m && m.is_main_image
  )?.media || null;
  
  const imageGallery = blogMediaArray
    .filter(m => 
      m.media && 
      m.media.media_type === 'image' && 
      !('is_main_image' in m && m.is_main_image)
    )
    .map(m => m.media);
  
  const videoGallery = blogMediaArray
    .filter(m => m.media && m.media.media_type === 'video')
    .map(m => m.media);
  
  const audioGallery = blogMediaArray
    .filter(m => m.media && m.media.media_type === 'audio')
    .map(m => m.media);
  
  const pdfDocuments = blogMediaArray
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

export function collectMediaIds(blogMedia: BlogMedia): number[] {
  const allMediaIds: number[] = [];
  
  if (blogMedia.featuredImage?.id) {
    allMediaIds.push(blogMedia.featuredImage.id);
  }
  
  blogMedia.imageGallery.forEach(img => {
    if (img?.id && !allMediaIds.includes(img.id)) {
      allMediaIds.push(img.id);
    }
  });
  
  blogMedia.videoGallery.forEach(video => {
    if (video?.id && !allMediaIds.includes(video.id)) {
      allMediaIds.push(video.id);
    }
  });
  
  blogMedia.audioGallery.forEach(audio => {
    if (audio?.id && !allMediaIds.includes(audio.id)) {
      allMediaIds.push(audio.id);
    }
  });
  
  blogMedia.pdfDocuments.forEach(pdf => {
    if (pdf?.id && !allMediaIds.includes(pdf.id)) {
      allMediaIds.push(pdf.id);
    }
  });
  
  return allMediaIds;
}

export function collectMediaFilesAndIds(blogMedia: BlogMedia, featuredImage?: Media | null) {
  const allMediaFiles: File[] = [];
  const allMediaIds: number[] = [];
  
  if (featuredImage?.id) {
    allMediaIds.push(featuredImage.id);
  }
  
  if (blogMedia.featuredImage && blogMedia.featuredImage.id !== featuredImage?.id) {
    if ((blogMedia.featuredImage as any).file instanceof File) {
      allMediaFiles.push((blogMedia.featuredImage as any).file);
    } else if (blogMedia.featuredImage.id) {
      allMediaIds.push(blogMedia.featuredImage.id);
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
  
  processMediaArray(blogMedia.imageGallery);
  processMediaArray(blogMedia.videoGallery);
  processMediaArray(blogMedia.audioGallery);
  processMediaArray(blogMedia.pdfDocuments);
  
  return { allMediaFiles, allMediaIds };
}

function extractCoverImageId(media: Media): number | null {
  if (!media?.cover_image) return null;
  return typeof media.cover_image === 'object' ? media.cover_image.id : media.cover_image;
}

export function collectMediaCovers(blogMedia: BlogMedia): { [mediaId: number]: number | null } {
  const mediaCovers: { [mediaId: number]: number | null } = {};
  
  blogMedia.videoGallery.forEach(video => {
    if (video?.id) {
      mediaCovers[video.id] = extractCoverImageId(video);
    }
  });
  
  blogMedia.audioGallery.forEach(audio => {
    if (audio?.id) {
      mediaCovers[audio.id] = extractCoverImageId(audio);
    }
  });
  
  blogMedia.pdfDocuments.forEach(pdf => {
    if (pdf?.id) {
      mediaCovers[pdf.id] = extractCoverImageId(pdf);
    }
  });
  
  return mediaCovers;
}
