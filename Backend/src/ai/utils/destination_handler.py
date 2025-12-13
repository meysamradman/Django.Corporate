from typing import Dict, Any, Optional
from django.utils.text import slugify
from django.db import transaction

from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS, CONTENT_ERRORS
from src.blog.models import Blog, BlogCategory, BlogTag
from src.blog.utils.cache import BlogCacheManager
from src.portfolio.models import Portfolio, PortfolioCategory, PortfolioTag, PortfolioOption
from src.portfolio.utils.cache import PortfolioCacheManager


class ContentDestinationHandler:
    """
    Handler برای ذخیره محتوای تولید شده توسط AI در مقصدهای مختلف
    
    این کلاس یک utility است که محتوای AI را در blog یا portfolio ذخیره می‌کند.
    """
    
    @classmethod
    def save_to_destination(
        cls,
        content_data: Dict[str, Any],
        destination: str,
        destination_data: Dict[str, Any],
        admin
    ) -> Dict[str, Any]:

        if destination == 'direct':

            return {
                'saved': False,
                'destination': 'direct',
                'message': AI_SUCCESS['content_not_saved']
            }
        
        elif destination == 'blog':
            return cls._save_to_blog(content_data, destination_data, admin)
        
        elif destination == 'portfolio':
            return cls._save_to_portfolio(content_data, destination_data, admin)
        
        else:
            raise ValueError(AI_ERRORS['destination_not_supported'].format(destination=destination))
    
    @classmethod
    def _save_to_blog(
        cls,
        content_data: Dict[str, Any],
        destination_data: Dict[str, Any],
        admin
    ) -> Dict[str, Any]:
        try:
            with transaction.atomic():

                base_slug = content_data.get('slug', slugify(content_data['title']))
                slug = base_slug
                counter = 1
                while Blog.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                blog = Blog.objects.create(
                    title=content_data['title'],
                    slug=slug,
                    short_description=content_data.get('meta_description', '')[:300],
                    description=content_data['content'],
                    status=destination_data.get('status', 'draft'),
                    is_featured=destination_data.get('is_featured', False),
                    is_public=destination_data.get('is_public', True),
                    meta_title=content_data.get('meta_title', content_data['title'])[:60],
                    meta_description=content_data.get('meta_description', '')[:160],
                    canonical_url=destination_data.get('canonical_url', ''),
                )
                
                category_ids = destination_data.get('categories', [])
                if category_ids:
                    categories = BlogCategory.objects.filter(id__in=category_ids, is_active=True)
                    blog.categories.set(categories)
                
                tag_ids = destination_data.get('tags', [])
                if tag_ids:
                    tags = BlogTag.objects.filter(id__in=tag_ids, is_active=True)
                    blog.tags.set(tags)
                
                BlogCacheManager.invalidate_blog(blog.id)
                
                return {
                    'saved': True,
                    'destination': 'blog',
                    'id': blog.id,
                    'public_id': str(blog.public_id),
                    'slug': blog.slug,
                    'url': blog.get_absolute_url(),
                    'message': AI_SUCCESS['content_saved_to_blog']
                }
        
        except Exception as e:
            raise ValueError(AI_ERRORS['content_save_failed'].format(destination='blog', error=str(e)))
    
    @classmethod
    def _save_to_portfolio(
        cls,
        content_data: Dict[str, Any],
        destination_data: Dict[str, Any],
        admin
    ) -> Dict[str, Any]:
        try:
            with transaction.atomic():
                base_slug = content_data.get('slug', slugify(content_data['title']))
                slug = base_slug
                counter = 1
                while Portfolio.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                portfolio = Portfolio.objects.create(
                    title=content_data['title'],
                    slug=slug,
                    short_description=content_data.get('meta_description', '')[:300],
                    description=content_data['content'],
                    status=destination_data.get('status', 'draft'),
                    is_featured=destination_data.get('is_featured', False),
                    is_public=destination_data.get('is_public', True),
                    meta_title=content_data.get('meta_title', content_data['title'])[:60],
                    meta_description=content_data.get('meta_description', '')[:160],
                    canonical_url=destination_data.get('canonical_url', ''),
                )
                
                category_ids = destination_data.get('categories', [])
                if category_ids:
                    categories = PortfolioCategory.objects.filter(id__in=category_ids, is_active=True)
                    portfolio.categories.set(categories)
                
                tag_ids = destination_data.get('tags', [])
                if tag_ids:
                    tags = PortfolioTag.objects.filter(id__in=tag_ids, is_active=True)
                    portfolio.tags.set(tags)
                
                option_ids = destination_data.get('options', [])
                if option_ids:
                    options = PortfolioOption.objects.filter(id__in=option_ids, is_active=True)
                    portfolio.options.set(options)
                
                PortfolioCacheManager.invalidate_portfolio(portfolio.id)
                
                return {
                    'saved': True,
                    'destination': 'portfolio',
                    'id': portfolio.id,
                    'public_id': str(portfolio.public_id),
                    'slug': portfolio.slug,
                    'url': portfolio.get_absolute_url(),
                    'message': AI_SUCCESS['content_saved_to_portfolio']
                }
        
        except Exception as e:
            raise ValueError(AI_ERRORS['content_save_failed'].format(destination='portfolio', error=str(e)))
    
    @classmethod
    def _save_to_podcast(cls, content_data, destination_data, admin):
        raise NotImplementedError(CONTENT_ERRORS["destination_not_supported"].format(destination="podcast"))
    
    @classmethod
    def _save_to_custom(cls, content_data, destination_data, admin):
        raise NotImplementedError(CONTENT_ERRORS["destination_not_supported"].format(destination="custom"))

