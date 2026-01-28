from celery import shared_task
from django.utils import timezone
from django.db.models import Count, Q
import json
from src.core.cache import CacheService
from .models import PageView, DailyStats

ANALYTICS_QUEUE = "analytics:queue"  # Redis List

@shared_task
def process_views():
    try:
        visits = []
        processed_count = 0
        max_batch = 1000
        
        for _ in range(max_batch):
            data_str = CacheService.list_pop(ANALYTICS_QUEUE, side='right')
            if not data_str:
                break
            
            try:
                data = json.loads(data_str)
                
                device = data.get('device', 'desktop')
                if not device:
                    ua = data.get('user_agent', '').lower()
                    if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
                        device = 'mobile'
                    elif 'tablet' in ua or 'ipad' in ua:
                        device = 'tablet'
                    else:
                        device = 'desktop'
                
                visits.append(PageView(
                    source=data.get('source', 'web'),
                    site_id=data.get('site_id', 'default'),
                    path=data.get('path', '/'),
                    user_id=data.get('user_id'),
                    session_id=data.get('session_key', ''),
                    ip=data.get('ip_address', '0.0.0.0'),
                    country=data.get('country', ''),
                    device=device,
                    date=timezone.datetime.fromtimestamp(data.get('timestamp', timezone.now().timestamp())).date()
                ))
                visits[-1].browser = data.get('browser', '')
                visits[-1].os_name = data.get('os', '')
                visits[-1].referrer = data.get('referrer', '')
                visits[-1].user_agent = data.get('user_agent', '')
                
                processed_count += 1
            except Exception as e:
                continue
        
        if visits:
            try:
                PageView.objects.bulk_create(visits, batch_size=500, ignore_conflicts=True)
                
                _sync_module_statistics(visits)
                
            except Exception as e:
                return f"Error saving visits: {e}"
        
        return f"Processed {processed_count} visits, saved {len(visits)} views"
        
    except Exception as e:
        return f"Redis connection failed: {e}"

def _sync_module_statistics(visits):
    
    from django.db.models import F
    from django.apps import apps
    import re

    patterns = {
        'real_estate': re.compile(r'^/property/([^/]+)/?$'),
        'blog': re.compile(r'^/blog/([^/]+)/?$'),
        'portfolio': re.compile(r'^/portfolio/([^/]+)/?$'),
    }

    for visit in visits:
        for module, pattern in patterns.items():
            match = pattern.match(visit.path)
            if not match:
                continue
            
            slug = match.group(1)
            source = visit.source
            country = visit.country or 'Unknown'
            platform = visit.device or 'desktop'
            
            try:
                if module == 'real_estate' and apps.is_installed('src.real_estate'):
                    from src.real_estate.models import (
                        Property, PropertyViewLog, PropertyStatistics, 
                        PropertyTypeStatistics, PropertyStateStatistics, RegionalStatistics
                    )
                    prop = Property.objects.filter(slug=slug).first()
                    if prop:
                        update_fields = ['views_count']
                        prop.views_count = F('views_count') + 1
                        if source == 'app':
                            prop.app_views_count = F('app_views_count') + 1
                            update_fields.append('app_views_count')
                        else:
                            prop.web_views_count = F('web_views_count') + 1
                            update_fields.append('web_views_count')
                        prop.save(update_fields=update_fields)
                        
                        stats, created = PropertyStatistics.objects.get_or_create(
                            property=prop,
                            date=visit.date,
                            defaults={'views': 1, 'web_views': 1 if source == 'web' else 0, 'app_views': 1 if source == 'app' else 0}
                        )
                        if not created:
                            stats.views = F('views') + 1
                            if source == 'app':
                                stats.app_views = F('app_views') + 1
                            else:
                                stats.web_views = F('web_views') + 1
                        
                        stats.countries[country] = stats.countries.get(country, 0) + 1
                        stats.platforms[platform] = stats.platforms.get(platform, 0) + 1
                        stats.save()

                        PropertyTypeStatistics.objects.get_or_create(
                            property_type=prop.property_type,
                            date=visit.date,
                            defaults={'views': 0}
                        )
                        PropertyTypeStatistics.objects.filter(
                            property_type=prop.property_type, date=visit.date
                        ).update(views=F('views') + 1)

                        PropertyStateStatistics.objects.get_or_create(
                            state=prop.state,
                            date=visit.date,
                            defaults={'views': 0}
                        )
                        PropertyStateStatistics.objects.filter(
                            state=prop.state, date=visit.date
                        ).update(views=F('views') + 1)

                        RegionalStatistics.objects.get_or_create(
                            province=prop.province,
                            city=prop.city,
                            region=prop.region,
                            date=visit.date,
                            defaults={'views': 0}
                        )
                        RegionalStatistics.objects.filter(
                            province=prop.province, city=prop.city, 
                            region=prop.region, date=visit.date
                        ).update(views=F('views') + 1)

                        PropertyViewLog.objects.create(
                            property=prop,
                            user_id=visit.user_id,
                            source=source,
                            site_id=visit.site_id,
                            ip_address=visit.ip,
                            country=visit.country,
                            device=visit.device,
                            browser=getattr(visit, 'browser', ''),
                            os=getattr(visit, 'os_name', ''),
                            user_agent=getattr(visit, 'user_agent', ''),
                            referrer=getattr(visit, 'referrer', '')
                        )

                elif module == 'blog' and apps.is_installed('src.blog'):
                    from src.blog.models import Blog, BlogViewLog, BlogStatistics
                    post = Blog.objects.filter(slug=slug).first()
                    if post:
                        update_fields = ['views_count']
                        post.views_count = F('views_count') + 1
                        if source == 'app':
                            post.app_views_count = F('app_views_count') + 1
                            update_fields.append('app_views_count')
                        else:
                            post.web_views_count = F('web_views_count') + 1
                            update_fields.append('web_views_count')
                        post.save(update_fields=update_fields)

                        stats, created = BlogStatistics.objects.get_or_create(
                            blog=post,
                            date=visit.date,
                            defaults={'views': 1, 'web_views': 1 if source == 'web' else 0, 'app_views': 1 if source == 'app' else 0}
                        )
                        if not created:
                            stats.views = F('views') + 1
                            if source == 'app':
                                stats.app_views = F('app_views') + 1
                            else:
                                stats.web_views = F('web_views') + 1
                        
                        stats.countries[country] = stats.countries.get(country, 0) + 1
                        stats.platforms[platform] = stats.platforms.get(platform, 0) + 1
                        stats.save()

                        BlogViewLog.objects.create(
                            blog=post,
                            user_id=visit.user_id,
                            source=source,
                            site_id=visit.site_id,
                            ip_address=visit.ip,
                            country=visit.country,
                            device=visit.device,
                            browser=getattr(visit, 'browser', ''),
                            os=getattr(visit, 'os_name', ''),
                            user_agent=getattr(visit, 'user_agent', ''),
                            referrer=getattr(visit, 'referrer', '')
                        )

                elif module == 'portfolio' and apps.is_installed('src.portfolio'):
                    from src.portfolio.models import Portfolio, PortfolioViewLog, PortfolioStatistics
                    item = Portfolio.objects.filter(slug=slug).first()
                    if item:
                        update_fields = ['views_count']
                        item.views_count = F('views_count') + 1
                        if source == 'app':
                            item.app_views_count = F('app_views_count') + 1
                            update_fields.append('app_views_count')
                        else:
                            item.web_views_count = F('web_views_count') + 1
                            update_fields.append('web_views_count')
                        item.save(update_fields=update_fields)

                        stats, created = PortfolioStatistics.objects.get_or_create(
                            portfolio=item,
                            date=visit.date,
                            defaults={'views': 1, 'web_views': 1 if source == 'web' else 0, 'app_views': 1 if source == 'app' else 0}
                        )
                        if not created:
                            stats.views = F('views') + 1
                            if source == 'app':
                                stats.app_views = F('app_views') + 1
                            else:
                                stats.web_views = F('web_views') + 1
                        
                        stats.countries[country] = stats.countries.get(country, 0) + 1
                        stats.platforms[platform] = stats.platforms.get(platform, 0) + 1
                        stats.save()

                        PortfolioViewLog.objects.create(
                            portfolio=item,
                            user_id=visit.user_id,
                            source=source,
                            site_id=visit.site_id,
                            ip_address=visit.ip,
                            country=visit.country,
                            device=visit.device,
                            browser=getattr(visit, 'browser', ''),
                            os=getattr(visit, 'os_name', ''),
                            user_agent=getattr(visit, 'user_agent', ''),
                            referrer=getattr(visit, 'referrer', '')
                        )
            except Exception:
                continue
            break

@shared_task
def calculate_daily():
    yesterday = timezone.now().date() - timezone.timedelta(days=1)
    
    site_ids = PageView.objects.filter(date=yesterday).values_list('site_id', flat=True).distinct()
    
    for site_id in site_ids:
            total_visits = PageView.objects.filter(site_id=site_id, date=yesterday).count()
            unique_visitors = PageView.objects.filter(site_id=site_id, date=yesterday).values('session_id').distinct().count()
            
            web_visits = PageView.objects.filter(site_id=site_id, date=yesterday, source='web').count()
            app_visits = PageView.objects.filter(site_id=site_id, date=yesterday, source='app').count()
            
            mobile_visits = PageView.objects.filter(site_id=site_id, date=yesterday, device='mobile').count()
            desktop_visits = PageView.objects.filter(site_id=site_id, date=yesterday, device='desktop').count()
            tablet_visits = PageView.objects.filter(site_id=site_id, date=yesterday, device='tablet').count()
            
            from django.db.models import Count
            source_qs = PageView.objects.filter(site_id=site_id, date=yesterday).values('source').annotate(count=Count('id'))
            sources_dist = {item['source']: item['count'] for item in source_qs}
            
            country_qs = PageView.objects.filter(site_id=site_id, date=yesterday).exclude(country='').values('country').annotate(count=Count('id')).order_by('-count')[:20]
            top_countries = {item['country']: item['count'] for item in country_qs}
            
            page_qs = PageView.objects.filter(site_id=site_id, date=yesterday).values('path').annotate(count=Count('id')).order_by('-count')[:50]
            top_pages = {item['path']: item['count'] for item in page_qs}
            
            DailyStats.objects.update_or_create(
                date=yesterday,
                site_id=site_id,
                defaults={
                    'total_visits': total_visits,
                    'unique_visitors': unique_visitors,
                    'web_visits': web_visits,
                    'app_visits': app_visits,
                    'mobile_visits': mobile_visits,
                    'desktop_visits': desktop_visits,
                    'tablet_visits': tablet_visits,
                    'sources_distribution': sources_dist,
                    'top_pages': top_pages,
                    'top_countries': top_countries
                }
            )
    return f"Daily stats calculated for {len(site_ids)} sites on {yesterday}"

@shared_task(name="analytics.tasks.capture_market_snapshots")
def capture_market_snapshots():
    
    from src.real_estate.models import Property, RegionalStatistics
    from django.db.models import Avg, Count
    from django.utils import timezone
    
    today = timezone.now().date()
    
    active_properties = Property.objects.filter(is_published=True, is_active=True)
    
    geo_stats = active_properties.values('province', 'city', 'region').annotate(
        avg_price=Avg('price', filter=Q(state__slug='sale')),
        avg_rent=Avg('monthly_rent', filter=Q(state__slug='rent')),
        total=Count('id')
    )
    
    count = 0
    for stat in geo_stats:
        RegionalStatistics.objects.update_or_create(
            province_id=stat['province'],
            city_id=stat['city'],
            region_id=stat['region'],
            date=today,
            defaults={
                'avg_price_sale': stat['avg_price'] or 0,
                'avg_rent_monthly': stat['avg_rent'] or 0,
                'total_active_listings': stat['total']
            }
        )
        count += 1
        
    return f"Market snapshots captured for {count} regions."

@shared_task
def cleanup_old_views():
    from datetime import timedelta
    
    cutoff_date = timezone.now().date() - timedelta(days=90)
    deleted_count, _ = PageView.objects.filter(date__lt=cutoff_date).delete()
    
    return f"Cleaned up {deleted_count} old views"

@shared_task
def get_queue_size():
    try:
        queue_size = CacheService.list_length(ANALYTICS_QUEUE)
        return f"Queue size: {queue_size}"
    except Exception as e:
        return f"Error: {e}"
