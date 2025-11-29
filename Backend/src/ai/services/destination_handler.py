"""
✅ AI Content Destination Handler
ذخیره محتوای تولید شده در مقصدهای مختلف (Blog, Portfolio, Future Apps)

Key Points:
- محتوا در دیتابیس ذخیره نمی‌شه (مگر اینکه ادمین بخواد)
- فقط وقتی destination != 'direct' → ذخیره میشه
- آماده برای توسعه (Podcast, etc)
- Redis Cache برای invalidation
"""
from typing import Dict, Any, Optional
from django.utils.text import slugify
from django.db import transaction
from django.core.cache import cache
import logging

from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS

logger = logging.getLogger(__name__)


class ContentDestinationHandler:
    """
    Handler برای ذخیره محتوای تولید شده در مقصدهای مختلف
    """
    
    @classmethod
    def save_to_destination(
        cls,
        content_data: Dict[str, Any],
        destination: str,
        destination_data: Dict[str, Any],
        admin
    ) -> Dict[str, Any]:
        """
        ذخیره محتوای تولید شده در مقصد مشخص
        
        Args:
            content_data: داده‌های محتوای تولید شده
            destination: مقصد ('direct', 'blog', 'portfolio')
            destination_data: داده‌های اضافی (categories, tags, status)
            admin: کاربر ادمین
        
        Returns:
            Dict با اطلاعات ذخیره‌سازی
        """
        if destination == 'direct':
            # فقط نمایش - بدون ذخیره
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
        """
        ذخیره محتوا در Blog
        
        destination_data می‌تونه شامل باشه:
        - categories: لیست ID دسته‌بندی‌ها
        - tags: لیست ID تگ‌ها
        - status: 'draft' یا 'published'
        - is_featured: bool
        """
        from src.blog.models import Blog, BlogCategory, BlogTag
        
        try:
            with transaction.atomic():
                # ایجاد slug منحصر به فرد
                base_slug = content_data.get('slug', slugify(content_data['title']))
                slug = base_slug
                counter = 1
                while Blog.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                # ایجاد Blog
                blog = Blog.objects.create(
                    title=content_data['title'],
                    slug=slug,
                    short_description=content_data.get('meta_description', '')[:300],
                    description=content_data['content'],
                    status=destination_data.get('status', 'draft'),
                    is_featured=destination_data.get('is_featured', False),
                    is_public=destination_data.get('is_public', True),
                    # SEO fields
                    meta_title=content_data.get('meta_title', content_data['title'])[:60],
                    meta_description=content_data.get('meta_description', '')[:160],
                    canonical_url=destination_data.get('canonical_url', ''),
                )
                
                # اضافه کردن Categories
                category_ids = destination_data.get('categories', [])
                if category_ids:
                    categories = BlogCategory.objects.filter(id__in=category_ids, is_active=True)
                    blog.categories.set(categories)
                
                # اضافه کردن Tags
                tag_ids = destination_data.get('tags', [])
                if tag_ids:
                    tags = BlogTag.objects.filter(id__in=tag_ids, is_active=True)
                    blog.tags.set(tags)
                
                logger.info(f"✅ Blog created: {blog.id} - {blog.title}")
                
                # ✅ Clear blog cache
                cache.delete_pattern('blog_*')
                cache.delete(f'blog_detail_{blog.id}')
                cache.delete(f'blog_slug_{blog.slug}')
                
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
            logger.error(f"❌ Error saving to blog: {str(e)}", exc_info=True)
            raise ValueError(AI_ERRORS['content_save_failed'].format(destination='blog', error=str(e)))
    
    @classmethod
    def _save_to_portfolio(
        cls,
        content_data: Dict[str, Any],
        destination_data: Dict[str, Any],
        admin
    ) -> Dict[str, Any]:
        """
        ذخیره محتوا در Portfolio
        
        destination_data می‌تونه شامل باشه:
        - categories: لیست ID دسته‌بندی‌ها
        - tags: لیست ID تگ‌ها
        - options: لیست ID گزینه‌ها
        - status: 'draft' یا 'published'
        - is_featured: bool
        """
        from src.portfolio.models import Portfolio, PortfolioCategory, PortfolioTag, PortfolioOption
        
        try:
            with transaction.atomic():
                # ایجاد slug منحصر به فرد
                base_slug = content_data.get('slug', slugify(content_data['title']))
                slug = base_slug
                counter = 1
                while Portfolio.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{counter}"
                    counter += 1
                
                # ایجاد Portfolio
                portfolio = Portfolio.objects.create(
                    title=content_data['title'],
                    slug=slug,
                    short_description=content_data.get('meta_description', '')[:300],
                    description=content_data['content'],
                    status=destination_data.get('status', 'draft'),
                    is_featured=destination_data.get('is_featured', False),
                    is_public=destination_data.get('is_public', True),
                    # SEO fields
                    meta_title=content_data.get('meta_title', content_data['title'])[:60],
                    meta_description=content_data.get('meta_description', '')[:160],
                    canonical_url=destination_data.get('canonical_url', ''),
                )
                
                # اضافه کردن Categories
                category_ids = destination_data.get('categories', [])
                if category_ids:
                    categories = PortfolioCategory.objects.filter(id__in=category_ids, is_active=True)
                    portfolio.categories.set(categories)
                
                # اضافه کردن Tags
                tag_ids = destination_data.get('tags', [])
                if tag_ids:
                    tags = PortfolioTag.objects.filter(id__in=tag_ids, is_active=True)
                    portfolio.tags.set(tags)
                
                # اضافه کردن Options
                option_ids = destination_data.get('options', [])
                if option_ids:
                    options = PortfolioOption.objects.filter(id__in=option_ids, is_active=True)
                    portfolio.options.set(options)
                
                logger.info(f"✅ Portfolio created: {portfolio.id} - {portfolio.title}")
                
                # ✅ Clear portfolio cache
                cache.delete_pattern('portfolio_*')
                cache.delete(f'portfolio_detail_{portfolio.id}')
                cache.delete(f'portfolio_slug_{portfolio.slug}')
                
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
            logger.error(f"❌ Error saving to portfolio: {str(e)}", exc_info=True)
            raise ValueError(AI_ERRORS['content_save_failed'].format(destination='portfolio', error=str(e)))
    
    # 🔮 آماده برای توسعه آینده
    @classmethod
    def _save_to_podcast(cls, content_data, destination_data, admin):
        """
        🔮 Future: ذخیره در Podcast
        الان فعال نیست - آماده برای آینده
        """
        raise NotImplementedError("Podcast app هنوز پیاده‌سازی نشده است")
    
    @classmethod
    def _save_to_custom(cls, content_data, destination_data, admin):
        """
        🔮 Future: ذخیره در مقصد سفارشی
        """
        raise NotImplementedError("Custom destination هنوز پیاده‌سازی نشده است")
