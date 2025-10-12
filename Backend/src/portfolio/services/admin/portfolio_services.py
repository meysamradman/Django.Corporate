from django.shortcuts import get_object_or_404
from django.db.models import Prefetch, Count, Q
from django.core.paginator import Paginator
from django.core.cache import cache
from django.utils import timezone
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class PortfolioAdminService:
    """
    Optimized Portfolio service with SEO support and media integration
    Compatible with central media app
    """
    
    @staticmethod
    def get_portfolio_queryset(filters=None, search=None, order_by=None, order_desc=None):
        """Return optimized queryset for admin listing; pagination handled at view layer"""
        queryset = Portfolio.objects.select_related('og_image').prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.filter(is_main=True).select_related('image'),
                to_attr='main_image_media'
            )
        )
        
        # Apply filters
        if filters:
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('is_public') is not None:
                queryset = queryset.filter(is_public=filters['is_public'])
            if filters.get('category_id'):
                queryset = queryset.filter(categories__id=filters['category_id'])
            
            # SEO filters
            if filters.get('seo_status'):
                if filters['seo_status'] == 'complete':
                    queryset = queryset.filter(
                        meta_title__isnull=False,
                        meta_description__isnull=False,
                        og_image__isnull=False
                    )
                elif filters['seo_status'] == 'incomplete':
                    queryset = queryset.filter(
                        Q(meta_title__isnull=False) | Q(meta_description__isnull=False)
                    ).exclude(
                        meta_title__isnull=False,
                        meta_description__isnull=False,
                        og_image__isnull=False
                    )
                elif filters['seo_status'] == 'missing':
                    queryset = queryset.filter(
                        meta_title__isnull=True,
                        meta_description__isnull=True
                    )
        
        # Apply search
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(meta_title__icontains=search) |
                Q(meta_description__icontains=search)
            )
        
        # Apply ordering
        if order_by:
            ordering_field = order_by
            if order_desc:
                ordering_field = f'-{order_by}'
            queryset = queryset.order_by(ordering_field)
        else:
            # Default ordering
            queryset = queryset.order_by('-created_at')
        
        # Add annotation for counts (optimized)
        queryset = queryset.annotate(
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True),
            media_count=Count('images', distinct=True) + Count('videos', distinct=True) + 
                       Count('audios', distinct=True) + Count('documents', distinct=True)
        )
        
        return queryset
    
    @staticmethod
    def get_portfolio_detail(portfolio_id):
        """Get single portfolio with all relations for admin"""
        try:
            return Portfolio.objects.select_related('og_image').prefetch_related(
                'categories',
                'tags',
                'portfolio_options',
                'images',
                'videos',
                'audios',
                'documents'
            ).get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            return None
    
    @staticmethod
    def create_portfolio(validated_data, created_by=None):
        """Create portfolio with auto SEO generation"""
        # Auto-generate SEO if not provided
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        # Auto-generate OG fields if not provided
        if not validated_data.get('og_title') and validated_data.get('meta_title'):
            validated_data['og_title'] = validated_data['meta_title']
            
        if not validated_data.get('og_description') and validated_data.get('meta_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        # Handle canonical URL - set to None if it's an invalid relative path
        # The model will auto-generate it properly in the save method
        if validated_data.get('canonical_url') == f"/portfolio/{validated_data.get('slug', '')}/":
            validated_data['canonical_url'] = None
        
        return Portfolio.objects.create(**validated_data)
    
    @staticmethod
    def create_portfolio_with_main_image(validated_data, main_image_file, created_by=None):
        """Create portfolio with main image from central media app"""
        portfolio = PortfolioAdminService.create_portfolio(validated_data, created_by)
        
        if main_image_file:
            # Use central media app to create media
            from src.media.services.media_services import MediaAdminService
            
            media = MediaAdminService.create_media('image', {
                'file': main_image_file,
                'title': f"Main image for {portfolio.title}",
            })
            
            # Create portfolio image relation
            PortfolioImage.objects.create(
                portfolio=portfolio,
                image=media,
                is_main=True,
                order=0
            )
            
            # Auto-set as OG image if not provided
            if not portfolio.og_image:
                portfolio.og_image = media
                portfolio.save(update_fields=['og_image'])
                
        return portfolio
    
    @staticmethod
    def update_portfolio(portfolio_id, validated_data):
        """Update portfolio with SEO handling"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        
        # Auto-generate SEO if not provided but title/description changed
        if validated_data.get('title') and not validated_data.get('meta_title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if validated_data.get('short_description') and not validated_data.get('meta_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        # Auto-generate OG fields if not provided
        if validated_data.get('meta_title') and not validated_data.get('og_title'):
            validated_data['og_title'] = validated_data['meta_title']
            
        if validated_data.get('meta_description') and not validated_data.get('og_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        for field, value in validated_data.items():
            setattr(portfolio, field, value)
        
        portfolio.save()
        return portfolio
    
    @staticmethod
    def add_media_to_portfolio(portfolio_id, media_files, created_by=None):
        """Add multiple media files to portfolio using central media app"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        from src.media.services.media_services import MediaAdminService
        
        created_medias = []
        last_order = (PortfolioImage.objects.filter(portfolio=portfolio).count() +
                     PortfolioVideo.objects.filter(portfolio=portfolio).count() +
                     PortfolioAudio.objects.filter(portfolio=portfolio).count() +
                     PortfolioDocument.objects.filter(portfolio=portfolio).count())
        
        for i, media_file in enumerate(media_files):
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
            
            # Create portfolio media relation based on type
            if media_type == 'image':
                PortfolioImage.objects.create(
                    portfolio=portfolio,
                    image=media,
                    order=last_order + i
                )
            elif media_type == 'video':
                PortfolioVideo.objects.create(
                    portfolio=portfolio,
                    video=media,
                    order=last_order + i
                )
            elif media_type == 'audio':
                PortfolioAudio.objects.create(
                    portfolio=portfolio,
                    audio=media,
                    order=last_order + i
                )
            elif media_type == 'pdf':
                PortfolioDocument.objects.create(
                    portfolio=portfolio,
                    document=media,
                    order=last_order + i
                )
            
            created_medias.append(media)
            
        return created_medias
    
    @staticmethod
    def set_main_image(portfolio_id, media_id):
        """Set main image for portfolio"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        
        # Remove current main image
        PortfolioImage.objects.filter(
            portfolio=portfolio,
            is_main=True
        ).update(is_main=False)
        
        # Set new main image
        portfolio_image = get_object_or_404(
            PortfolioImage,
            portfolio=portfolio,
            image_id=media_id
        )
        portfolio_image.is_main = True
        portfolio_image.save()
        
        # Also set as OG image if not set
        if not portfolio.og_image:
            portfolio.og_image = portfolio_image.image
            portfolio.save(update_fields=['og_image'])
        
        return portfolio_image
    
    @staticmethod
    def bulk_update_status(portfolio_ids, new_status):
        """Bulk status update"""
        if new_status not in dict(Portfolio.STATUS_CHOICES):
            return False
            
        Portfolio.objects.filter(id__in=portfolio_ids).update(
            status=new_status,
            updated_at=timezone.now()
        )
        return True
    
    @staticmethod
    def bulk_update_seo(portfolio_ids, seo_data):
        """Bulk SEO update"""
        portfolios = Portfolio.objects.filter(id__in=portfolio_ids)
        
        for portfolio in portfolios:
            # Auto-generate missing SEO data
            if not portfolio.meta_title and portfolio.title:
                portfolio.meta_title = portfolio.title[:70]
            if not portfolio.meta_description and portfolio.short_description:
                portfolio.meta_description = portfolio.short_description[:300]
            if not portfolio.og_title and portfolio.meta_title:
                portfolio.og_title = portfolio.meta_title
            if not portfolio.og_description and portfolio.meta_description:
                portfolio.og_description = portfolio.meta_description
            
            portfolio.save()
        
        return True
    
    @staticmethod
    def get_seo_report():
        """Get comprehensive SEO report"""
        total = Portfolio.objects.count()
        
        if total == 0:
            return {
                'total': 0,
                'complete_seo': 0,
                'partial_seo': 0,
                'no_seo': 0,
                'completion_percentage': 0,
                'og_image_count': 0,
                'canonical_url_count': 0
            }
        
        complete_seo = Portfolio.objects.filter(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        ).count()
        
        partial_seo = Portfolio.objects.filter(
            Q(meta_title__isnull=False) | Q(meta_description__isnull=False) | Q(og_image__isnull=False)
        ).exclude(
            meta_title__isnull=False,
            meta_description__isnull=False,
            og_image__isnull=False
        ).count()
        
        no_seo = total - complete_seo - partial_seo
        
        og_image_count = Portfolio.objects.filter(og_image__isnull=False).count()
        canonical_url_count = Portfolio.objects.filter(canonical_url__isnull=False).count()
        
        return {
            'total': total,
            'complete_seo': complete_seo,
            'partial_seo': partial_seo,
            'no_seo': no_seo,
            'completion_percentage': round((complete_seo / total * 100), 1),
            'og_image_count': og_image_count,
            'canonical_url_count': canonical_url_count
        }
    
    @staticmethod
    def delete_portfolio(portfolio_id):
        """Delete portfolio and handle media cleanup"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        
        # Get associated media files for potential cleanup
        portfolio_medias = PortfolioImage.objects.filter(portfolio=portfolio)
        media_ids = list(portfolio_medias.values_list('image_id', flat=True))
        
        # Delete portfolio (will cascade to PortfolioMedia)
        portfolio.delete()
        
        # Note: Media cleanup is not implemented as there's no cleanup_orphaned_media method
        # This should be handled separately if needed
        
        return True


class PortfolioAdminStatusService:
    """Service for portfolio status management"""
    
    @staticmethod
    def change_status(portfolio_id, new_status):
        """Change portfolio status with validation"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)

        if new_status not in dict(Portfolio.STATUS_CHOICES):
            return None

        portfolio.status = new_status
        portfolio.save(update_fields=['status', 'updated_at'])
        return portfolio
    
    @staticmethod
    def publish_portfolio(portfolio_id):
        """Publish portfolio with SEO validation"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        
        # Check if SEO is complete for publishing
        seo_warnings = []
        if not portfolio.meta_title:
            seo_warnings.append("Meta title is missing")
        if not portfolio.meta_description:
            seo_warnings.append("Meta description is missing")
        if not portfolio.og_image:
            seo_warnings.append("OG image is missing")
        
        portfolio.status = 'published'
        portfolio.save(update_fields=['status', 'updated_at'])
        
        return {
            'portfolio': portfolio,
            'seo_warnings': seo_warnings
        }


class PortfolioAdminSEOService:
    """Dedicated service for SEO operations"""
    
    @staticmethod
    def auto_generate_seo(portfolio_id):
        """Auto-generate SEO data for portfolio"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        
        updates = {}
        
        # Generate meta title
        if not portfolio.meta_title and portfolio.title:
            updates['meta_title'] = portfolio.title[:70]
        
        # Generate meta description
        if not portfolio.meta_description and portfolio.short_description:
            updates['meta_description'] = portfolio.short_description[:300]
        
        # Generate OG data
        if not portfolio.og_title and (portfolio.meta_title or portfolio.title):
            updates['og_title'] = (portfolio.meta_title or portfolio.title)[:70]
        
        if not portfolio.og_description and (portfolio.meta_description or portfolio.short_description):
            updates['og_description'] = (portfolio.meta_description or portfolio.short_description)[:300]
        
        # Generate canonical URL - let the model handle this properly
        # Remove any invalid canonical_url that might have been set
        if portfolio.canonical_url and not portfolio.canonical_url.startswith(('http://', 'https://')):
            updates['canonical_url'] = None
        
        # Auto-set OG image from main image
        if not portfolio.og_image:
            main_image = portfolio.get_main_image()
            if main_image:
                updates['og_image'] = main_image
        
        # Apply updates
        if updates:
            for field, value in updates.items():
                setattr(portfolio, field, value)
            portfolio.save()
        
        return portfolio
    
    @staticmethod
    def validate_seo_data(portfolio_id):
        """Validate SEO data and return suggestions"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        
        suggestions = []
        
        # Title length check
        if portfolio.meta_title:
            if len(portfolio.meta_title) > 60:
                suggestions.append("Meta title should be under 60 characters for optimal display")
        
        # Description length check
        if portfolio.meta_description:
            if len(portfolio.meta_description) < 120:
                suggestions.append("Meta description should be at least 120 characters")
            elif len(portfolio.meta_description) > 160:
                suggestions.append("Meta description should be under 160 characters")
        
        # Image check
        if not portfolio.og_image:
            suggestions.append("Adding an OG image improves social media sharing")
        
        return {
            'is_valid': len(suggestions) == 0,
            'suggestions': suggestions,
            'completeness_score': portfolio.seo_completeness_score() if hasattr(portfolio, 'seo_completeness_score') else None
        }