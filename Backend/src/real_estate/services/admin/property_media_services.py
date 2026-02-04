import logging
from django.db import transaction
from django.db.models import Max, Q
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

from src.real_estate.models.property import Property
from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
from src.real_estate.utils.cache import PropertyCacheManager
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia, detect_media_type_from_extension
from src.media.services.media_services import MediaAdminService


class PropertyAdminMediaService:
    @staticmethod
    def get_main_image_for_model(property_obj):
        
        main_image_obj = PropertyImage.objects.filter(
            property=property_obj,
            is_main=True
        ).select_related('image').first()
        
        if main_image_obj and main_image_obj.image:
            return main_image_obj.image

        first_image = PropertyImage.objects.filter(
            property=property_obj
        ).select_related('image').order_by('order', 'created_at').first()
        if first_image and first_image.image:
            return first_image.image

        first_video = PropertyVideo.objects.filter(
            property=property_obj
        ).select_related('video__cover_image').order_by('order', 'created_at').first()
        if first_video and first_video.video and first_video.video.cover_image:
            return first_video.video.cover_image

        audio = PropertyAudio.objects.filter(
            property=property_obj
        ).select_related('audio__cover_image').first()
        if audio and audio.audio and audio.audio.cover_image:
            return audio.audio.cover_image
            
        doc = PropertyDocument.objects.filter(
            property=property_obj
        ).select_related('document__cover_image').first()
        if doc and doc.document and doc.document.cover_image:
            return doc.document.cover_image

        return None

    @staticmethod
    def get_next_media_order(property_id):
        from src.media.utils.media_helpers import get_combined_max_order
        try:
            property_obj = Property.objects.get(id=property_id)
            return get_combined_max_order(property_obj, 'images', 'videos', 'audios', 'documents')
        except Property.DoesNotExist:
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
    def get_existing_property_media(property_id, media_ids):
        if not media_ids:
            return set(), set(), set(), set()
        
        media_ids_list = list(media_ids) if not isinstance(media_ids, list) else media_ids
        
        existing_image_ids = set(
            PropertyImage.objects.filter(
                property_id=property_id,
                image_id__in=media_ids_list
            ).values_list('image_id', flat=True)
        )
        
        existing_video_ids = set(
            PropertyVideo.objects.filter(
                property_id=property_id,
                video_id__in=media_ids_list
            ).values_list('video_id', flat=True)
        )
        
        existing_audio_ids = set(
            PropertyAudio.objects.filter(
                property_id=property_id,
                audio_id__in=media_ids_list
            ).values_list('audio_id', flat=True)
        )
        
        existing_document_ids = set(
            PropertyDocument.objects.filter(
                property_id=property_id,
                document_id__in=media_ids_list
            ).values_list('document_id', flat=True)
        )
        
        return existing_image_ids, existing_video_ids, existing_audio_ids, existing_document_ids

    @staticmethod
    def add_media_bulk(property_id, media_files=None, media_ids=None, created_by=None, media_type_map=None):
        logger.info(f"🏠 [PropertyMedia][AddBulk] Starting - Property ID: {property_id}")
        logger.debug(f"🏠 [PropertyMedia][AddBulk] media_files count: {len(media_files) if media_files else 0}, media_ids: {media_ids}")
        
        try:
            property_obj = Property.objects.get(id=property_id)
            logger.info(f"✅ [PropertyMedia][AddBulk] Found property: {property_obj.title}")
        except Property.DoesNotExist:
            logger.error(f"❌ [PropertyMedia][AddBulk] ERROR: Property not found with ID {property_id}")
            raise Property.DoesNotExist("Property not found")
            
        media_files = media_files or []
        media_ids = media_ids or []
        
        created_count = 0
        failed_ids = []
        
        failed_files = []
        uploaded_medias = []
        # ... (media_files handling logic remains same)
        if media_files:
            logger.info(f"📤 [PropertyMedia][AddBulk] Processing {len(media_files)} uploaded files...")
            for i, media_file in enumerate(media_files):
                try:
                    file_ext = media_file.name.lower().split('.')[-1] if '.' in media_file.name else ''
                    media_type = detect_media_type_from_extension(file_ext)
                    logger.debug(f"   📄 File {i+1}: {media_file.name} -> Type: {media_type}")
                    
                    media = MediaAdminService.create_media(media_type, {
                        'file': media_file,
                        'title': f"Media for {property_obj.title}",
                    })
                    uploaded_medias.append((media, media_type))
                    logger.info(f"   ✅ Created media ID: {media.id} ({media_type})")
                except Exception as e:
                    logger.error(f"   ❌ Failed to create media from file {media_file.name}: {str(e)}")
                    failed_files.append({
                        'name': media_file.name,
                        'error': str(e)
                    })
                    continue
            
            if uploaded_medias:
                next_order = PropertyAdminMediaService.get_next_media_order(property_id)
                logger.debug(f"📊 [PropertyMedia][AddBulk] Next order number: {next_order}")
                
                has_main_image = PropertyImage.objects.filter(
                    property=property_obj,
                    is_main=True
                ).exists()
                logger.debug(f"🖼️  [PropertyMedia][AddBulk] Has main image: {has_main_image}")
                
                property_media_objects = []
                for i, (media, media_type) in enumerate(uploaded_medias):
                    if media_type == 'image':
                        should_be_main = (i == 0) and not has_main_image
                        
                        property_media_objects.append(
                            PropertyImage(
                                property=property_obj,
                                image=media,
                                is_main=should_be_main,
                                order=next_order + i
                            )
                        )
                        logger.debug(f"   🖼️  Image {media.id}: is_main={should_be_main}, order={next_order + i}")
                        
                        if should_be_main:
                            has_main_image = True
                    elif media_type == 'video':
                        property_media_objects.append(
                            PropertyVideo(
                                property=property_obj,
                                video=media,
                                order=next_order + i
                            )
                        )
                        logger.debug(f"   🎥 Video {media.id}: order={next_order + i}")
                    elif media_type == 'audio':
                        property_media_objects.append(
                            PropertyAudio(
                                property=property_obj,
                                audio=media,
                                order=next_order + i
                            )
                        )
                        logger.debug(f"   🎵 Audio {media.id}: order={next_order + i}")
                    elif media_type == 'pdf':
                        property_media_objects.append(
                            PropertyDocument(
                                property=property_obj,
                                document=media,
                                order=next_order + i
                            )
                        )
                        logger.debug(f"   📄 Document {media.id}: order={next_order + i}")
                
                if property_media_objects:
                    images = [obj for obj in property_media_objects if isinstance(obj, PropertyImage)]
                    videos = [obj for obj in property_media_objects if isinstance(obj, PropertyVideo)]
                    audios = [obj for obj in property_media_objects if isinstance(obj, PropertyAudio)]
                    documents = [obj for obj in property_media_objects if isinstance(obj, PropertyDocument)]
                    
                    logger.info(f"💾 [PropertyMedia][AddBulk] Bulk creating:")
                    logger.info(f"   Images: {len(images)}, Videos: {len(videos)}, Audios: {len(audios)}, Documents: {len(documents)}")
                    
                    if images:
                        PropertyImage.objects.bulk_create(images)
                        print(f"   ✅ Created {len(images)} PropertyImage records")
                    if videos:
                        PropertyVideo.objects.bulk_create(videos)
                        print(f"   ✅ Created {len(videos)} PropertyVideo records")
                    if audios:
                        PropertyAudio.objects.bulk_create(audios)
                        print(f"   ✅ Created {len(audios)} PropertyAudio records")
                    if documents:
                        PropertyDocument.objects.bulk_create(documents)
                        logger.info(f"   ✅ Created {len(documents)} PropertyDocument records")
                    
                    created_count += len(property_media_objects)
        
        if media_ids:
            logger.info(f"🔗 [PropertyMedia][AddBulk] Processing {len(media_ids)} media IDs...")
            media_ids_list = list(set(media_ids)) if isinstance(media_ids, (list, tuple)) else [media_ids]
            
            image_medias, video_medias, audio_medias, document_medias = \
                PropertyAdminMediaService.get_media_by_ids(media_ids_list)
            
            logger.debug(f"   Found: {len(image_medias)} images, {len(video_medias)} videos, {len(audio_medias)} audios, {len(document_medias)} documents")
            
            image_dict = {media.id: media for media in image_medias}
            video_dict = {media.id: media for media in video_medias}
            audio_dict = {media.id: media for media in audio_medias}
            document_dict = {media.id: media for media in document_medias}
            
            existing_image_ids, existing_video_ids, existing_audio_ids, existing_document_ids = \
                PropertyAdminMediaService.get_existing_property_media(property_id, media_ids_list)
            
            all_existing_ids = existing_image_ids | existing_video_ids | existing_audio_ids | existing_document_ids
            logger.debug(f"   Already attached: {len(all_existing_ids)} media items")
            
            media_to_create = []
            
            for media_id in media_ids_list:
                if media_id in all_existing_ids:
                    logger.debug(f"   ⏭️  Skipping media ID {media_id} (already attached)")
                    continue
                
                # Determine type using map if provided, or default priority order
                # Default order: image -> video -> audio -> document
                media_type = None
                media_obj = None
                
                preferred_type = media_type_map.get(media_id) if media_type_map else None
                
                if preferred_type:
                    if preferred_type == 'image' and media_id in image_dict:
                        media_type = 'image'
                        media_obj = image_dict[media_id]
                    elif preferred_type == 'video' and media_id in video_dict:
                        media_type = 'video'
                        media_obj = video_dict[media_id]
                    elif preferred_type == 'audio' and media_id in audio_dict:
                        media_type = 'audio'
                        media_obj = audio_dict[media_id]
                    elif preferred_type in ['document', 'pdf'] and media_id in document_dict:
                        media_type = 'document'
                        media_obj = document_dict[media_id]
                
                # Fallback to default priority if no preferred type or preferred type not found
                if not media_type:
                    if media_id in image_dict:
                        media_type = 'image'
                        media_obj = image_dict[media_id]
                    elif media_id in video_dict:
                        media_type = 'video'
                        media_obj = video_dict[media_id]
                    elif media_id in audio_dict:
                        media_type = 'audio'
                        media_obj = audio_dict[media_id]
                    elif media_id in document_dict:
                        media_type = 'document'
                        media_obj = document_dict[media_id]
                
                if media_type and media_obj:
                    media_to_create.append((media_type, media_obj))
                    logger.debug(f"   ➕ Will attach {media_type} ID {media_id}")
                else:
                    logger.warning(f"   ❌ Media ID {media_id} not found in any media type (or preferred type mismatch)")
                    failed_ids.append(media_id)

            if media_to_create:
                next_order = PropertyAdminMediaService.get_next_media_order(property_id)
                logger.debug(f"📊 [PropertyMedia][AddBulk] Next order for existing media: {next_order}")
                
                has_main_image = PropertyImage.objects.filter(
                    property=property_obj,
                    is_main=True
                ).exists()
                
                property_media_objects = []
                for i, (media_type, media) in enumerate(media_to_create):
                    if media_type == 'image':
                        should_be_main = not has_main_image
                        
                        property_media_objects.append(
                            PropertyImage(
                                property=property_obj,
                                image=media,
                                is_main=should_be_main,
                                order=next_order + i
                            )
                        )
                        
                        if should_be_main:
                            has_main_image = True
                    elif media_type == 'video':
                        property_media_objects.append(
                            PropertyVideo(
                                property=property_obj,
                                video=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'audio':
                        property_media_objects.append(
                            PropertyAudio(
                                property=property_obj,
                                audio=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'document':
                        property_media_objects.append(
                            PropertyDocument(
                                property=property_obj,
                                document=media,
                                order=next_order + i
                            )
                        )
                
                if property_media_objects:
                    images = [obj for obj in property_media_objects if isinstance(obj, PropertyImage)]
                    videos = [obj for obj in property_media_objects if isinstance(obj, PropertyVideo)]
                    audios = [obj for obj in property_media_objects if isinstance(obj, PropertyAudio)]
                    documents = [obj for obj in property_media_objects if isinstance(obj, PropertyDocument)]
                    
                    logger.info(f"💾 [PropertyMedia][AddBulk] Bulk creating from existing media:")
                    logger.info(f"   Images: {len(images)}, Videos: {len(videos)}, Audios: {len(audios)}, Documents: {len(documents)}")
                    
                    if images:
                        PropertyImage.objects.bulk_create(images)
                    if videos:
                        PropertyVideo.objects.bulk_create(videos)
                    if audios:
                        PropertyAudio.objects.bulk_create(audios)
                    if documents:
                        PropertyDocument.objects.bulk_create(documents)
                    
                    created_count += len(property_media_objects)
        
        if created_count > 0 or media_ids:
            has_main_image = PropertyImage.objects.filter(
                property_id=property_id,
                is_main=True
            ).exists()
            
            if not has_main_image:
                logger.info(f"🔍 [PropertyMedia][AddBulk] No main image, finding first image...")
                first_image = PropertyImage.objects.filter(
                    property_id=property_id
                ).select_related('image').order_by('is_main', '-order', 'created_at').first()
                
                if first_image:
                    first_image.is_main = True
                    first_image.save(update_fields=['is_main'])
                    logger.info(f"   ✅ Set image ID {first_image.image_id} as main")
                    
                    if not property_obj.og_image:
                        property_obj.og_image = first_image.image
                        property_obj.save(update_fields=['og_image'])
                        logger.info(f"   ✅ Set OG image to {first_image.image_id}")
                
                PropertyCacheManager.invalidate_property(property_id)
        
        logger.info(f"✅ [PropertyMedia][AddBulk] Complete - Created: {created_count}, Failed: {len(failed_ids) + len(failed_files)}")
        
        return {
            'created_count': created_count,
            'uploaded_media_ids': [m.id for m, t in uploaded_medias] if 'uploaded_medias' in locals() else [],
            'failed_ids': failed_ids,
            'failed_files': failed_files
        }
    
    @staticmethod
    def sync_media(property_id, media_ids, main_image_id=None, media_covers=None):
        logger.info(f"🔄 [PropertyMedia][SyncMedia] Starting - Property ID: {property_id}")
        logger.debug(f"🔄 [PropertyMedia][SyncMedia] media_ids: {media_ids}, main_image_id: {main_image_id}, covers: {media_covers}")
        
        try:
            property_obj = Property.objects.get(id=property_id)
            logger.info(f"✅ [PropertyMedia][SyncMedia] Found property: {property_obj.title}")
        except Property.DoesNotExist:
            logger.error(f"❌ [PropertyMedia][SyncMedia] ERROR: Property not found")
            raise Property.DoesNotExist("Property not found")
        
        media_to_remove = set()
        media_to_add = set()
        media_ids_count = 0
        
        if media_ids is not None:
            media_ids = media_ids if isinstance(media_ids, (list, tuple)) else []
            media_ids_set = set(media_ids)
            media_ids_count = len(media_ids_set)
            logger.info(f"📊 [PropertyMedia][SyncMedia] Requested media_ids count: {media_ids_count}")
            
            image_ids, video_ids, audio_ids, document_ids = PropertyAdminMediaService.get_existing_property_media(property_id, [])
            
            # Re-fetch all current IDs to be sure we have everything attached
            current_image_ids = set(PropertyImage.objects.filter(property_id=property_id).values_list('image_id', flat=True))
            current_video_ids = set(PropertyVideo.objects.filter(property_id=property_id).values_list('video_id', flat=True))
            current_audio_ids = set(PropertyAudio.objects.filter(property_id=property_id).values_list('audio_id', flat=True))
            current_document_ids = set(PropertyDocument.objects.filter(property_id=property_id).values_list('document_id', flat=True))
            
            logger.debug(f"📊 [PropertyMedia][SyncMedia] Current attached media:")
            logger.debug(f"   Images: {current_image_ids}")
            logger.debug(f"   Videos: {current_video_ids}")
            logger.debug(f"   Audios: {current_audio_ids}")
            logger.debug(f"   Documents: {current_document_ids}")
            
            all_current_ids = current_image_ids | current_video_ids | current_audio_ids | current_document_ids
            
            media_to_remove = all_current_ids - media_ids_set
            media_to_add = media_ids_set - all_current_ids
            
            logger.info(f"🔍 [PropertyMedia][SyncMedia] Sync analysis:")
            logger.info(f"   To remove: {media_to_remove}")
            logger.info(f"   To add: {media_to_add}")
            
            if not media_ids_set:
                media_to_remove = all_current_ids
                media_to_add = set()
                logger.warning(f"   ⚠️  Empty media_ids - will remove all media")
        
        with transaction.atomic():
            if media_ids is not None:
                current_main_image_id = None
                if current_image_ids:
                    main_image_obj = PropertyImage.objects.filter(
                        property_id=property_id,
                        is_main=True
                    ).first()
                    if main_image_obj:
                        current_main_image_id = main_image_obj.image_id
                        logger.debug(f"🖼️  [PropertyMedia][SyncMedia] Current main image: {current_main_image_id}")
                
                if media_to_remove:
                    logger.info(f"🗑️  [PropertyMedia][SyncMedia] Removing {len(media_to_remove)} media items...")
                    image_ids_to_remove = media_to_remove & current_image_ids
                    if image_ids_to_remove:
                        print(f"   Removing images: {image_ids_to_remove}")
                        if current_main_image_id and current_main_image_id in image_ids_to_remove:
                            PropertyImage.objects.filter(
                                property_id=property_id,
                                is_main=True
                            ).update(is_main=False)
                            current_main_image_id = None
                            logger.info(f"   ⚠️  Removed main image")
                        
                        PropertyImage.objects.filter(
                            property_id=property_id,
                            image_id__in=image_ids_to_remove
                        ).delete()
                        logger.info(f"   ✅ Deleted {len(image_ids_to_remove)} PropertyImage records")
                    
                    video_ids_to_remove = media_to_remove & current_video_ids
                    if video_ids_to_remove:
                        print(f"   Removing videos: {video_ids_to_remove}")
                        PropertyVideo.objects.filter(
                            property_id=property_id,
                            video_id__in=video_ids_to_remove
                        ).delete()
                        logger.info(f"   ✅ Deleted {len(video_ids_to_remove)} PropertyVideo records")
                    
                    audio_ids_to_remove = media_to_remove & current_audio_ids
                    if audio_ids_to_remove:
                        print(f"   Removing audios: {audio_ids_to_remove}")
                        PropertyAudio.objects.filter(
                            property_id=property_id,
                            audio_id__in=audio_ids_to_remove
                        ).delete()
                        logger.info(f"   ✅ Deleted {len(audio_ids_to_remove)} PropertyAudio records")
                    
                    document_ids_to_remove = media_to_remove & current_document_ids
                    if document_ids_to_remove:
                        print(f"   Removing documents: {document_ids_to_remove}")
                        PropertyDocument.objects.filter(
                            property_id=property_id,
                            document_id__in=document_ids_to_remove
                        ).delete()
                        logger.info(f"   ✅ Deleted {len(document_ids_to_remove)} PropertyDocument records")

            if main_image_id is not None:
                logger.debug(f"🖼️  [PropertyMedia][SyncMedia] Setting main image to: {main_image_id}")
                PropertyImage.objects.filter(
                    property_id=property_id,
                    is_main=True
                ).update(is_main=False)
                
                property_image = PropertyImage.objects.filter(
                    property_id=property_id,
                    image_id=main_image_id
                ).first()
                
                if property_image:
                    property_image.is_main = True
                    property_image.save(update_fields=['is_main'])
                    logger.info(f"   ✅ Set main image successfully")
                    
                    property_obj.refresh_from_db()
                    if not property_obj.og_image:
                        property_obj.og_image = property_image.image
                        property_obj.save(update_fields=['og_image'])
                        logger.info(f"   ✅ Set OG image")
                else:
                    logger.warning(f"   ⚠️  Main image ID {main_image_id} not found in property images")
            
            if media_to_add:
                logger.info(f"➕ [PropertyMedia][SyncMedia] Adding {len(media_to_add)} new media items...")
                PropertyAdminMediaService.add_media_bulk(
                    property_id=property_id,
                    media_ids=list(media_to_add)
                )
                
                if main_image_id is not None and main_image_id in media_to_add:
                    logger.info(f"   🖼️  Setting newly added image {main_image_id} as main...")
                    property_image = PropertyImage.objects.filter(
                        property_id=property_id,
                        image_id=main_image_id
                    ).first()
                    
                    if property_image:
                        PropertyImage.objects.filter(
                            property_id=property_id,
                            is_main=True
                        ).exclude(image_id=main_image_id).update(is_main=False)
                        
                        property_image.is_main = True
                        property_image.save(update_fields=['is_main'])
                        
                        property_obj.refresh_from_db()
                        if not property_obj.og_image:
                            property_obj.og_image = property_image.image
                            property_obj.save(update_fields=['og_image'])
                        logger.info(f"   ✅ Set newly added image as main")
            
            if media_covers:
                logger.info(f"🎨 [PropertyMedia][SyncMedia] Updating media covers...")
                
                # REFRESH IDs because they might have changed (rectified/added)
                # We need FRESH current_*_ids for the update_media_covers check
                
                fresh_video_ids = set(
                    PropertyVideo.objects.filter(property_id=property_id).values_list('video_id', flat=True)
                )
                fresh_audio_ids = set(
                    PropertyAudio.objects.filter(property_id=property_id).values_list('audio_id', flat=True)
                )
                fresh_document_ids = set(
                    PropertyDocument.objects.filter(property_id=property_id).values_list('document_id', flat=True)
                )
                
                # Image IDs usually don't need refreshing for covers as images don't have covers, 
                # but let's be consistent if needed. Actually images use 'is_main'.
                # The update_property_media_covers logic uses these sets to know WHERE to look.
                
                # Re-calculate all_current_ids might not be strictly necessary if update_property_media_covers 
                # iterates media_covers keys, but let's pass fresh sets for the 'in' checks.
                
                fresh_all_current_ids = fresh_video_ids | fresh_audio_ids | fresh_document_ids | set(
                    PropertyImage.objects.filter(property_id=property_id).values_list('image_id', flat=True)
                )

                PropertyAdminMediaService._update_property_media_covers(
                    property_id=property_id,
                    media_covers=media_covers,
                    all_current_ids=fresh_all_current_ids,
                    current_video_ids=fresh_video_ids,
                    current_audio_ids=fresh_audio_ids,
                    current_document_ids=fresh_document_ids
                )
                logger.info(f"   ✅ Updated {len(media_covers)} media covers")
            
            PropertyCacheManager.invalidate_property(property_id)
        
        logger.info(f"✅ [PropertyMedia][SyncMedia] Complete - Removed: {len(media_to_remove)}, Added: {len(media_to_add)}")
        
        return {
            'removed_count': len(media_to_remove),
            'added_count': len(media_to_add),
            'total_count': media_ids_count
        }

    @staticmethod
    def set_main_image(property_id, media_id):
        
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist("Property not found")

        with transaction.atomic():
            PropertyImage.objects.filter(property_id=property_id, is_main=True).update(is_main=False)
            
            property_image = PropertyImage.objects.filter(property_id=property_id, image_id=media_id).first()
            
            if property_image:
                property_image.is_main = True
                property_image.save(update_fields=['is_main'])
                
                if not property_obj.og_image:
                    property_obj.og_image = property_image.image
                    property_obj.save(update_fields=['og_image'])
            else:
                from src.media.models.media import ImageMedia
                try:
                    media_image = ImageMedia.objects.get(id=media_id)
                    PropertyImage.objects.create(
                        property=property_obj,
                        image=media_image,
                        is_main=True,
                        order=0
                    )
                    if not property_obj.og_image:
                        property_obj.og_image = media_image
                        property_obj.save(update_fields=['og_image'])
                except ImageMedia.DoesNotExist:
                    raise ValidationError("Media image not found")

            PropertyCacheManager.invalidate_property(property_id)
            return True
    
    @staticmethod
    def _update_property_media_covers(property_id, media_covers, all_current_ids, 
                                       current_video_ids, current_audio_ids, current_document_ids):
        for media_id_str, cover_image_id in media_covers.items():
            try:
                media_id = int(media_id_str) if isinstance(media_id_str, str) else media_id_str
            except (ValueError, TypeError):
                continue
            
            if media_id not in all_current_ids:
                continue
            
            if media_id in current_video_ids:
                PropertyAdminMediaService._update_media_cover(
                    PropertyVideo, 'video', property_id, media_id, cover_image_id, video_id=media_id
                )
            elif media_id in current_audio_ids:
                PropertyAdminMediaService._update_media_cover(
                    PropertyAudio, 'audio', property_id, media_id, cover_image_id, audio_id=media_id
                )
            elif media_id in current_document_ids:
                PropertyAdminMediaService._update_media_cover(
                    PropertyDocument, 'document', property_id, media_id, cover_image_id, document_id=media_id
                )
    
    @staticmethod
    def _update_media_cover(model_class, media_type, property_id, media_id, cover_image_id, **filter_kwargs):
        try:
            property_media = model_class.objects.filter(
                property_id=property_id,
                **filter_kwargs
            ).first()
            
            if property_media:
                if cover_image_id:
                    cover_image = ImageMedia.objects.filter(id=cover_image_id).first()
                    property_media.cover_image = cover_image if cover_image else None
                else:
                    property_media.cover_image = None
                property_media.save(update_fields=['cover_image'])
        except Exception:
            pass
