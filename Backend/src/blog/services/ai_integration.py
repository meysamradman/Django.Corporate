from typing import Dict, Any
from django.db import transaction
from django.utils.text import slugify

from src.blog.models import Blog, BlogCategory, BlogTag
from src.blog.utils.cache import BlogCacheManager
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS

def save_ai_content_to_blog(
    content_data: Dict[str, Any],
    destination_data: Dict[str, Any],
    admin
) -> Dict[str, Any]:
    """
    Save AI-generated content to Blog.
    """
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
