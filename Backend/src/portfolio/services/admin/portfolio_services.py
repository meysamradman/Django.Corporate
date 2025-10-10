from django.shortcuts import get_object_or_404
from django.db.models import Prefetch, Count, Q
from django.core.paginator import Paginator
from django.core.cache import cache
from django.utils import timezone
from src.portfolio.models.portfolio import Portfolio
from src.portfolio.models.media import PortfolioMedia
from src.media.models.media import Media


class PortfolioAdminService:
    """
    Optimized Portfolio service with SEO support and media integration
    Compatible with central media app
    """
    
    @staticmethod
    def get_portfolio_queryset(filters=None, search=None):
        """Return optimized queryset for admin listing; pagination handled at view layer"""
        queryset = Portfolio.objects.select_related('og_image').prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'portfolio_medias',
                queryset=PortfolioMedia.objects.filter(is_main_image=True).select_related('media'),
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
        
        # Order by
        queryset = queryset.order_by('-created_at')
        
        # Add annotation for counts (optimized)
        queryset = queryset.annotate(
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True),
            media_count=Count('portfolio_medias', distinct=True)
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
                Prefetch(
                    'portfolio_medias',
                    queryset=PortfolioMedia.objects.select_related('media').order_by('order')
                )
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
        
        # Auto-generate canonical URL
        if not validated_data.get('canonical_url') and validated_data.get('slug'):
            validated_data['canonical_url'] = f"/portfolio/{validated_data['slug']}/"
        
        return Portfolio.objects.create(**validated_data)
    
    @staticmethod
    def create_portfolio_with_main_image(validated_data, main_image_file, created_by=None):
        """Create portfolio with main image from central media app"""
        portfolio = PortfolioAdminService.create_portfolio(validated_data, created_by)
        
        if main_image_file:
            # Use central media app to create media
            from src.media.services.media_service import MediaService
            
            media = MediaService.create_media(
                file=main_image_file,
                media_type='image',
                title=f"Main image for {portfolio.title}",
                created_by=created_by
            )
            
            # Create portfolio media relation
            PortfolioMedia.objects.create(
                portfolio=portfolio,
                media=media,
                is_main_image=True,
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
        from src.media.services.media_service import MediaService
        
        created_medias = []
        last_order = PortfolioMedia.objects.filter(portfolio=portfolio).count()
        
        for i, media_file in enumerate(media_files):
            # Create media using central app
            media = MediaService.create_media(
                file=media_file,
                media_type=MediaService.detect_media_type(media_file),
                title=f"Media for {portfolio.title}",
                created_by=created_by
            )
            
            # Create portfolio media relation
            portfolio_media = PortfolioMedia.objects.create(
                portfolio=portfolio,
                media=media,
                is_main_image=False,  # Only manual assignment for main image
                order=last_order + i + 1
            )
            
            created_medias.append(portfolio_media)
        
        return created_medias
    
    @staticmethod
    def set_main_image(portfolio_id, media_id):
        """Set main image for portfolio"""
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        
        # Remove current main image
        PortfolioMedia.objects.filter(
            portfolio=portfolio,
            is_main_image=True
        ).update(is_main_image=False)
        
        # Set new main image
        portfolio_media = get_object_or_404(
            PortfolioMedia,
            portfolio=portfolio,
            media_id=media_id
        )
        portfolio_media.is_main_image = True
        portfolio_media.save()
        
        # Also set as OG image if not set
        if not portfolio.og_image:
            portfolio.og_image = portfolio_media.media
            portfolio.save(update_fields=['og_image'])
        
        return portfolio_media
    
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
        portfolio_medias = PortfolioMedia.objects.filter(portfolio=portfolio)
        media_ids = list(portfolio_medias.values_list('media_id', flat=True))
        
        # Delete portfolio (will cascade to PortfolioMedia)
        portfolio.delete()
        
        # Optional: Clean up orphaned media files
        # This should be done carefully - only if media is not used elsewhere
        from src.media.services.media_service import MediaService
        for media_id in media_ids:
            MediaService.cleanup_orphaned_media(media_id)
        
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
        
        # Generate canonical URL
        if not portfolio.canonical_url and portfolio.slug:
            updates['canonical_url'] = f"/portfolio/{portfolio.slug}/"
        
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