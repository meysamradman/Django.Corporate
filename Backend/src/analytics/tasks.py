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
                    path=data.get('path', '/'),
                    user=data.get('user_id'),
                    session_id=data.get('session_key', ''),
                    ip=data.get('ip_address', '0.0.0.0'),
                    country=data.get('country', ''),
                    device=device,
                    date=timezone.datetime.fromtimestamp(data.get('timestamp', timezone.now().timestamp())).date()
                ))
                processed_count += 1
            except Exception as e:
                continue
        
        if visits:
            try:
                PageView.objects.bulk_create(visits, batch_size=500, ignore_conflicts=True)
            except Exception as e:
                return f"Error saving visits: {e}"
        
        return f"Processed {processed_count} visits, saved {len(visits)} views"
        
    except Exception as e:
        return f"Redis connection failed: {e}"


@shared_task
def calculate_daily():
    yesterday = timezone.now().date() - timezone.timedelta(days=1)
    views = PageView.objects.filter(date=yesterday)
    
    stats = views.aggregate(
        total=Count('id'),
        unique=Count('session_id', distinct=True),
        web=Count('id', filter=Q(source='web')),
        app=Count('id', filter=Q(source='app')),
        mobile=Count('id', filter=Q(device='mobile')),
        desktop=Count('id', filter=Q(device='desktop')),
    )
    
    top_pages_list = list(
        views.values('path')
        .annotate(c=Count('id'))
        .order_by('-c')[:10]
    )
    top_pages = {item['path']: item['c'] for item in top_pages_list}
    
    top_countries_list = list(
        views.exclude(country='')
        .values('country')
        .annotate(c=Count('id'))
        .order_by('-c')[:10]
    )
    top_countries = {item['country']: item['c'] for item in top_countries_list}
    
    DailyStats.objects.update_or_create(
        date=yesterday,
        defaults={
            'total_visits': stats['total'] or 0,
            'unique_visitors': stats['unique'] or 0,
            'web_visits': stats['web'] or 0,
            'app_visits': stats['app'] or 0,
            'mobile_visits': stats['mobile'] or 0,
            'desktop_visits': stats['desktop'] or 0,
            'top_pages': top_pages,
            'top_countries': top_countries,
        }
    )
    
    return f"Stats for {yesterday}"


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
