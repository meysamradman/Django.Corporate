from celery import shared_task
from django_redis import get_redis_connection
from django.utils import timezone
from django.db.models import Count, Q
import json
import logging
from .models import PageView, DailyStats

logger = logging.getLogger(__name__)

ANALYTICS_QUEUE = "analytics:queue"  # Redis List


@shared_task
def process_views():
    """
    پردازش صف بازدیدها - هر 5 دقیقه
    
    ✅ تغییرات:
    - استفاده از RPOP بجای keys() - بسیار سریعتر و امن‌تر
    - پردازش batch برای کارایی بهتر
    """
    try:
        redis_conn = get_redis_connection("default")
        visits = []
        processed_count = 0
        max_batch = 1000  # ماکزیمم 1000 در هر بار
        
        # ✅ استفاده از RPOP بجای keys() - بسیار سریعتر
        for _ in range(max_batch):
            data_str = redis_conn.rpop(ANALYTICS_QUEUE)
            if not data_str:
                break
            
            try:
                data = json.loads(data_str.decode() if isinstance(data_str, bytes) else data_str)
                
                # استفاده از device از data (اگر وجود داشته باشه)
                device = data.get('device', 'desktop')
                if not device:
                    # Fallback: تشخیص از user_agent
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
                    user=data.get('user_id'),  # همیشه None (فقط Guest)
                    session_id=data.get('session_key', ''),
                    ip=data.get('ip_address', '0.0.0.0'),
                    country=data.get('country', ''),
                    device=device,
                    date=timezone.datetime.fromtimestamp(data.get('timestamp', timezone.now().timestamp())).date()
                ))
                processed_count += 1
            except Exception as e:
                logger.debug(f"Failed to process visit: {e}")
                continue
        
        if visits:
            try:
                PageView.objects.bulk_create(visits, batch_size=500, ignore_conflicts=True)
                logger.info(f"Successfully saved {len(visits)} page views")
            except Exception as e:
                logger.error(f"Failed to save page views: {e}")
                return f"Error saving visits: {e}"
        
        return f"Processed {processed_count} visits, saved {len(visits)} views"
        
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return f"Redis connection failed: {e}"


@shared_task
def calculate_daily():
    """محاسبه آمار روزانه - هر شب"""
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
    
    # Top pages
    top_pages_list = list(
        views.values('path')
        .annotate(c=Count('id'))
        .order_by('-c')[:10]
    )
    top_pages = {item['path']: item['c'] for item in top_pages_list}
    
    # Top countries
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
    
    logger.info(f"Daily stats calculated for {yesterday}")
    return f"Stats for {yesterday}"


@shared_task
def cleanup_old_views():
    """پاکسازی بازدیدهای قدیمی - هر یکشنبه"""
    from datetime import timedelta
    
    # حذف بازدیدهای قدیمی‌تر از 90 روز
    cutoff_date = timezone.now().date() - timedelta(days=90)
    deleted_count, _ = PageView.objects.filter(date__lt=cutoff_date).delete()
    
    logger.info(f"Cleaned up {deleted_count} old page views")
    return f"Cleaned up {deleted_count} old views"


@shared_task
def get_queue_size():
    """چک کردن سایز صف - برای مانیتورینگ"""
    try:
        redis_conn = get_redis_connection("default")
        queue_size = redis_conn.llen(ANALYTICS_QUEUE)
        
        if queue_size > 5000:
            logger.warning(f"Analytics queue size is high: {queue_size}")
        
        return f"Queue size: {queue_size}"
    except Exception as e:
        logger.error(f"Failed to get queue size: {e}")
        return f"Error: {e}"
