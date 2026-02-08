class MediaAggregationMixin:

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

        all_images = getattr(obj, 'all_images', [])
        if not all_images and not hasattr(obj, 'all_images'):
            all_images = getattr(obj, image_rel).select_related('image').all()
        
        if media_limit > 0:
            all_images = all_images[:media_limit]
        
        videos = getattr(obj, video_rel).all()
        audios = getattr(obj, audio_rel).all()
        documents = getattr(obj, document_rel).all()
        
        if media_limit > 0:
            videos = videos[:media_limit]
            audios = audios[:media_limit]
            documents = documents[:media_limit]
        
        self._prefetch_cover_image_urls(videos, 'video')
        self._prefetch_cover_image_urls(audios, 'audio')
        self._prefetch_cover_image_urls(documents, 'document')
        
        all_media = list(all_images) + list(videos) + list(audios) + list(documents)
        all_media.sort(key=lambda x: (x.order, x.created_at))
        
        if media_serializer_class:
            serializer = media_serializer_class(context=self.context)
            return [serializer.to_representation(media) for media in all_media]
        
        return all_media

    def _prefetch_cover_image_urls(self, items, media_type):

        for item in items:
            media_obj = getattr(item, media_type, None)
            if media_obj and hasattr(media_obj, 'cover_image') and media_obj.cover_image:
                if hasattr(media_obj.cover_image, 'file') and media_obj.cover_image.file:
                    try:
                        _ = media_obj.cover_image.file.url
                    except Exception:
                        pass
            
            if media_type == 'document' and hasattr(item, 'document') and item.document:
                if hasattr(item.document, 'file') and item.document.file:
                    try:
                        _ = item.document.file.url
                    except Exception:
                        pass
