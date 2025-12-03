from django.db.models import Prefetch, Count, Q
from django.core.paginator import Paginator
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from src.portfolio.models.portfolio import Portfolio
from src.portfolio.services.admin import PortfolioAdminMediaService
from src.portfolio.utils.cache import PortfolioCacheManager, PortfolioCacheKeys
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.portfolio.messages.messages import PORTFOLIO_ERRORS


class PortfolioAdminService:
    
    @staticmethod
    def get_portfolio_queryset(filters=None, search=None, order_by=None, order_desc=None):
        queryset = Portfolio.objects.select_related('og_image').prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.filter(is_main=True).select_related('image'),
                to_attr='main_image_media'
            ),
            'images',
            'videos',
            'audios',
            'documents'
        )
        
        if filters:
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('is_featured') is not None:
                queryset = queryset.filter(is_featured=filters['is_featured'])
            if filters.get('is_public') is not None:
                queryset = queryset.filter(is_public=filters['is_public'])
            if filters.get('category_id'):
                queryset = queryset.filter(categories__id=filters['category_id'])
            
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
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(short_description__icontains=search) |
                Q(meta_title__icontains=search) |
                Q(meta_description__icontains=search)
            )
        
        if order_by:
            ordering_field = order_by
            if order_desc:
                ordering_field = f'-{order_by}'
            queryset = queryset.order_by(ordering_field)
        else:
            queryset = queryset.order_by('-created_at')
        
        queryset = queryset.annotate(
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True),
            media_count=Count('images', distinct=True) + Count('videos', distinct=True) + 
                       Count('audios', distinct=True) + Count('documents', distinct=True)
        )
        
        return queryset
    
    @staticmethod
    def get_portfolio_detail(portfolio_id):
        try:
            return Portfolio.objects.select_related('og_image').prefetch_related(
                'categories',
                'tags',
                'options',
                'images',
                'videos',
                'audios',
                'documents'
            ).get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            return None
    
    @staticmethod
    def create_portfolio(validated_data, created_by=None):
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        if not validated_data.get('og_title') and validated_data.get('meta_title'):
            validated_data['og_title'] = validated_data['meta_title']
            
        if not validated_data.get('og_description') and validated_data.get('meta_description'):
            validated_data['og_description'] = validated_data['meta_description']
        
        if 'canonical_url' in validated_data and validated_data.get('canonical_url'):
            canonical_url = validated_data['canonical_url']
            if not canonical_url.startswith(('http://', 'https://')):
                validated_data['canonical_url'] = None
        
        return Portfolio.objects.create(**validated_data)
    
    @staticmethod
    def create_portfolio_with_media(validated_data, media_files, created_by=None):
        portfolio = PortfolioAdminService.create_portfolio(validated_data, created_by)
        
        if media_files:
            result = PortfolioAdminMediaService.add_media_bulk(
                portfolio_id=portfolio.id,
                media_files=media_files,
                created_by=created_by
            )
        
        return portfolio

    @staticmethod
    def set_main_image(portfolio_id, media_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
        PortfolioImage.objects.filter(
            portfolio=portfolio,
            is_main=True
        ).update(is_main=False)
        
        try:
            portfolio_image = PortfolioImage.objects.get(
                portfolio=portfolio,
                image_id=media_id
            )
        except PortfolioImage.DoesNotExist:
            raise PortfolioImage.DoesNotExist("Portfolio image not found")
        portfolio_image.is_main = True
        portfolio_image.save()
        
        if not portfolio.og_image:
            portfolio.og_image = portfolio_image.image
            portfolio.save(update_fields=['og_image'])
        
        return portfolio_image
    
    @staticmethod
    def bulk_update_status(portfolio_ids, new_status):
        if new_status not in dict(Portfolio.STATUS_CHOICES):
            return False
            
        Portfolio.objects.filter(id__in=portfolio_ids).update(
            status=new_status,
            updated_at=timezone.now()
        )
        return True
    
    @staticmethod
    def bulk_update_seo(portfolio_ids, seo_data):
        portfolios = Portfolio.objects.filter(id__in=portfolio_ids)
        
        for portfolio in portfolios:
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
        cache_key = PortfolioCacheKeys.seo_report()
        cached_report = cache.get(cache_key)
        if cached_report:
            return cached_report
        
        total = Portfolio.objects.count()
        
        if total == 0:
            report_data = {
                'total': 0,
                'complete_seo': 0,
                'partial_seo': 0,
                'no_seo': 0,
                'completion_percentage': 0,
                'og_image_count': 0,
                'canonical_url_count': 0
            }
            cache.set(cache_key, report_data, 600)
            return report_data
        
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
        
        report_data = {
            'total': total,
            'complete_seo': complete_seo,
            'partial_seo': partial_seo,
            'no_seo': no_seo,
            'completion_percentage': round((complete_seo / total * 100), 1),
            'og_image_count': og_image_count,
            'canonical_url_count': canonical_url_count
        }
        
        cache.set(cache_key, report_data, 600)
        return report_data
    
    @staticmethod
    def delete_portfolio(portfolio_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
        portfolio_medias = PortfolioImage.objects.filter(portfolio=portfolio)
        media_ids = list(portfolio_medias.values_list('image_id', flat=True))
        
        portfolio.delete()
        
        return True
    
    @staticmethod
    def bulk_delete_portfolios(portfolio_ids):
        if not portfolio_ids:
            raise ValidationError(PORTFOLIO_ERRORS["portfolio_ids_required"])
        
        portfolios = Portfolio.objects.filter(id__in=portfolio_ids)
        
        if not portfolios.exists():
            raise ValidationError(PORTFOLIO_ERRORS["portfolios_not_found"])
        
        with transaction.atomic():
            deleted_count = portfolios.count()
            portfolios.delete()
            
            PortfolioCacheManager.invalidate_portfolios(portfolio_ids)
        
        return deleted_count


class PortfolioAdminStatusService:
    
    @staticmethod
    def change_status(portfolio_id, new_status):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")

        if new_status not in dict(Portfolio.STATUS_CHOICES):
            return None

        portfolio.status = new_status
        portfolio.save(update_fields=['status', 'updated_at'])
        return portfolio
    
    @staticmethod
    def publish_portfolio(portfolio_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
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
    
    @staticmethod
    def auto_generate_seo(portfolio_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
        updates = {}
        
        if not portfolio.meta_title and portfolio.title:
            updates['meta_title'] = portfolio.title[:70]
        
        if not portfolio.meta_description and portfolio.short_description:
            updates['meta_description'] = portfolio.short_description[:300]
        
        if not portfolio.og_title and (portfolio.meta_title or portfolio.title):
            updates['og_title'] = (portfolio.meta_title or portfolio.title)[:70]
        
        if not portfolio.og_description and (portfolio.meta_description or portfolio.short_description):
            updates['og_description'] = (portfolio.meta_description or portfolio.short_description)[:300]
        
        if portfolio.canonical_url and not portfolio.canonical_url.startswith(('http://', 'https://')):
            updates['canonical_url'] = None
        
        if not portfolio.og_image:
            main_image = portfolio.get_main_image()
            if main_image:
                updates['og_image'] = main_image
        
        if updates:
            for field, value in updates.items():
                setattr(portfolio, field, value)
            portfolio.save()
        
        return portfolio
    
    @staticmethod
    def validate_seo_data(portfolio_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
        suggestions = []
        
        if portfolio.meta_title:
            if len(portfolio.meta_title) > 60:
                suggestions.append("Meta title should be under 60 characters for optimal display")
        
        if portfolio.meta_description:
            if len(portfolio.meta_description) < 120:
                suggestions.append("Meta description should be at least 120 characters")
            elif len(portfolio.meta_description) > 160:
                suggestions.append("Meta description should be under 160 characters")
        
        if not portfolio.og_image:
            suggestions.append("Adding an OG image improves social media sharing")
        
        return {
            'is_valid': len(suggestions) == 0,
            'suggestions': suggestions,
            'completeness_score': portfolio.seo_completeness_score() if hasattr(portfolio, 'seo_completeness_score') else None
        }