import logging
from django.db.models import Prefetch, Count, Q
from django.core.paginator import Paginator
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from datetime import datetime

logger = logging.getLogger(__name__)

from src.portfolio.models.portfolio import Portfolio
from src.portfolio.services.admin.media_services import PortfolioAdminMediaService
from src.portfolio.utils.cache_admin import PortfolioCacheManager, PortfolioCacheKeys
from src.portfolio.utils import cache_ttl
from src.portfolio.models.media import PortfolioImage, PortfolioVideo, PortfolioAudio, PortfolioDocument
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.portfolio.messages.messages import PORTFOLIO_ERRORS

class PortfolioAdminService:
    
    @staticmethod
    def get_portfolio_queryset(filters=None, search=None, order_by=None, order_desc=None, date_from=None, date_to=None):
        queryset = Portfolio.objects.select_related('og_image').prefetch_related(
            'categories',
            'tags',
            Prefetch(
                'images',
                queryset=PortfolioImage.objects.filter(is_main=True).select_related('image'),
                to_attr='main_image_media'
            )
        ).annotate(
            categories_count=Count('categories', distinct=True),
            tags_count=Count('tags', distinct=True)
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
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to_obj)
            except ValueError:
                pass
        
        if order_by:
            ordering_field = order_by
            if order_desc:
                ordering_field = f'-{order_by}'
            queryset = queryset.order_by(ordering_field)
        else:
            queryset = queryset.order_by('-created_at')
        
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
            ).annotate(
                categories_count=Count('categories', distinct=True),
                tags_count=Count('tags', distinct=True)
            ).get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            return None
    
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
    def create_portfolio(validated_data, created_by=None):
        logger.info(f"Creating portfolio. Title: {validated_data.get('title')}, Created By: {created_by}")
        categories_ids = validated_data.pop('categories', validated_data.pop('categories_ids', []))
        tags_ids = validated_data.pop('tags', validated_data.pop('tags_ids', []))
        options_ids = validated_data.pop('options', validated_data.pop('options_ids', []))
        media_files = validated_data.pop('media_files', [])
        media_ids = validated_data.pop('media_ids', [])
        image_ids = validated_data.pop('image_ids', None)
        video_ids = validated_data.pop('video_ids', None)
        audio_ids = validated_data.pop('audio_ids', None)
        document_ids = validated_data.pop('document_ids', None)
        
        if not validated_data.get('slug') and validated_data.get('title'):
            from django.utils.text import slugify
            base_slug = slugify(validated_data['title'])
            slug = base_slug
            counter = 1
            while Portfolio.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug

        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        if not validated_data.get('og_title'):
            validated_data['og_title'] = validated_data.get('meta_title')
        if not validated_data.get('og_description'):
            validated_data['og_description'] = validated_data.get('meta_description')

        with transaction.atomic():
            portfolio = Portfolio.objects.create(created_by=created_by, **validated_data)
            
            if categories_ids:
                portfolio.categories.set(categories_ids)
            if tags_ids:
                portfolio.tags.set(tags_ids)
            if options_ids:
                portfolio.options.set(options_ids)
            
            if media_files or media_ids:
                PortfolioAdminMediaService.add_media_bulk(
                    portfolio_id=portfolio.id,
                    media_files=media_files,
                    media_ids=media_ids,
                    image_ids=image_ids,
                    video_ids=video_ids,
                    audio_ids=audio_ids,
                    document_ids=document_ids,
                    created_by=created_by
                )

        PortfolioCacheManager.invalidate_portfolio(portfolio.id)
        PortfolioCacheManager.invalidate_all_lists()
        PortfolioCacheManager.invalidate_seo_report()
        
        return portfolio

    @staticmethod
    def update_portfolio(portfolio_id, validated_data, updated_by=None):
        logger.info(f"Updating portfolio {portfolio_id}. Updated By: {updated_by}")
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise ValidationError(PORTFOLIO_ERRORS["portfolio_not_found"])
        
        categories_val = validated_data.pop('categories', validated_data.pop('categories_ids', None))
        tags_val = validated_data.pop('tags', validated_data.pop('tags_ids', None))
        options_val = validated_data.pop('options', validated_data.pop('options_ids', None))
        
        media_ids = validated_data.pop('media_ids', None)
        image_ids = validated_data.pop('image_ids', None)
        video_ids = validated_data.pop('video_ids', None)
        audio_ids = validated_data.pop('audio_ids', None)
        document_ids = validated_data.pop('document_ids', None)
        
        media_files = validated_data.pop('media_files', None)
        main_image_id = validated_data.pop('main_image_id', None)
        media_covers = validated_data.pop('media_covers', None)
        image_covers = validated_data.pop('image_covers', None)
        video_covers = validated_data.pop('video_covers', None)
        audio_covers = validated_data.pop('audio_covers', None)
        document_covers = validated_data.pop('document_covers', None)
        
        if 'title' in validated_data and not validated_data.get('slug'):
            from django.utils.text import slugify
            base_slug = slugify(validated_data['title'])
            slug = base_slug
            counter = 1
            while Portfolio.objects.filter(slug=slug).exclude(pk=portfolio_id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
            
        if 'title' in validated_data:
            if not validated_data.get('meta_title'):
                validated_data['meta_title'] = validated_data['title'][:70]
            if not validated_data.get('og_title'):
                validated_data['og_title'] = validated_data.get('meta_title')
                
        if 'short_description' in validated_data or 'description' in validated_data:
            desc_val = validated_data.get('short_description') or validated_data.get('description')
            if not validated_data.get('meta_description') and desc_val:
                validated_data['meta_description'] = desc_val[:300]
            if not validated_data.get('og_description'):
                validated_data['og_description'] = validated_data.get('meta_description') or portfolio.meta_description
        
        with transaction.atomic():
            for field, value in validated_data.items():
                if hasattr(portfolio, field):
                    setattr(portfolio, field, value)
            portfolio.save()
            
            if categories_val is not None:
                portfolio.categories.set(categories_val)
            if tags_val is not None:
                portfolio.tags.set(tags_val)
            if options_val is not None:
                portfolio.options.set(options_val)
            
            if media_files:
                media_result = PortfolioAdminMediaService.add_media_bulk(
                    portfolio_id=portfolio.id,
                    media_files=media_files,
                    created_by=updated_by
                )
                uploaded_ids = media_result.get('uploaded_media_ids', [])
                if uploaded_ids:
                    if media_ids is None: media_ids = uploaded_ids
                    else: media_ids = list(set(media_ids) | set(uploaded_ids))
                
            if any([media_ids, main_image_id, media_covers, image_covers, video_covers, audio_covers, document_covers]):
                PortfolioAdminMediaService.sync_media(
                    portfolio_id=portfolio.id,
                    media_ids=media_ids,
                    image_ids=image_ids,
                    video_ids=video_ids,
                    audio_ids=audio_ids,
                    document_ids=document_ids,
                    main_image_id=main_image_id,
                    media_covers=media_covers,
                    image_covers=image_covers,
                    video_covers=video_covers,
                    audio_covers=audio_covers,
                    document_covers=document_covers
                )
                
        PortfolioCacheManager.invalidate_portfolio(portfolio.id)
        PortfolioCacheManager.invalidate_all_lists()
        PortfolioCacheManager.invalidate_seo_report()
        portfolio.refresh_from_db()
        return portfolio

    @staticmethod
    def set_main_image(portfolio_id, media_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])
        
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
            raise PortfolioImage.DoesNotExist(PORTFOLIO_ERRORS["portfolio_image_not_found"])
        portfolio_image.is_main = True
        portfolio_image.save()
        
        if not portfolio.og_image:
            portfolio.og_image = portfolio_image.image
            portfolio.save(update_fields=['og_image'])

        PortfolioCacheManager.invalidate_portfolio(portfolio_id)
        PortfolioCacheManager.invalidate_all_lists()
        PortfolioCacheManager.invalidate_seo_report()
        
        return portfolio_image
    
    @staticmethod
    def bulk_update_status(portfolio_ids, new_status):
        if new_status not in dict(Portfolio.STATUS_CHOICES):
            return False
            
        Portfolio.objects.filter(id__in=portfolio_ids).update(
            status=new_status,
            updated_at=timezone.now()
        )
        PortfolioCacheManager.invalidate_portfolios(portfolio_ids)
        PortfolioCacheManager.invalidate_all_lists()
        PortfolioCacheManager.invalidate_seo_report()
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

        PortfolioCacheManager.invalidate_portfolios(list(portfolios.values_list('id', flat=True)))
        PortfolioCacheManager.invalidate_all_lists()
        PortfolioCacheManager.invalidate_seo_report()
        
        return True
    
    @staticmethod
    def get_seo_report():
        cache_key = PortfolioCacheKeys.seo_report()
        cached_report = cache.get(cache_key)
        if cached_report is not None:
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
            cache.set(cache_key, report_data, cache_ttl.ADMIN_SEO_REPORT_TTL)
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
        
        cache.set(cache_key, report_data, cache_ttl.ADMIN_SEO_REPORT_TTL)
        return report_data
    
    @staticmethod
    def delete_portfolio(portfolio_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])
        
        portfolio_medias = PortfolioImage.objects.filter(portfolio=portfolio)
        media_ids = list(portfolio_medias.values_list('image_id', flat=True))
        
        portfolio.delete()

        PortfolioCacheManager.invalidate_portfolio(portfolio_id)
        PortfolioCacheManager.invalidate_all_lists()
        PortfolioCacheManager.invalidate_seo_report()
        
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
            PortfolioCacheManager.invalidate_all_lists()
            PortfolioCacheManager.invalidate_seo_report()
        
        return deleted_count


class PortfolioExportRateLimitService:

    @staticmethod
    def check_and_increment(user_id, limit, window_seconds):
        cache_key = f"admin:portfolio:export:limit:{user_id}"
        export_count = cache.get(cache_key, 0)
        if export_count >= limit:
            return False
        cache.set(cache_key, export_count + 1, window_seconds)
        return True

class PortfolioAdminStatusService:
    
    @staticmethod
    def change_status(portfolio_id, new_status):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])

        if new_status not in dict(Portfolio.STATUS_CHOICES):
            return None

        portfolio.status = new_status
        portfolio.save(update_fields=['status', 'updated_at'])
        PortfolioCacheManager.invalidate_portfolio(portfolio_id)
        PortfolioCacheManager.invalidate_all_lists()
        PortfolioCacheManager.invalidate_seo_report()
        return portfolio
    
    @staticmethod
    def publish_portfolio(portfolio_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])
        
        seo_warnings = []
        if not portfolio.meta_title:
            seo_warnings.append(PORTFOLIO_ERRORS["seo_meta_title_missing"])
        if not portfolio.meta_description:
            seo_warnings.append(PORTFOLIO_ERRORS["seo_meta_description_missing"])
        if not portfolio.og_image:
            seo_warnings.append(PORTFOLIO_ERRORS["seo_og_image_missing"])
        
        portfolio.status = 'published'
        portfolio.save(update_fields=['status', 'updated_at'])

        PortfolioCacheManager.invalidate_portfolio(portfolio_id)
        PortfolioCacheManager.invalidate_all_lists()
        PortfolioCacheManager.invalidate_seo_report()
        
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
            raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])
        
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

            PortfolioCacheManager.invalidate_portfolio(portfolio_id)
            PortfolioCacheManager.invalidate_all_lists()
            PortfolioCacheManager.invalidate_seo_report()
        
        return portfolio
    
    @staticmethod
    def validate_seo_data(portfolio_id):
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist(PORTFOLIO_ERRORS["portfolio_not_found"])
        
        suggestions = []
        
        if portfolio.meta_title:
            if len(portfolio.meta_title) > 60:
                suggestions.append(PORTFOLIO_ERRORS["seo_meta_title_under_60"])
        
        if portfolio.meta_description:
            if len(portfolio.meta_description) < 120:
                suggestions.append(PORTFOLIO_ERRORS["seo_meta_description_min_120"])
            elif len(portfolio.meta_description) > 160:
                suggestions.append(PORTFOLIO_ERRORS["seo_meta_description_max_160"])
        
        if not portfolio.og_image:
            suggestions.append(PORTFOLIO_ERRORS["seo_add_og_image"])
        
        return {
            'is_valid': len(suggestions) == 0,
            'suggestions': suggestions,
            'completeness_score': portfolio.seo_completeness_score() if hasattr(portfolio, 'seo_completeness_score') else None
        }