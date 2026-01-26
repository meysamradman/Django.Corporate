from django.db import transaction
from django.db.models import Max, Q
from django.core.cache import cache
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.portfolio.utils.cache import PortfolioCacheManager
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia, detect_media_type_from_extension
from src.media.services.media_services import MediaAdminService



class PortfolioAdminMediaService:
    @staticmethod
    def get_main_image_for_model(portfolio_obj):
        """Standardized main image retrieval with fallback logic"""
        # 1. Try to get explicit main image
        main_image_obj = PortfolioImage.objects.filter(
            portfolio=portfolio_obj,
            is_main=True
        ).select_related('image').first()
        
        if main_image_obj and main_image_obj.image:
            return main_image_obj.image

        # 2. Fallback to any images
        first_image = PortfolioImage.objects.filter(
            portfolio=portfolio_obj
        ).select_related('image').order_by('order', 'created_at').first()
        if first_image and first_image.image:
            return first_image.image

        # 3. Fallback to video cover
        first_video = PortfolioVideo.objects.filter(
            portfolio=portfolio_obj
        ).select_related('video__cover_image').order_by('order', 'created_at').first()
        if first_video and first_video.video and first_video.video.cover_image:
            return first_video.video.cover_image

        # 4. Fallback to other media types covers
        audio = PortfolioAudio.objects.filter(
            portfolio=portfolio_obj
        ).select_related('audio__cover_image').first()
        if audio and audio.audio and audio.audio.cover_image:
            return audio.audio.cover_image
            
        doc = PortfolioDocument.objects.filter(
            portfolio=portfolio_obj
        ).select_related('document__cover_image').first()
        if doc and doc.document and doc.document.cover_image:
            return doc.document.cover_image

        return None

    @staticmethod
    def get_next_media_order(portfolio_id):
        max_order_result = Portfolio.objects.filter(
            id=portfolio_id
        ).aggregate(
            max_image_order=Max('images__order'),
            max_video_order=Max('videos__order'),
            max_audio_order=Max('audios__order'),
            max_document_order=Max('documents__order')
        )
        
        max_order = max(
            max_order_result.get('max_image_order') or 0,
            max_order_result.get('max_video_order') or 0,
            max_order_result.get('max_audio_order') or 0,
            max_order_result.get('max_document_order') or 0
        )
        
        return max_order + 1 if max_order > 0 else 0

    @staticmethod
    def get_media_by_ids(media_ids):
        if not media_ids:
            return [], [], [], []
        
        media_ids_list = list(set(media_ids)) if isinstance(media_ids, (list, tuple)) else [media_ids]
        
        image_medias = list(ImageMedia.objects.filter(id__in=media_ids_list))
        video_medias = list(VideoMedia.objects.filter(id__in=media_ids_list).select_related('cover_image'))
        audio_medias = list(AudioMedia.objects.filter(id__in=media_ids_list).select_related('cover_image'))
        document_medias = list(DocumentMedia.objects.filter(id__in=media_ids_list).select_related('cover_image'))
        
        return image_medias, video_medias, audio_medias, document_medias

    @staticmethod
    def get_existing_portfolio_media(portfolio_id, media_ids):
        if not media_ids:
            return set(), set(), set(), set()
        
        media_ids_list = list(media_ids) if not isinstance(media_ids, list) else media_ids
        
        existing_image_ids = set(
            PortfolioImage.objects.filter(
                portfolio_id=portfolio_id,
                image_id__in=media_ids_list
            ).values_list('image_id', flat=True)
        )
        
        existing_video_ids = set(
            PortfolioVideo.objects.filter(
                portfolio_id=portfolio_id,
                video_id__in=media_ids_list
            ).values_list('video_id', flat=True)
        )
        
        existing_audio_ids = set(
            PortfolioAudio.objects.filter(
                portfolio_id=portfolio_id,
                audio_id__in=media_ids_list
            ).values_list('audio_id', flat=True)
        )
        
        existing_document_ids = set(
            PortfolioDocument.objects.filter(
                portfolio_id=portfolio_id,
                document_id__in=media_ids_list
            ).values_list('document_id', flat=True)
        )
        
        return existing_image_ids, existing_video_ids, existing_audio_ids, existing_document_ids

    @staticmethod
    def add_media_bulk(portfolio_id, media_files=None, media_ids=None, created_by=None):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        media_files = media_files or []
        media_ids = media_ids or []
        
        created_count = 0
        failed_ids = []
        
        failed_files = []
        if media_files:
            uploaded_medias = []
            
            for media_file in media_files:
                try:
                    file_ext = media_file.name.lower().split('.')[-1] if '.' in media_file.name else ''
                    media_type = detect_media_type_from_extension(file_ext)
                    
                    media = MediaAdminService.create_media(media_type, {
                        'file': media_file,
                        'title': f"Media for {portfolio.title}",
                    })
                    uploaded_medias.append((media, media_type))
                except Exception as e:
                    failed_files.append({
                        'name': media_file.name,
                        'error': str(e)
                    })
                    continue
            
            if uploaded_medias:
                next_order = PortfolioAdminMediaService.get_next_media_order(portfolio_id)
                
                has_main_image = PortfolioImage.objects.filter(
                    portfolio=portfolio,
                    is_main=True
                ).exists()
                
                portfolio_media_objects = []
                for i, (media, media_type) in enumerate(uploaded_medias):
                    if media_type == 'image':
                        should_be_main = (i == 0) and not has_main_image
                        
                        portfolio_media_objects.append(
                            PortfolioImage(
                                portfolio=portfolio,
                                image=media,
                                is_main=should_be_main,
                                order=next_order + i
                            )
                        )
                        
                        if should_be_main:
                            has_main_image = True
                    elif media_type == 'video':
                        portfolio_media_objects.append(
                            PortfolioVideo(
                                portfolio=portfolio,
                                video=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'audio':
                        portfolio_media_objects.append(
                            PortfolioAudio(
                                portfolio=portfolio,
                                audio=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'pdf':
                        portfolio_media_objects.append(
                            PortfolioDocument(
                                portfolio=portfolio,
                                document=media,
                                order=next_order + i
                            )
                        )
                
                if portfolio_media_objects:
                    images = [obj for obj in portfolio_media_objects if isinstance(obj, PortfolioImage)]
                    videos = [obj for obj in portfolio_media_objects if isinstance(obj, PortfolioVideo)]
                    audios = [obj for obj in portfolio_media_objects if isinstance(obj, PortfolioAudio)]
                    documents = [obj for obj in portfolio_media_objects if isinstance(obj, PortfolioDocument)]
                    
                    if images:
                        PortfolioImage.objects.bulk_create(images)
                    if videos:
                        PortfolioVideo.objects.bulk_create(videos)
                    if audios:
                        PortfolioAudio.objects.bulk_create(audios)
                    if documents:
                        PortfolioDocument.objects.bulk_create(documents)
                    
                    created_count += len(portfolio_media_objects)
        
        if media_ids:
            media_ids_list = list(set(media_ids)) if isinstance(media_ids, (list, tuple)) else [media_ids]
            
            image_medias, video_medias, audio_medias, document_medias = \
                PortfolioAdminMediaService.get_media_by_ids(media_ids_list)
            
            image_dict = {media.id: media for media in image_medias}
            video_dict = {media.id: media for media in video_medias}
            audio_dict = {media.id: media for media in audio_medias}
            document_dict = {media.id: media for media in document_medias}
            
            existing_image_ids, existing_video_ids, existing_audio_ids, existing_document_ids = \
                PortfolioAdminMediaService.get_existing_portfolio_media(portfolio_id, media_ids_list)
            
            all_existing_ids = existing_image_ids | existing_video_ids | existing_audio_ids | existing_document_ids
            
            media_to_create = []
            
            for media_id in media_ids_list:
                if media_id in all_existing_ids:
                    continue
                
                if media_id in image_dict:
                    media_to_create.append(('image', image_dict[media_id]))
                elif media_id in video_dict:
                    media_to_create.append(('video', video_dict[media_id]))
                elif media_id in audio_dict:
                    media_to_create.append(('audio', audio_dict[media_id]))
                elif media_id in document_dict:
                    media_to_create.append(('document', document_dict[media_id]))
                else:
                    failed_ids.append(media_id)
            
            
            if media_to_create:
                next_order = PortfolioAdminMediaService.get_next_media_order(portfolio_id)
                
                has_main_image = PortfolioImage.objects.filter(
                    portfolio=portfolio,
                    is_main=True
                ).exists()
                
                portfolio_media_objects = []
                for i, (media_type, media) in enumerate(media_to_create):
                    if media_type == 'image':
                        should_be_main = not has_main_image
                        
                        portfolio_media_objects.append(
                            PortfolioImage(
                                portfolio=portfolio,
                                image=media,
                                is_main=should_be_main,
                                order=next_order + i
                            )
                        )
                        
                        if should_be_main:
                            has_main_image = True
                    elif media_type == 'video':
                        portfolio_media_objects.append(
                            PortfolioVideo(
                                portfolio=portfolio,
                                video=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'audio':
                        portfolio_media_objects.append(
                            PortfolioAudio(
                                portfolio=portfolio,
                                audio=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'document':
                        portfolio_media_objects.append(
                            PortfolioDocument(
                                portfolio=portfolio,
                                document=media,
                                order=next_order + i
                            )
                        )
                
                if portfolio_media_objects:
                    images = [obj for obj in portfolio_media_objects if isinstance(obj, PortfolioImage)]
                    videos = [obj for obj in portfolio_media_objects if isinstance(obj, PortfolioVideo)]
                    audios = [obj for obj in portfolio_media_objects if isinstance(obj, PortfolioAudio)]
                    documents = [obj for obj in portfolio_media_objects if isinstance(obj, PortfolioDocument)]
                    
                    if images:
                        PortfolioImage.objects.bulk_create(images)
                    if videos:
                        PortfolioVideo.objects.bulk_create(videos)
                    if audios:
                        PortfolioAudio.objects.bulk_create(audios)
                    if documents:
                        PortfolioDocument.objects.bulk_create(documents)
                    
                    created_count += len(portfolio_media_objects)
        
        if created_count > 0 or media_ids:
            has_main_image = PortfolioImage.objects.filter(
                portfolio_id=portfolio_id,
                is_main=True
            ).exists()
            
            if not has_main_image:
                first_image = PortfolioImage.objects.filter(
                    portfolio_id=portfolio_id
                ).select_related('image').order_by('is_main', 'order', 'created_at').first()
                
                if first_image:
                    first_image.is_main = True
                    first_image.save(update_fields=['is_main'])
                    
                    if not portfolio.og_image:
                        portfolio.og_image = first_image.image
                        portfolio.save(update_fields=['og_image'])
                
                PortfolioCacheManager.invalidate_portfolio(portfolio_id)
        
        return {
            'created_count': created_count,
            'uploaded_media_ids': [m.id for m in uploaded_medias] if 'uploaded_medias' in locals() else [],
            'failed_ids': failed_ids,
            'failed_files': failed_files
        }
    
    @staticmethod
    def sync_media(portfolio_id, media_ids, main_image_id=None, media_covers=None):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
        # Prepare IDs lists
        media_to_remove = set()
        media_to_add = set()
        media_ids_count = 0
        
        if media_ids is not None:
            media_ids = media_ids if isinstance(media_ids, (list, tuple)) else []
            media_ids_set = set(media_ids)
            media_ids_count = len(media_ids_set)
            
            current_image_ids = set(
                PortfolioImage.objects.filter(portfolio_id=portfolio_id).values_list('image_id', flat=True)
            )
            current_video_ids = set(
                PortfolioVideo.objects.filter(portfolio_id=portfolio_id).values_list('video_id', flat=True)
            )
            current_audio_ids = set(
                PortfolioAudio.objects.filter(portfolio_id=portfolio_id).values_list('audio_id', flat=True)
            )
            current_document_ids = set(
                PortfolioDocument.objects.filter(portfolio_id=portfolio_id).values_list('document_id', flat=True)
            )
            
            all_current_ids = current_image_ids | current_video_ids | current_audio_ids | current_document_ids
            
            media_to_remove = all_current_ids - media_ids_set
            media_to_add = media_ids_set - all_current_ids
            
            # If everything is removed
            if not media_ids_set:
                media_to_remove = all_current_ids
                media_to_add = set()
        
        with transaction.atomic():
            if media_ids is not None:
                current_main_image_id = None
                if current_image_ids:
                    main_image_obj = PortfolioImage.objects.filter(
                        portfolio_id=portfolio_id,
                        is_main=True
                    ).first()
                    if main_image_obj:
                        current_main_image_id = main_image_obj.image_id
                
                if media_to_remove:
                    image_ids_to_remove = media_to_remove & current_image_ids
                    if image_ids_to_remove:
                        if current_main_image_id and current_main_image_id in image_ids_to_remove:
                            PortfolioImage.objects.filter(
                                portfolio_id=portfolio_id,
                                is_main=True
                            ).update(is_main=False)
                            current_main_image_id = None
                        
                        PortfolioImage.objects.filter(
                            portfolio_id=portfolio_id,
                            image_id__in=image_ids_to_remove
                        ).delete()
                    
                    video_ids_to_remove = media_to_remove & current_video_ids
                    if video_ids_to_remove:
                        PortfolioVideo.objects.filter(
                            portfolio_id=portfolio_id,
                            video_id__in=video_ids_to_remove
                        ).delete()
                    
                    audio_ids_to_remove = media_to_remove & current_audio_ids
                    if audio_ids_to_remove:
                        PortfolioAudio.objects.filter(
                            portfolio_id=portfolio_id,
                            audio_id__in=audio_ids_to_remove
                        ).delete()
                    
                    document_ids_to_remove = media_to_remove & current_document_ids
                    if document_ids_to_remove:
                        PortfolioDocument.objects.filter(
                            portfolio_id=portfolio_id,
                            document_id__in=document_ids_to_remove
                        ).delete()
                
            
            if main_image_id is not None:
                PortfolioImage.objects.filter(
                    portfolio_id=portfolio_id,
                    is_main=True
                ).update(is_main=False)
                
                portfolio_image = PortfolioImage.objects.filter(
                    portfolio_id=portfolio_id,
                    image_id=main_image_id
                ).first()
                
                if portfolio_image:
                    portfolio_image.is_main = True
                    portfolio_image.save(update_fields=['is_main'])
                    
                    portfolio.refresh_from_db()
                    if not portfolio.og_image:
                        portfolio.og_image = portfolio_image.image
                        portfolio.save(update_fields=['og_image'])
            
            if media_to_add:
                PortfolioAdminMediaService.add_media_bulk(
                    portfolio_id=portfolio_id,
                    media_ids=list(media_to_add)
                )
                
                if main_image_id is not None and main_image_id in media_to_add:
                    portfolio_image = PortfolioImage.objects.filter(
                        portfolio_id=portfolio_id,
                        image_id=main_image_id
                    ).first()
                    
                    if portfolio_image:
                        PortfolioImage.objects.filter(
                            portfolio_id=portfolio_id,
                            is_main=True
                        ).exclude(image_id=main_image_id).update(is_main=False)
                        
                        portfolio_image.is_main = True
                        portfolio_image.save(update_fields=['is_main'])
                        
                        portfolio.refresh_from_db()
                        if not portfolio.og_image:
                            portfolio.og_image = portfolio_image.image
                            portfolio.save(update_fields=['og_image'])
            
            if media_covers:
                PortfolioAdminMediaService._update_portfolio_media_covers(
                    portfolio_id=portfolio_id,
                    media_covers=media_covers,
                    all_current_ids=all_current_ids,
                    current_video_ids=current_video_ids,
                    current_audio_ids=current_audio_ids,
                    current_document_ids=current_document_ids
                )
            
            PortfolioCacheManager.invalidate_portfolio(portfolio_id)
        
        return {
            'removed_count': len(media_to_remove),
            'added_count': len(media_to_add),
            'total_count': media_ids_count
        }

    @staticmethod
    def set_main_image(portfolio_id, media_id):
        """Standardized set main image logic"""
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")

        with transaction.atomic():
            # Unset current main
            PortfolioImage.objects.filter(portfolio_id=portfolio_id, is_main=True).update(is_main=False)
            
            # Try to find the image in the portfolio's images
            portfolio_image = PortfolioImage.objects.filter(portfolio_id=portfolio_id, image_id=media_id).first()
            
            if portfolio_image:
                portfolio_image.is_main = True
                portfolio_image.save(update_fields=['is_main'])
                
                # Update OG image if empty
                if not portfolio.og_image:
                    portfolio.og_image = portfolio_image.image
                    portfolio.save(update_fields=['og_image'])
            else:
                # If not found directly, newly add it
                from src.media.models.media import ImageMedia
                try:
                    media_image = ImageMedia.objects.get(id=media_id)
                    PortfolioImage.objects.create(
                        portfolio=portfolio,
                        image=media_image,
                        is_main=True,
                        order=0
                    )
                    if not portfolio.og_image:
                        portfolio.og_image = media_image
                        portfolio.save(update_fields=['og_image'])
                except ImageMedia.DoesNotExist:
                    raise ValidationError("Media image not found")

            PortfolioCacheManager.invalidate_portfolio(portfolio_id)
            return True
    
    @staticmethod
    def _update_portfolio_media_covers(portfolio_id, media_covers, all_current_ids, 
                                       current_video_ids, current_audio_ids, current_document_ids):
        for media_id_str, cover_image_id in media_covers.items():
            try:
                media_id = int(media_id_str) if isinstance(media_id_str, str) else media_id_str
            except (ValueError, TypeError):
                continue
            
            if media_id not in all_current_ids:
                continue
            
            if media_id in current_video_ids:
                PortfolioAdminMediaService._update_media_cover(
                    PortfolioVideo, 'video', portfolio_id, media_id, cover_image_id, video_id=media_id
                )
            elif media_id in current_audio_ids:
                PortfolioAdminMediaService._update_media_cover(
                    PortfolioAudio, 'audio', portfolio_id, media_id, cover_image_id, audio_id=media_id
                )
            elif media_id in current_document_ids:
                PortfolioAdminMediaService._update_media_cover(
                    PortfolioDocument, 'document', portfolio_id, media_id, cover_image_id, document_id=media_id
                )
    
    @staticmethod
    def _update_media_cover(model_class, media_type, portfolio_id, media_id, cover_image_id, **filter_kwargs):
        try:
            portfolio_media = model_class.objects.filter(
                portfolio_id=portfolio_id,
                **filter_kwargs
            ).first()
            
            if portfolio_media:
                if cover_image_id:
                    cover_image = ImageMedia.objects.filter(id=cover_image_id).first()
                    portfolio_media.cover_image = cover_image if cover_image else None
                else:
                    portfolio_media.cover_image = None
                portfolio_media.save(update_fields=['cover_image'])
        except Exception:
            pass