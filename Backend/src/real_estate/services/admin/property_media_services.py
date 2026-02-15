import logging
from django.db import transaction
from django.db.models import Max, Q
from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

from src.real_estate.models.property import Property
from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
from src.real_estate.utils.cache import PropertyCacheManager
from src.real_estate.messages.messages import PROPERTY_ERRORS
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
    def add_media_bulk(property_id, media_files=None, media_ids=None, 
                       image_ids=None, video_ids=None, audio_ids=None, document_ids=None,
                       created_by=None):
        logger.info(f"🏠 [PropertyMedia][AddBulk] Starting - Property ID: {property_id}")
        logger.debug(f"🏠 [PropertyMedia][AddBulk] media_files count: {len(media_files) if media_files else 0}, media_ids: {media_ids}")
        
        try:
            property_obj = Property.objects.get(id=property_id)
            logger.info(f"✅ [PropertyMedia][AddBulk] Found property: {property_obj.title}")
        except Property.DoesNotExist:
            logger.error(f"❌ [PropertyMedia][AddBulk] ERROR: Property not found with ID {property_id}")
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])
            
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
        
        if any([media_ids, image_ids, video_ids, audio_ids, document_ids]):
            media_ids_list = list(set(media_ids)) if media_ids else []
            image_ids_list = list(set(image_ids)) if image_ids else []
            video_ids_list = list(set(video_ids)) if video_ids else []
            audio_ids_list = list(set(audio_ids)) if audio_ids else []
            document_ids_list = list(set(document_ids)) if document_ids else []
            
            all_target_ids = list(set(media_ids_list + image_ids_list + video_ids_list + audio_ids_list + document_ids_list))
            
            im_objs, vi_objs, au_objs, do_objs = PropertyAdminMediaService.get_media_by_ids(all_target_ids)
            
            image_dict = {m.id: m for m in im_objs}
            video_dict = {m.id: m for m in vi_objs}
            audio_dict = {m.id: m for m in au_objs}
            document_dict = {m.id: m for m in do_objs}
            
            ex_im, ex_vi, ex_au, ex_do = PropertyAdminMediaService.get_existing_property_media(property_id, all_target_ids)
            
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
                next_order = PropertyAdminMediaService.get_next_media_order(property_id)
                
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
    def sync_media(property_id, media_ids=None,
                   image_ids=None, video_ids=None, audio_ids=None, document_ids=None,
                   main_image_id=None, media_covers=None,
                   image_covers=None, video_covers=None, audio_covers=None, document_covers=None):

        logger.info(f"🔄 [PropertyMedia][Sync] Starting - Property: {property_id}")
        
        with transaction.atomic():
            try:
                property_obj = Property.objects.get(id=property_id)
            except Property.DoesNotExist:
                logger.error(f"❌ [PropertyMedia][Sync] Error: Property {property_id} not found")
                raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])
            
            has_segmented = any(x is not None for x in [image_ids, video_ids, audio_ids, document_ids])
            
            if not has_segmented:
                media_ids_list = list(set(media_ids)) if media_ids else []
                logger.info(f"🔄 [PropertyMedia][Sync] Legacy Mode - IDs: {media_ids_list}")
                
                current_image_ids = set(PropertyImage.objects.filter(property_id=property_id).values_list('image_id', flat=True))
                current_video_ids = set(PropertyVideo.objects.filter(property_id=property_id).values_list('video_id', flat=True))
                current_audio_ids = set(PropertyAudio.objects.filter(property_id=property_id).values_list('audio_id', flat=True))
                current_document_ids = set(PropertyDocument.objects.filter(property_id=property_id).values_list('document_id', flat=True))
                
                all_current_ids = current_image_ids | current_video_ids | current_audio_ids | current_document_ids
                media_ids_set = set(media_ids_list)
                
                media_to_remove = all_current_ids - media_ids_set
                media_to_add_ids = list(media_ids_set - all_current_ids)
                
                if media_to_remove:
                    logger.info(f"🗑️ [PropertyMedia][Sync] Removing {len(media_to_remove)} media items")
                    PropertyImage.objects.filter(property_id=property_id, image_id__in=media_to_remove).delete()
                    PropertyVideo.objects.filter(property_id=property_id, video_id__in=media_to_remove).delete()
                    PropertyAudio.objects.filter(property_id=property_id, audio_id__in=media_to_remove).delete()
                    PropertyDocument.objects.filter(property_id=property_id, document_id__in=media_to_remove).delete()

                if media_to_add_ids:
                    logger.info(f"➕ [PropertyMedia][Sync] Adding {len(media_to_add_ids)} media items")
                    PropertyAdminMediaService.add_media_bulk(property_id, media_ids=media_to_add_ids)
            
            else:
                logger.info("🔄 [PropertyMedia][Sync] Segmented Mode Active")
                
                TYPE_CONFIG = [
                    ('image', PropertyImage, image_ids, 'image_id'),
                    ('video', PropertyVideo, video_ids, 'video_id'),
                    ('audio', PropertyAudio, audio_ids, 'audio_id'),
                    ('document', PropertyDocument, document_ids, 'document_id'),
                ]

                for label, model, target_ids, id_field in TYPE_CONFIG:
                    if target_ids is not None:
                        logger.debug(f"🔍 [PropertyMedia][Sync] Processing {label}s: {target_ids}")
                        current = set(model.objects.filter(property_id=property_id).values_list(id_field, flat=True))
                        to_add = set(target_ids) - current
                        to_remove = current - set(target_ids)
                        
                        if to_remove: 
                            model.objects.filter(property_id=property_id, **{f"{id_field}__in": to_remove}).delete()
                        
                        if to_add:
                            logger.info(f"➕ [PropertyMedia][Sync] Adding {len(to_add)} {label}s: {to_add}")
                            PropertyAdminMediaService.add_media_bulk(property_id, **{f"{label}_ids": list(to_add)})

            if main_image_id:
                logger.info(f"🖼️ [PropertyMedia][Sync] Setting main image: {main_image_id}")
                PropertyAdminMediaService.set_main_image(property_id, main_image_id)

            if any([media_covers, image_covers, video_covers, audio_covers, document_covers]):
                PropertyAdminMediaService._update_property_media_covers(
                    property_id, 
                    media_covers=media_covers,
                    image_covers=image_covers,
                    video_covers=video_covers,
                    audio_covers=audio_covers,
                    document_covers=document_covers
                )

            PropertyCacheManager.invalidate_property(property_id)
            
        logger.info(f"✅ [PropertyMedia][Sync] Completed successfully for Property: {property_id}")
        return True

    @staticmethod
    def _update_property_media_covers(property_id, media_covers=None,
                                       image_covers=None, video_covers=None, audio_covers=None, document_covers=None):

        CONFIG = [
            (PropertyImage, 'image_id', image_covers),
            (PropertyVideo, 'video_id', video_covers),
            (PropertyAudio, 'audio_id', audio_covers),
            (PropertyDocument, 'document_id', document_covers),
        ]

        for model, id_field, covers in CONFIG:
            if covers:
                logger.info(f"🎨 [PropertyMedia][Sync] Updating {len(covers)} {model.__name__} covers")
                media_ids = [int(mid) for mid in covers.keys()]
                PropertyAdminMediaService._bulk_update_covers(
                    model, property_id, media_ids, covers, id_field
                )

        if media_covers:
            logger.info(f"🎨 [PropertyMedia][Sync] Processing legacy media covers (potential collisions)")
            LEGACY_MAP = [
                (PropertyVideo, 'video_id'),
                (PropertyAudio, 'audio_id'),
                (PropertyDocument, 'document_id'),
            ]

            for model, id_field in LEGACY_MAP:
                current_ids = set(model.objects.filter(property_id=property_id).values_list(id_field, flat=True))
                valid_ids = [int(mid) for mid in media_covers.keys() if int(mid) in current_ids]
                
                if valid_ids:
                    PropertyAdminMediaService._bulk_update_covers(
                        model, property_id, valid_ids, media_covers, id_field
                    )

    @staticmethod
    def _bulk_update_covers(model_class, property_id, media_ids, media_covers, id_field):

        items = list(model_class.objects.filter(property_id=property_id, **{f"{id_field}__in": media_ids}))
        
        to_update = []
        for item in items:
            mid = getattr(item, id_field)
            cover_id = media_covers.get(str(mid)) or media_covers.get(mid)
            
            item.cover_image_id = cover_id
            to_update.append(item)
            
        if to_update:
            model_class.objects.bulk_update(to_update, ['cover_image'])
            logger.info(f"   ✅ Optimized update for {len(to_update)} {model_class.__name__} covers")
            
            PropertyCacheManager.invalidate_property(property_id)
        
        return True

    @staticmethod
    def set_main_image(property_id, media_id):
        
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist(PROPERTY_ERRORS["property_not_found"])

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
                    raise ValidationError({'image_id': [PROPERTY_ERRORS["media_image_not_found"]]})

            PropertyCacheManager.invalidate_property(property_id)
            return True

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
