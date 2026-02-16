import logging
from django.db import transaction
from django.db.models import Max, Q
from django.core.cache import cache

logger = logging.getLogger(__name__)

from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.portfolio.utils.cache import PortfolioCacheManager
from src.portfolio.messages.messages import PORTFOLIO_ERRORS
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia, detect_media_type_from_extension
from src.media.services.media_services import MediaAdminService

class PortfolioAdminMediaService:
    @staticmethod
    def get_main_image_for_model(portfolio_obj):
        
        main_image_obj = PortfolioImage.objects.filter(
            portfolio=portfolio_obj,
            is_main=True
        ).select_related('image').first()
        
        if main_image_obj and main_image_obj.image:
            return main_image_obj.image

        first_image = PortfolioImage.objects.filter(
            portfolio=portfolio_obj
        ).select_related('image').order_by('order', 'created_at').first()
        if first_image and first_image.image:
            return first_image.image

        first_video = PortfolioVideo.objects.filter(
            portfolio=portfolio_obj
        ).select_related('video__cover_image').order_by('order', 'created_at').first()
        if first_video and first_video.video and first_video.video.cover_image:
            return first_video.video.cover_image

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
        from src.media.utils.media_helpers import get_combined_max_order
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
            return get_combined_max_order(portfolio, 'images', 'videos', 'audios', 'documents')
        except Portfolio.DoesNotExist:
            return 1

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
    def add_media_bulk(portfolio_id, media_files=None, media_ids=None, 
                       image_ids=None, video_ids=None, audio_ids=None, document_ids=None,
                       created_by=None):
        logger.info(f"📂 [PortfolioMedia][AddBulk] Starting - Portfolio ID: {portfolio_id}")
        logger.debug(f"📂 [PortfolioMedia][AddBulk] Files: {len(media_files) if media_files else 0}, IDs: {media_ids}")
        
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
            logger.info(f"✅ [PortfolioMedia][AddBulk] Found portfolio: {portfolio.title}")
        except Portfolio.DoesNotExist:
            logger.error(f"❌ [PortfolioMedia][AddBulk] Error: Portfolio not found")
            raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])
        media_files = media_files or []
        media_ids = media_ids or []
        image_ids = image_ids or []
        video_ids = video_ids or []
        audio_ids = audio_ids or []
        document_ids = document_ids or []
        
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
        
        if any([media_ids, image_ids, video_ids, audio_ids, document_ids]):
            media_ids_list = list(set(media_ids)) if media_ids else []
            image_ids_list = list(set(image_ids)) if image_ids else []
            video_ids_list = list(set(video_ids)) if video_ids else []
            audio_ids_list = list(set(audio_ids)) if audio_ids else []
            document_ids_list = list(set(document_ids)) if document_ids else []
            
            all_target_ids = list(set(media_ids_list + image_ids_list + video_ids_list + audio_ids_list + document_ids_list))
            
            im_objs, vi_objs, au_objs, do_objs = PortfolioAdminMediaService.get_media_by_ids(all_target_ids)
            
            image_dict = {m.id: m for m in im_objs}
            video_dict = {m.id: m for m in vi_objs}
            audio_dict = {m.id: m for m in au_objs}
            document_dict = {m.id: m for m in do_objs}
            
            ex_im, ex_vi, ex_au, ex_do = PortfolioAdminMediaService.get_existing_portfolio_media(portfolio_id, all_target_ids)
            
            media_to_create = [] # List of (type, media_obj)
            
            TYPED_ID_MAP = [
                ('image', image_ids_list, image_dict, ex_im),
                ('video', video_ids_list, video_dict, ex_vi),
                ('audio', audio_ids_list, audio_dict, ex_au),
                ('document', document_ids_list, document_dict, ex_do),
            ]

            for label, id_list, lookup_dict, existing_set in TYPED_ID_MAP:
                for mid in id_list:
                    if mid in lookup_dict and mid not in existing_set:
                        media_to_create.append((label, lookup_dict[mid]))
                        existing_set.add(mid) # Prevent double add if also in media_ids

            all_ex = ex_im | ex_vi | ex_au | ex_do
            for mid in media_ids_list:
                if mid in all_ex: continue
                
                if mid in image_dict: media_to_create.append(('image', image_dict[mid]))
                elif mid in video_dict: media_to_create.append(('video', video_dict[mid]))
                elif mid in audio_dict: media_to_create.append(('audio', audio_dict[mid]))
                elif mid in document_dict: media_to_create.append(('document', document_dict[mid]))
                else: failed_ids.append(mid)

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
    def sync_media(portfolio_id, media_ids=None,
                   image_ids=None, video_ids=None, audio_ids=None, document_ids=None,
                   main_image_id=None, media_covers=None,
                   image_covers=None, video_covers=None, audio_covers=None, document_covers=None):

        logger.info(f"🔄 [PortfolioMedia][Sync] Starting - Portfolio: {portfolio_id}")
        
        with transaction.atomic():
            try:
                portfolio = Portfolio.objects.get(id=portfolio_id)
            except Portfolio.DoesNotExist:
                logger.error(f"❌ [PortfolioMedia][Sync] Error: Portfolio {portfolio_id} not found")
                raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])
            
            has_segmented = any(x is not None for x in [image_ids, video_ids, audio_ids, document_ids])
            
            if not has_segmented:
                media_ids_list = list(set(media_ids)) if media_ids else []
                logger.info(f"🔄 [PortfolioMedia][Sync] Legacy Mode - IDs: {media_ids_list}")
                
                current_image_ids = set(PortfolioImage.objects.filter(portfolio_id=portfolio_id).values_list('image_id', flat=True))
                current_video_ids = set(PortfolioVideo.objects.filter(portfolio_id=portfolio_id).values_list('video_id', flat=True))
                current_audio_ids = set(PortfolioAudio.objects.filter(portfolio_id=portfolio_id).values_list('audio_id', flat=True))
                current_document_ids = set(PortfolioDocument.objects.filter(portfolio_id=portfolio_id).values_list('document_id', flat=True))
                
                all_current_ids = current_image_ids | current_video_ids | current_audio_ids | current_document_ids
                media_ids_set = set(media_ids_list)
                
                media_to_remove = all_current_ids - media_ids_set
                media_to_add_ids = list(media_ids_set - all_current_ids)
                
                if media_to_remove:
                    logger.info(f"🗑️ [PortfolioMedia][Sync] Removing {len(media_to_remove)} media items")
                    PortfolioImage.objects.filter(portfolio_id=portfolio_id, image_id__in=media_to_remove).delete()
                    PortfolioVideo.objects.filter(portfolio_id=portfolio_id, video_id__in=media_to_remove).delete()
                    PortfolioAudio.objects.filter(portfolio_id=portfolio_id, audio_id__in=media_to_remove).delete()
                    PortfolioDocument.objects.filter(portfolio_id=portfolio_id, document_id__in=media_to_remove).delete()

                if media_to_add_ids:
                    logger.info(f"➕ [PortfolioMedia][Sync] Adding {len(media_to_add_ids)} media items")
                    PortfolioAdminMediaService.add_media_bulk(portfolio_id, media_ids=media_to_add_ids)
            
            else:
                logger.info("🔄 [PortfolioMedia][Sync] Segmented Mode Active")
                
                TYPE_CONFIG = [
                    ('image', PortfolioImage, image_ids, 'image_id'),
                    ('video', PortfolioVideo, video_ids, 'video_id'),
                    ('audio', PortfolioAudio, audio_ids, 'audio_id'),
                    ('document', PortfolioDocument, document_ids, 'document_id'),
                ]

                for label, model, target_ids, id_field in TYPE_CONFIG:
                    if target_ids is not None:
                        logger.debug(f"🔍 [PortfolioMedia][Sync] Processing {label}s: {target_ids}")
                        current = set(model.objects.filter(portfolio_id=portfolio_id).values_list(id_field, flat=True))
                        to_add = set(target_ids) - current
                        to_remove = current - set(target_ids)
                        
                        if to_remove: 
                            model.objects.filter(portfolio_id=portfolio_id, **{f"{id_field}__in": to_remove}).delete()
                        
                        if to_add:
                            logger.info(f"➕ [PortfolioMedia][Sync] Adding {len(to_add)} {label}s: {to_add}")
                            PortfolioAdminMediaService.add_media_bulk(portfolio_id, **{f"{label}_ids": list(to_add)})

            if main_image_id:
                logger.info(f"🖼️ [PortfolioMedia][Sync] Setting main image: {main_image_id}")
                PortfolioAdminMediaService.set_main_image(portfolio_id, main_image_id)

            if any([media_covers, image_covers, video_covers, audio_covers, document_covers]):
                PortfolioAdminMediaService._update_portfolio_media_covers(
                    portfolio_id, 
                    media_covers=media_covers,
                    image_covers=image_covers,
                    video_covers=video_covers,
                    audio_covers=audio_covers,
                    document_covers=document_covers
                )

            PortfolioCacheManager.invalidate_portfolio(portfolio_id)
            
        logger.info(f"✅ [PortfolioMedia][Sync] Completed successfully for Portfolio: {portfolio_id}")
        return True

    @staticmethod
    def set_main_image(portfolio_id, media_id):
        
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])

        with transaction.atomic():
            PortfolioImage.objects.filter(portfolio_id=portfolio_id, is_main=True).update(is_main=False)
            
            portfolio_image = PortfolioImage.objects.filter(portfolio_id=portfolio_id, image_id=media_id).first()
            
            if portfolio_image:
                portfolio_image.is_main = True
                portfolio_image.save(update_fields=['is_main'])
                
                if not portfolio.og_image:
                    portfolio.og_image = portfolio_image.image
                    portfolio.save(update_fields=['og_image'])
            else:
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
                    raise ValidationError(PORTFOLIO_ERRORS["media_image_not_found"])

            PortfolioCacheManager.invalidate_portfolio(portfolio_id)
            return True
    
    @staticmethod
    def _update_portfolio_media_covers(portfolio_id, media_covers=None,
                                       image_covers=None, video_covers=None, audio_covers=None, document_covers=None):

        CONFIG = [
            (PortfolioImage, 'image_id', image_covers),
            (PortfolioVideo, 'video_id', video_covers),
            (PortfolioAudio, 'audio_id', audio_covers),
            (PortfolioDocument, 'document_id', document_covers),
        ]

        for model, id_field, covers in CONFIG:
            if covers:
                logger.info(f"� [PortfolioMedia][Sync] Updating {len(covers)} {model.__name__} covers")
                media_ids = [int(mid) for mid in covers.keys()]
                PortfolioAdminMediaService._bulk_update_covers(
                    model, portfolio_id, media_ids, covers, id_field
                )

        if media_covers:
            logger.info(f"🎨 [PortfolioMedia][Sync] Processing legacy media covers (potential collisions)")
            LEGACY_MAP = [
                (PortfolioVideo, 'video_id'),
                (PortfolioAudio, 'audio_id'),
                (PortfolioDocument, 'document_id'),
            ]

            for model, id_field in LEGACY_MAP:
                current_ids = set(model.objects.filter(portfolio_id=portfolio_id).values_list(id_field, flat=True))
                valid_ids = [int(mid) for mid in media_covers.keys() if int(mid) in current_ids]
                
                if valid_ids:
                    PortfolioAdminMediaService._bulk_update_covers(
                        model, portfolio_id, valid_ids, media_covers, id_field
                    )

    @staticmethod
    def _bulk_update_covers(model_class, portfolio_id, media_ids, media_covers, id_field):

        items = list(model_class.objects.filter(portfolio_id=portfolio_id, **{f"{id_field}__in": media_ids}))
        
        to_update = []
        for item in items:
            mid = getattr(item, id_field)
            cover_id = media_covers.get(str(mid)) or media_covers.get(mid)
            
            item.cover_image_id = cover_id
            to_update.append(item)
            
        if to_update:
            model_class.objects.bulk_update(to_update, ['cover_image'])
            logger.info(f"   ✅ Optimized update for {len(to_update)} {model_class.__name__} covers")

    @staticmethod
    def _update_media_cover(model_class, media_type, portfolio_id, media_id, cover_image_id, **filter_kwargs):
        try:
            portfolio_media = model_class.objects.filter(
                portfolio_id=portfolio_id,
                **filter_kwargs
            ).first()
            
            if portfolio_media:
                portfolio_media.cover_image_id = cover_image_id
                portfolio_media.save(update_fields=['cover_image'])
        except Exception as e:
            logger.error(f"Error updating single media cover: {str(e)}")
