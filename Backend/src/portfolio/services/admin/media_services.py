import logging
from django.db.models import Max, Q
from django.shortcuts import get_object_or_404
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.media.services.media_services import MediaAdminService

logger = logging.getLogger(__name__)


class PortfolioAdminMediaService:
    """
    Optimized service for portfolio media operations
    Addresses N+1 query problems and improves performance
    """

    @staticmethod
    def get_next_media_order(portfolio_id):
        """
        Get the next order number for media items - optimized single query
        Uses aggregation to get max order from all media types in one query
        """
        # Single optimized query with aggregation
        max_order_result = Portfolio.objects.filter(
            id=portfolio_id
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
        # Use only() for specific fields if you know what you need, or fetch all for flexibility
        image_medias = list(ImageMedia.objects.filter(id__in=media_ids_list).only('id', 'file', 'title', 'alt_text'))
        video_medias = list(VideoMedia.objects.filter(id__in=media_ids_list).only('id', 'file', 'title', 'alt_text', 'cover_image'))
        audio_medias = list(AudioMedia.objects.filter(id__in=media_ids_list).only('id', 'file', 'title', 'alt_text', 'cover_image'))
        document_medias = list(DocumentMedia.objects.filter(id__in=media_ids_list).only('id', 'file', 'title', 'alt_text', 'cover_image'))
        
        return image_medias, video_medias, audio_medias, document_medias

    @staticmethod
    def get_existing_portfolio_media(portfolio_id, media_ids):
        """
        Get existing portfolio media associations in optimized single queries
        Uses values_list for better performance
        """
        if not media_ids:
            return set(), set(), set(), set()
        
        # Convert to list for better performance with __in lookup
        media_ids_list = list(media_ids) if not isinstance(media_ids, list) else media_ids
        
        # Get all existing associations in parallel queries (4 queries total)
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
        """
        Add media to portfolio in bulk with optimized queries
        This replaces the original add_media_to_portfolio method
        """
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
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
                        'title': f"Media for {portfolio.title}",
                    })
                    uploaded_medias.append((media, media_type))
                except Exception as e:
                    logger.error(f"Error uploading media file {media_file.name}: {e}")
                    failed_files.append({
                        'name': media_file.name,
                        'error': str(e)
                    })
                    continue
            
            # Add uploaded media to portfolio
            if uploaded_medias:
                # Get next order number
                next_order = PortfolioAdminMediaService.get_next_media_order(portfolio_id)
                
                # Check if portfolio already has a main image
                has_main_image = PortfolioImage.objects.filter(
                    portfolio=portfolio,
                    is_main=True
                ).exists()
                
                # Create portfolio media relations
                portfolio_media_objects = []
                for i, (media, media_type) in enumerate(uploaded_medias):
                    if media_type == 'image':
                        # Set the first image as main image if no main image exists
                        should_be_main = (i == 0) and not has_main_image
                        
                        portfolio_media_objects.append(
                            PortfolioImage(
                                portfolio=portfolio,
                                image=media,
                                is_main=should_be_main,
                                order=next_order + i
                            )
                        )
                        
                        # Update main image status if needed
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
                
                # Bulk create all portfolio media relations
                if portfolio_media_objects:
                    # Create all objects in one query per type
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
        
        # Handle existing media associations
        if media_ids:
            # Convert to list and remove duplicates for better performance
            media_ids_list = list(set(media_ids)) if isinstance(media_ids, (list, tuple)) else [media_ids]
            
            logger.info(f"Processing {len(media_ids_list)} media IDs for portfolio {portfolio_id}")
            
            # Get all media objects in optimized queries (4 queries instead of 4*N)
            image_medias, video_medias, audio_medias, document_medias = \
                PortfolioAdminMediaService.get_media_by_ids(media_ids_list)
            
            # Create lookup dictionaries for O(1) access
            image_dict = {media.id: media for media in image_medias}
            video_dict = {media.id: media for media in video_medias}
            audio_dict = {media.id: media for media in audio_medias}
            document_dict = {media.id: media for media in document_medias}
            
            # Get existing portfolio media associations (4 optimized queries)
            existing_image_ids, existing_video_ids, existing_audio_ids, existing_document_ids = \
                PortfolioAdminMediaService.get_existing_portfolio_media(portfolio_id, media_ids_list)
            
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
                    logger.warning(f"Media ID {media_id} not found in any media type for portfolio {portfolio_id}")
            
            logger.info(f"Prepared {len(media_to_create)} media items to create for portfolio {portfolio_id}")
            
            # Create portfolio media relations if we have any
            if media_to_create:
                # Get next order number
                next_order = PortfolioAdminMediaService.get_next_media_order(portfolio_id)
                
                # Check if portfolio already has a main image
                has_main_image = PortfolioImage.objects.filter(
                    portfolio=portfolio,
                    is_main=True
                ).exists()
                
                # Create portfolio media objects
                portfolio_media_objects = []
                for i, (media_type, media) in enumerate(media_to_create):
                    if media_type == 'image':
                        # Set as main image if no main image exists
                        should_be_main = not has_main_image
                        
                        portfolio_media_objects.append(
                            PortfolioImage(
                                portfolio=portfolio,
                                image=media,
                                is_main=should_be_main,
                                order=next_order + i
                            )
                        )
                        
                        # Update main image status if needed
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
                
                # Bulk create all portfolio media relations
                if portfolio_media_objects:
                    # Create all objects in one query per type
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
        
        # Optimized main image setting - check once and set if needed
        if created_count > 0 or media_ids:
            # Single query to check if main image exists
            has_main_image = PortfolioImage.objects.filter(
                portfolio_id=portfolio_id,
                is_main=True
            ).exists()
            
            if not has_main_image:
                # Try to get first image from newly created or existing images
                # Use a single optimized query with select_related
                first_image = PortfolioImage.objects.filter(
                    portfolio_id=portfolio_id
                ).select_related('image').order_by('is_main', 'order', 'created_at').first()
                
                if first_image:
                    # Update in single query if possible, or use update_fields
                    first_image.is_main = True
                    first_image.save(update_fields=['is_main'])
                    logger.info(f"Set media ID {first_image.image_id} as main image for portfolio {portfolio_id}")
                    
                    # Set OG image if not provided - use update_fields for better performance
                    if not portfolio.og_image:
                        portfolio.og_image = first_image.image
                        portfolio.save(update_fields=['og_image'])
                        logger.debug(f"Set OG image for portfolio {portfolio_id}")
        
        logger.info(f"Portfolio {portfolio_id} media update completed: created={created_count}, "
                   f"failed_ids={len(failed_ids)}, failed_files={len(failed_files)}")
        
        return {
            'created_count': created_count,
            'failed_ids': failed_ids,
            'failed_files': failed_files
        }