from typing import Dict, Any
from django.db import transaction
from django.utils.text import slugify

from src.portfolio.models import Portfolio, PortfolioCategory, PortfolioTag, PortfolioOption
from src.portfolio.utils.cache import PortfolioCacheManager
from src.ai.messages.messages import AI_SUCCESS, AI_ERRORS

def save_ai_content_to_portfolio(
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
