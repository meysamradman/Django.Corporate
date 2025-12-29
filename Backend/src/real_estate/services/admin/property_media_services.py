from django.db import transaction
from django.db.models import Max, Q
from django.core.cache import cache
from src.real_estate.models.property import Property
from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
from src.real_estate.utils.cache import PropertyCacheManager
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia, detect_media_type_from_extension
from src.media.services.media_services import MediaAdminService


class PropertyAdminMediaService:

    @staticmethod
    def get_main_image_for_model(property_instance):
        """
        دریافت تصویر اصلی ملک با cache
        این method منطق پیچیده را از model جدا می‌کنه
        """
        from src.real_estate.utils.cache import PropertyCacheKeys
        
        cache_key = PropertyCacheKeys.main_image(property_instance.pk)
        main_image_id = cache.get(cache_key)
        
        if main_image_id is None:
            try:
                # 1. جستجوی تصویر اصلی
                main_media = property_instance.images.select_related('image').filter(is_main=True).first()
                if main_media:
                    main_image = main_media.image
                else:
                    # 2. جستجوی cover ویدئو
                    video = property_instance.videos.select_related('video__cover_image').first()
                    if video and video.video.cover_image:
                        main_image = video.video.cover_image
                    else:
                        # 3. جستجوی cover audio
                        audio = property_instance.audios.select_related('audio__cover_image').first()
                        if audio and audio.audio.cover_image:
                            main_image = audio.audio.cover_image
                        else:
                            # 4. جستجوی cover document
                            document = property_instance.documents.select_related('document__cover_image').first()
                            if document and document.document.cover_image:
                                main_image = document.document.cover_image
                            else:
                                main_image = None
                
                # Cache کردن نتیجه
                if main_image:
                    cache.set(cache_key, main_image.id, 1800)  # 30 minutes
                    return main_image
                else:
                    cache.set(cache_key, False, 1800)
                    return None
            except Exception:
                cache.set(cache_key, False, 1800)
                return None
        else:
            # اگر cache داشت False، None برگردون
            if main_image_id is False:
                return None
            # وگرنه، object رو از database بگیر
            try:
                return ImageMedia.objects.get(id=main_image_id)
            except ImageMedia.DoesNotExist:
                cache.delete(cache_key)
                return None

    @staticmethod
    def get_next_media_order(property_id):
        max_order_result = Property.objects.filter(
            id=property_id
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
    def add_media_bulk(property_id, media_files=None, media_ids=None, created_by=None):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist("Property not found")
        
        media_files = media_files or []
        media_ids = media_ids or []
        
        created_count = 0
        failed_ids = []
        failed_files = []
        
        if media_files:
            uploaded_medias = []
            for media_file in media_files:
                try:
                    media_type = detect_media_type_from_extension(media_file.name)
                    uploaded_media = MediaAdminService.upload_media(
                        file=media_file,
                        media_type=media_type,
                        created_by=created_by
                    )
                    uploaded_medias.append(uploaded_media)
                except Exception as e:
                    failed_files.append({
                        'filename': media_file.name,
                        'error': str(e)
                    })
            
            media_ids.extend([m.id for m in uploaded_medias])
        
        if media_ids:
            media_ids_list = list(set(media_ids)) if isinstance(media_ids, (list, tuple)) else [media_ids]
            
            image_medias, video_medias, audio_medias, document_medias = PropertyAdminMediaService.get_media_by_ids(media_ids_list)
            
            image_dict = {media.id: media for media in image_medias}
            video_dict = {media.id: media for media in video_medias}
            audio_dict = {media.id: media for media in audio_medias}
            document_dict = {media.id: media for media in document_medias}
            
            existing_image_ids, existing_video_ids, existing_audio_ids, existing_document_ids = PropertyAdminMediaService.get_existing_property_media(property_id, media_ids_list)
            
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
                first_image = PropertyImage.objects.filter(
                    property_id=property_id
                ).select_related('image').order_by('is_main', 'order', 'created_at').first()
                
                if first_image:
                    first_image.is_main = True
                    first_image.save(update_fields=['is_main'])
                    
                    if not property_obj.og_image:
                        property_obj.og_image = first_image.image
                        property_obj.save(update_fields=['og_image'])
        
        PropertyCacheManager.invalidate_property(property_id)
        
        return {
            'created_count': created_count,
            'failed_ids': failed_ids,
            'failed_files': failed_files
        }

    @staticmethod
    def sync_media(property_id, media_ids=None, main_image_id=None, media_covers=None):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            raise Property.DoesNotExist("Property not found")
        
        if media_ids is None:
            return
        
        media_ids_set = set(media_ids) if isinstance(media_ids, list) else set([media_ids])
        
        existing_images = PropertyImage.objects.filter(property=property_obj)
        existing_videos = PropertyVideo.objects.filter(property=property_obj)
        existing_audios = PropertyAudio.objects.filter(property=property_obj)
        existing_documents = PropertyDocument.objects.filter(property=property_obj)
        
        existing_image_ids = set(existing_images.values_list('image_id', flat=True))
        existing_video_ids = set(existing_videos.values_list('video_id', flat=True))
        existing_audio_ids = set(existing_audios.values_list('audio_id', flat=True))
        existing_document_ids = set(existing_documents.values_list('document_id', flat=True))
        
        all_existing_ids = existing_image_ids | existing_video_ids | existing_audio_ids | existing_document_ids
        
        image_medias, video_medias, audio_medias, document_medias = PropertyAdminMediaService.get_media_by_ids(media_ids)
        
        all_media_ids = set()
        all_media_ids.update([m.id for m in image_medias])
        all_media_ids.update([m.id for m in video_medias])
        all_media_ids.update([m.id for m in audio_medias])
        all_media_ids.update([m.id for m in document_medias])
        
        ids_to_remove = all_existing_ids - all_media_ids
        ids_to_add = all_media_ids - all_existing_ids
        
        with transaction.atomic():
            if ids_to_remove:
                PropertyImage.objects.filter(property=property_obj, image_id__in=ids_to_remove).delete()
                PropertyVideo.objects.filter(property=property_obj, video_id__in=ids_to_remove).delete()
                PropertyAudio.objects.filter(property=property_obj, audio_id__in=ids_to_remove).delete()
                PropertyDocument.objects.filter(property=property_obj, document_id__in=ids_to_remove).delete()
            
            if ids_to_add:
                next_order = PropertyAdminMediaService.get_next_media_order(property_id)
                
                for image_media in image_medias:
                    if image_media.id in ids_to_add:
                        PropertyImage.objects.create(
                            property=property_obj,
                            image=image_media,
                            order=next_order
                        )
                        next_order += 1
                
                for video_media in video_medias:
                    if video_media.id in ids_to_add:
                        PropertyVideo.objects.create(
                            property=property_obj,
                            video=video_media,
                            order=next_order
                        )
                        next_order += 1
                
                for audio_media in audio_medias:
                    if audio_media.id in ids_to_add:
                        PropertyAudio.objects.create(
                            property=property_obj,
                            audio=audio_media,
                            order=next_order
                        )
                        next_order += 1
                
                for document_media in document_medias:
                    if document_media.id in ids_to_add:
                        PropertyDocument.objects.create(
                            property=property_obj,
                            document=document_media,
                            order=next_order
                        )
                        next_order += 1
            
            if main_image_id:
                PropertyImage.objects.filter(
                    property=property_obj,
                    is_main=True
                ).update(is_main=False)
                
                PropertyImage.objects.filter(
                    property=property_obj,
                    image_id=main_image_id
                ).update(is_main=True)
                
                if not property_obj.og_image:
                    try:
                        image_media = ImageMedia.objects.get(id=main_image_id)
                        property_obj.og_image = image_media
                        property_obj.save(update_fields=['og_image'])
                    except ImageMedia.DoesNotExist:
                        pass
            
            if media_covers:
                for media_id, cover_image_id in media_covers.items():
                    if cover_image_id:
                        PropertyVideo.objects.filter(
                            property=property_obj,
                            video_id=media_id
                        ).update(cover_image_id=cover_image_id)
                        
                        PropertyAudio.objects.filter(
                            property=property_obj,
                            audio_id=media_id
                        ).update(cover_image_id=cover_image_id)
                        
                        PropertyDocument.objects.filter(
                            property=property_obj,
                            document_id=media_id
                        ).update(cover_image_id=cover_image_id)
                    else:
                        PropertyVideo.objects.filter(
                            property=property_obj,
                            video_id=media_id
                        ).update(cover_image=None)
                        
                        PropertyAudio.objects.filter(
                            property=property_obj,
                            audio_id=media_id
                        ).update(cover_image=None)
                        
                        PropertyDocument.objects.filter(
                            property=property_obj,
                            document_id=media_id
                        ).update(cover_image=None)
        
        PropertyCacheManager.invalidate_property(property_id)

