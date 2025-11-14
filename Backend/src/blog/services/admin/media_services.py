import logging
from django.db import transaction
from django.db.models import Max, Q
from django.core.cache import cache
from src.blog.models.blog import Blog
from src.blog.models.media import BlogImage, BlogVideo, BlogAudio, BlogDocument
from src.blog.utils.cache import BlogCacheManager
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.media.services.media_services import MediaAdminService

logger = logging.getLogger(__name__)


class BlogAdminMediaService:
    """
    Optimized service for blog media operations
    Addresses N+1 query problems and improves performance
    """

    @staticmethod
    def get_next_media_order(blog_id):
        """
        Get the next order number for media items - optimized single query
        Uses aggregation to get max order from all media types in one query
        """
        # Single optimized query with aggregation
        max_order_result = Blog.objects.filter(
            id=blog_id
        ).aggregate(
            max_image_order=Max('images__order'),
            max_video_order=Max('videos__order'),
            max_audio_order=Max('audios__order'),
            max_document_order=Max('documents__order')
        )
        
        # Get maximum efficiently - use max() on tuple for better performance
        max_order = max(
            max_order_result.get('max_image_order') or 0,
            max_order_result.get('max_video_order') or 0,
            max_order_result.get('max_audio_order') or 0,
            max_order_result.get('max_document_order') or 0
        )
        
        return max_order + 1 if max_order > 0 else 0

    @staticmethod
    def get_media_by_ids(media_ids):
        """
        Get all media objects by IDs in optimized single queries per media type
        Uses only() to fetch only needed fields for better performance
        """
        if not media_ids:
            return [], [], [], []
        
        # Convert to list and remove duplicates for better performance
        media_ids_list = list(set(media_ids)) if isinstance(media_ids, (list, tuple)) else [media_ids]
        
        # Get all media types in optimized queries (4 queries total instead of 4*N)
        # Fetch all fields for complete serialization (media_type, mime_type, file_size, etc.)
        # Note: ImageMedia doesn't have cover_image field, only VideoMedia, AudioMedia, and DocumentMedia have it
        image_medias = list(ImageMedia.objects.filter(id__in=media_ids_list))
        video_medias = list(VideoMedia.objects.filter(id__in=media_ids_list).select_related('cover_image'))
        audio_medias = list(AudioMedia.objects.filter(id__in=media_ids_list).select_related('cover_image'))
        document_medias = list(DocumentMedia.objects.filter(id__in=media_ids_list).select_related('cover_image'))
        
        return image_medias, video_medias, audio_medias, document_medias

    @staticmethod
    def get_existing_blog_media(blog_id, media_ids):
        """
        Get existing blog media associations in optimized single queries
        Uses values_list for better performance
        """
        if not media_ids:
            return set(), set(), set(), set()
        
        # Convert to list for better performance with __in lookup
        media_ids_list = list(media_ids) if not isinstance(media_ids, list) else media_ids
        
        # Get all existing associations in parallel queries (4 queries total)
        existing_image_ids = set(
            BlogImage.objects.filter(
                blog_id=blog_id,
                image_id__in=media_ids_list
            ).values_list('image_id', flat=True)
        )
        
        existing_video_ids = set(
            BlogVideo.objects.filter(
                blog_id=blog_id,
                video_id__in=media_ids_list
            ).values_list('video_id', flat=True)
        )
        
        existing_audio_ids = set(
            BlogAudio.objects.filter(
                blog_id=blog_id,
                audio_id__in=media_ids_list
            ).values_list('audio_id', flat=True)
        )
        
        existing_document_ids = set(
            BlogDocument.objects.filter(
                blog_id=blog_id,
                document_id__in=media_ids_list
            ).values_list('document_id', flat=True)
        )
        
        return existing_image_ids, existing_video_ids, existing_audio_ids, existing_document_ids

    @staticmethod
    def add_media_bulk(blog_id, media_files=None, media_ids=None, created_by=None):
        """
        Add media to blog in bulk with optimized queries
        This replaces the original add_media_to_blog method
        """
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        media_files = media_files or []
        media_ids = media_ids or []
        
        created_count = 0
        failed_ids = []
        
        # Handle file uploads first
        failed_files = []
        if media_files:
            uploaded_medias = []
            
            for media_file in media_files:
                try:
                    # Detect media type
                    file_ext = media_file.name.lower().split('.')[-1] if '.' in media_file.name else ''
                    media_type = 'image'  # Default
                    
                    # Simple type detection
                    if file_ext in ['mp4', 'webm', 'mov']:
                        media_type = 'video'
                    elif file_ext in ['mp3', 'ogg', 'aac', 'm4a']:
                        media_type = 'audio'
                    elif file_ext == 'pdf':
                        media_type = 'pdf'
                    
                    # Create media using central app
                    media = MediaAdminService.create_media(media_type, {
                        'file': media_file,
                        'title': f"Media for {blog.title}",
                    })
                    uploaded_medias.append((media, media_type))
                except Exception as e:
                    logger.error(f"Error uploading media file {media_file.name}: {e}")
                    failed_files.append({
                        'name': media_file.name,
                        'error': str(e)
                    })
                    continue
            
            # Add uploaded media to blog
            if uploaded_medias:
                # Get next order number
                next_order = BlogAdminMediaService.get_next_media_order(blog_id)
                
                # Check if blog already has a main image
                has_main_image = BlogImage.objects.filter(
                    blog=blog,
                    is_main=True
                ).exists()
                
                # Create blog media relations
                blog_media_objects = []
                for i, (media, media_type) in enumerate(uploaded_medias):
                    if media_type == 'image':
                        # Set the first image as main image if no main image exists
                        should_be_main = (i == 0) and not has_main_image
                        
                        blog_media_objects.append(
                            BlogImage(
                                blog=blog,
                                image=media,
                                is_main=should_be_main,
                                order=next_order + i
                            )
                        )
                        
                        # Update main image status if needed
                        if should_be_main:
                            has_main_image = True
                    elif media_type == 'video':
                        blog_media_objects.append(
                            BlogVideo(
                                blog=blog,
                                video=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'audio':
                        blog_media_objects.append(
                            BlogAudio(
                                blog=blog,
                                audio=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'pdf':
                        blog_media_objects.append(
                            BlogDocument(
                                blog=blog,
                                document=media,
                                order=next_order + i
                            )
                        )
                
                # Bulk create all blog media relations
                if blog_media_objects:
                    # Create all objects in one query per type
                    images = [obj for obj in blog_media_objects if isinstance(obj, BlogImage)]
                    videos = [obj for obj in blog_media_objects if isinstance(obj, BlogVideo)]
                    audios = [obj for obj in blog_media_objects if isinstance(obj, BlogAudio)]
                    documents = [obj for obj in blog_media_objects if isinstance(obj, BlogDocument)]
                    
                    if images:
                        BlogImage.objects.bulk_create(images)
                    if videos:
                        BlogVideo.objects.bulk_create(videos)
                    if audios:
                        BlogAudio.objects.bulk_create(audios)
                    if documents:
                        BlogDocument.objects.bulk_create(documents)
                    
                    created_count += len(blog_media_objects)
        
        # Handle existing media associations
        if media_ids:
            # Convert to list and remove duplicates for better performance
            media_ids_list = list(set(media_ids)) if isinstance(media_ids, (list, tuple)) else [media_ids]
            
            logger.info(f"Processing {len(media_ids_list)} media IDs for blog {blog_id}")
            
            # Get all media objects in optimized queries (4 queries instead of 4*N)
            image_medias, video_medias, audio_medias, document_medias = \
                BlogAdminMediaService.get_media_by_ids(media_ids_list)
            
            # Create lookup dictionaries for O(1) access
            image_dict = {media.id: media for media in image_medias}
            video_dict = {media.id: media for media in video_medias}
            audio_dict = {media.id: media for media in audio_medias}
            document_dict = {media.id: media for media in document_medias}
            
            # Get existing blog media associations (4 optimized queries)
            existing_image_ids, existing_video_ids, existing_audio_ids, existing_document_ids = \
                BlogAdminMediaService.get_existing_blog_media(blog_id, media_ids_list)
            
            # Combine all existing IDs for faster lookup
            all_existing_ids = existing_image_ids | existing_video_ids | existing_audio_ids | existing_document_ids
            
            # Prepare media to create - optimized loop
            media_to_create = []
            
            # Process each media ID - optimized with early exits
            for media_id in media_ids_list:
                # Skip if already exists (fast set lookup O(1))
                if media_id in all_existing_ids:
                    continue
                
                # Determine media type using dictionary lookup (O(1))
                if media_id in image_dict:
                    media_to_create.append(('image', image_dict[media_id]))
                elif media_id in video_dict:
                    media_to_create.append(('video', video_dict[media_id]))
                elif media_id in audio_dict:
                    media_to_create.append(('audio', audio_dict[media_id]))
                elif media_id in document_dict:
                    media_to_create.append(('document', document_dict[media_id]))
                else:
                    # Media ID not found
                    failed_ids.append(media_id)
                    logger.warning(f"Media ID {media_id} not found in any media type for blog {blog_id}")
            
            logger.info(f"Prepared {len(media_to_create)} media items to create for blog {blog_id}")
            
            # Create blog media relations if we have any
            if media_to_create:
                # Get next order number
                next_order = BlogAdminMediaService.get_next_media_order(blog_id)
                
                # Check if blog already has a main image
                has_main_image = BlogImage.objects.filter(
                    blog=blog,
                    is_main=True
                ).exists()
                
                # Create blog media objects
                blog_media_objects = []
                for i, (media_type, media) in enumerate(media_to_create):
                    if media_type == 'image':
                        # Set as main image if no main image exists
                        should_be_main = not has_main_image
                        
                        blog_media_objects.append(
                            BlogImage(
                                blog=blog,
                                image=media,
                                is_main=should_be_main,
                                order=next_order + i
                            )
                        )
                        
                        # Update main image status if needed
                        if should_be_main:
                            has_main_image = True
                    elif media_type == 'video':
                        blog_media_objects.append(
                            BlogVideo(
                                blog=blog,
                                video=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'audio':
                        blog_media_objects.append(
                            BlogAudio(
                                blog=blog,
                                audio=media,
                                order=next_order + i
                            )
                        )
                    elif media_type == 'document':
                        blog_media_objects.append(
                            BlogDocument(
                                blog=blog,
                                document=media,
                                order=next_order + i
                            )
                        )
                
                # Bulk create all blog media relations
                if blog_media_objects:
                    # Create all objects in one query per type
                    images = [obj for obj in blog_media_objects if isinstance(obj, BlogImage)]
                    videos = [obj for obj in blog_media_objects if isinstance(obj, BlogVideo)]
                    audios = [obj for obj in blog_media_objects if isinstance(obj, BlogAudio)]
                    documents = [obj for obj in blog_media_objects if isinstance(obj, BlogDocument)]
                    
                    if images:
                        BlogImage.objects.bulk_create(images)
                    if videos:
                        BlogVideo.objects.bulk_create(videos)
                    if audios:
                        BlogAudio.objects.bulk_create(audios)
                    if documents:
                        BlogDocument.objects.bulk_create(documents)
                    
                    created_count += len(blog_media_objects)
        
        # Optimized main image setting - check once and set if needed
        if created_count > 0 or media_ids:
            # Single query to check if main image exists
            has_main_image = BlogImage.objects.filter(
                blog_id=blog_id,
                is_main=True
            ).exists()
            
            if not has_main_image:
                # Try to get first image from newly created or existing images
                # Use a single optimized query with select_related
                first_image = BlogImage.objects.filter(
                    blog_id=blog_id
                ).select_related('image').order_by('is_main', 'order', 'created_at').first()
                
                if first_image:
                    # Update in single query if possible, or use update_fields
                    first_image.is_main = True
                    first_image.save(update_fields=['is_main'])
                    logger.info(f"Set media ID {first_image.image_id} as main image for blog {blog_id}")
                    
                    # Set OG image if not provided - use update_fields for better performance
                    if not blog.og_image:
                        blog.og_image = first_image.image
                        blog.save(update_fields=['og_image'])
                        logger.debug(f"Set OG image for blog {blog_id}")
        
        logger.info(f"Blog {blog_id} media update completed: created={created_count}, "
                   f"failed_ids={len(failed_ids)}, failed_files={len(failed_files)}")
        
        return {
            'created_count': created_count,
            'failed_ids': failed_ids,
            'failed_files': failed_files
        }
    
    @staticmethod
    def sync_media(blog_id, media_ids, main_image_id=None, media_covers=None):
        """
        Sync blog media - remove deleted, add new, update main image and covers
        Optimized with bulk operations and minimal queries
        media_covers: dict mapping media_id to cover_image_id {media_id: cover_image_id}
        """
        try:
            blog = Blog.objects.get(id=blog_id)
        except Blog.DoesNotExist:
            raise Blog.DoesNotExist("Blog not found")
        
        # Handle empty list - if media_ids is explicitly [] (empty array), sync should still run
        # If media_ids is None, don't sync (meaning no change)
        if media_ids is None:
            return {
                'removed_count': 0,
                'added_count': 0,
                'total_count': 0
            }
        
        # Convert to set for efficient operations
        media_ids = media_ids if isinstance(media_ids, (list, tuple)) else []
        media_ids_set = set(media_ids)
        
        # Get all current media IDs from database in optimized queries
        current_image_ids = set(
            BlogImage.objects.filter(blog_id=blog_id).values_list('image_id', flat=True)
        )
        current_video_ids = set(
            BlogVideo.objects.filter(blog_id=blog_id).values_list('video_id', flat=True)
        )
        current_audio_ids = set(
            BlogAudio.objects.filter(blog_id=blog_id).values_list('audio_id', flat=True)
        )
        current_document_ids = set(
            BlogDocument.objects.filter(blog_id=blog_id).values_list('document_id', flat=True)
        )
        
        # Combine all current media IDs
        all_current_ids = current_image_ids | current_video_ids | current_audio_ids | current_document_ids
        
        # Find media to remove (in DB but not in new list)
        media_to_remove = all_current_ids - media_ids_set
        
        # Find media to add (in new list but not in DB)
        media_to_add = media_ids_set - all_current_ids
        
        with transaction.atomic():
            # Check if current main image is being removed
            current_main_image_id = None
            if current_image_ids:
                main_image_obj = BlogImage.objects.filter(
                    blog_id=blog_id,
                    is_main=True
                ).first()
                if main_image_obj:
                    current_main_image_id = main_image_obj.image_id
            
            # Remove deleted media in optimized bulk operations
            if media_to_remove:
                # Remove images
                image_ids_to_remove = media_to_remove & current_image_ids
                if image_ids_to_remove:
                    # If main image is being removed, we'll set a new one later
                    if current_main_image_id and current_main_image_id in image_ids_to_remove:
                        BlogImage.objects.filter(
                            blog_id=blog_id,
                            is_main=True
                        ).update(is_main=False)
                        current_main_image_id = None
                    
                    BlogImage.objects.filter(
                        blog_id=blog_id,
                        image_id__in=image_ids_to_remove
                    ).delete()
                
                # Remove videos
                video_ids_to_remove = media_to_remove & current_video_ids
                if video_ids_to_remove:
                    BlogVideo.objects.filter(
                        blog_id=blog_id,
                        video_id__in=video_ids_to_remove
                    ).delete()
                
                # Remove audios
                audio_ids_to_remove = media_to_remove & current_audio_ids
                if audio_ids_to_remove:
                    BlogAudio.objects.filter(
                        blog_id=blog_id,
                        audio_id__in=audio_ids_to_remove
                    ).delete()
                
                # Remove documents
                document_ids_to_remove = media_to_remove & current_document_ids
                if document_ids_to_remove:
                    BlogDocument.objects.filter(
                        blog_id=blog_id,
                        document_id__in=document_ids_to_remove
                    ).delete()
                
                logger.info(f"Removed {len(media_to_remove)} media items from blog {blog_id}")
            
            # Update main image first if specified (before adding new media)
            if main_image_id is not None:
                # Remove current main image flag
                BlogImage.objects.filter(
                    blog_id=blog_id,
                    is_main=True
                ).update(is_main=False)
                
                # Check if main_image_id is an existing image
                blog_image = BlogImage.objects.filter(
                    blog_id=blog_id,
                    image_id=main_image_id
                ).first()
                
                if blog_image:
                    blog_image.is_main = True
                    blog_image.save(update_fields=['is_main'])
                    
                    # Update OG image if not set
                    blog.refresh_from_db()
                    if not blog.og_image:
                        blog.og_image = blog_image.image
                        blog.save(update_fields=['og_image'])
            
            # Add new media
            if media_to_add:
                BlogAdminMediaService.add_media_bulk(
                    blog_id=blog_id,
                    media_ids=list(media_to_add)
                )
                
                # If main_image_id was in media_to_add, set it now
                if main_image_id is not None and main_image_id in media_to_add:
                    blog_image = BlogImage.objects.filter(
                        blog_id=blog_id,
                        image_id=main_image_id
                    ).first()
                    
                    if blog_image:
                        BlogImage.objects.filter(
                            blog_id=blog_id,
                            is_main=True
                        ).exclude(image_id=main_image_id).update(is_main=False)
                        
                        blog_image.is_main = True
                        blog_image.save(update_fields=['is_main'])
                        
                        blog.refresh_from_db()
                        if not blog.og_image:
                            blog.og_image = blog_image.image
                            blog.save(update_fields=['og_image'])
            
            # Update cover images for blog media (blog-specific covers)
            if media_covers:
                BlogAdminMediaService._update_blog_media_covers(
                    blog_id=blog_id,
                    media_covers=media_covers,
                    all_current_ids=all_current_ids,
                    current_video_ids=current_video_ids,
                    current_audio_ids=current_audio_ids,
                    current_document_ids=current_document_ids
                )
            
            # Clear cache
            BlogCacheManager.invalidate_blog(blog_id)
        
        return {
            'removed_count': len(media_to_remove),
            'added_count': len(media_to_add),
            'total_count': len(media_ids_set)
        }
    
    @staticmethod
    def _update_blog_media_covers(blog_id, media_covers, all_current_ids, 
                                       current_video_ids, current_audio_ids, current_document_ids):
        """
        Update cover images for blog media (blog-specific covers)
        Optimized helper method to avoid code duplication
        """
        for media_id_str, cover_image_id in media_covers.items():
            # Convert key to int (DictField may serialize keys as strings)
            try:
                media_id = int(media_id_str) if isinstance(media_id_str, str) else media_id_str
            except (ValueError, TypeError):
                logger.warning(f"Invalid media_id in media_covers: {media_id_str}")
                continue
            
            # Check if media_id exists in current blog media
            if media_id not in all_current_ids:
                continue
            
            # Determine media type and update cover
            if media_id in current_video_ids:
                BlogAdminMediaService._update_media_cover(
                    BlogVideo, 'video', blog_id, media_id, cover_image_id, video_id=media_id
                )
            elif media_id in current_audio_ids:
                BlogAdminMediaService._update_media_cover(
                    BlogAudio, 'audio', blog_id, media_id, cover_image_id, audio_id=media_id
                )
            elif media_id in current_document_ids:
                BlogAdminMediaService._update_media_cover(
                    BlogDocument, 'document', blog_id, media_id, cover_image_id, document_id=media_id
                )
    
    @staticmethod
    def _update_media_cover(model_class, media_type, blog_id, media_id, cover_image_id, **filter_kwargs):
        """
        Helper method to update cover image for a blog media item
        """
        try:
            blog_media = model_class.objects.filter(
                blog_id=blog_id,
                **filter_kwargs
            ).first()
            
            if blog_media:
                if cover_image_id:
                    cover_image = ImageMedia.objects.filter(id=cover_image_id).first()
                    blog_media.cover_image = cover_image if cover_image else None
                else:
                    blog_media.cover_image = None
                blog_media.save(update_fields=['cover_image'])
        except Exception as e:
            logger.error(f"Error updating cover for {media_type} {media_id} in blog {blog_id}: {e}")