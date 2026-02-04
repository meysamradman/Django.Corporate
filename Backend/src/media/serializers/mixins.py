class MediaAggregationMixin:
    """
    Mixin to aggregate and sort media items (images, videos, audio, documents)
    across different modular apps.
    """
    
    def aggregate_media(
        self, 
        obj, 
        media_limit=0,
        image_rel='images',
        video_rel='videos', 
        audio_rel='audios',
        document_rel='documents',
        media_serializer_class=None
    ):
        """
        Gathers and sorts all media relations for an object.
        """
        # 1. Get images (prefer pre-fetched all_images)
        all_images = getattr(obj, 'all_images', [])
        if not all_images and not hasattr(obj, 'all_images'):
            all_images = getattr(obj, image_rel).select_related('image').all()
        
        if media_limit > 0:
            all_images = all_images[:media_limit]
        
        # 2. Get other media types
        videos = getattr(obj, video_rel).all()
        audios = getattr(obj, audio_rel).all()
        documents = getattr(obj, document_rel).all()
        
        if media_limit > 0:
            videos = videos[:media_limit]
            audios = audios[:media_limit]
            documents = documents[:media_limit]
        
        # 3. Warm up cover image cache (N+1 mitigation)
        self._prefetch_cover_image_urls(videos, 'video')
        self._prefetch_cover_image_urls(audios, 'audio')
        self._prefetch_cover_image_urls(documents, 'document')
        
        # 4. Combine and Sort
        all_media = list(all_images) + list(videos) + list(audios) + list(documents)
        all_media.sort(key=lambda x: (x.order, x.created_at))
        
        # 5. Serialize if class provided
        if media_serializer_class:
            serializer = media_serializer_class(context=self.context)
            return [serializer.to_representation(media) for media in all_media]
        
        return all_media

    def _prefetch_cover_image_urls(self, items, media_type):
        """
        Ensures cover image URLs are accessed within a prefetch context
        to avoid lazy-loading inside the loop.
        """
        for item in items:
            media_obj = getattr(item, media_type, None)
            if media_obj and hasattr(media_obj, 'cover_image') and media_obj.cover_image:
                if hasattr(media_obj.cover_image, 'file') and media_obj.cover_image.file:
                    try:
                        _ = media_obj.cover_image.file.url
                    except Exception:
                        pass
            
            # Special case for documents which might have their own logic
            if media_type == 'document' and hasattr(item, 'document') and item.document:
                if hasattr(item.document, 'file') and item.document.file:
                    try:
                        _ = item.document.file.url
                    except Exception:
                        pass
