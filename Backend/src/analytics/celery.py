import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')

app = Celery('corporate')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ✅ Celery Beat Schedule - بهینه شده
app.conf.beat_schedule = {
    # هر 5 دقیقه - پردازش بازدیدها
    'process-analytics-views': {
        'task': 'src.analytics.tasks.process_views',
        'schedule': 300.0,
    },
    
    # هر شب 1 صبح - محاسبه آمار روزانه
    'calculate-daily-stats': {
        'task': 'src.analytics.tasks.calculate_daily',
        'schedule': crontab(hour=1, minute=0),
    },
    
    # ✅ هر یکشنبه 2 صبح - پاکسازی بازدیدهای قدیمی
    'cleanup-old-views': {
        'task': 'src.analytics.tasks.cleanup_old_views',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),
    },
    
    # ✅ هر 10 دقیقه - چک کردن سایز صف (مانیتورینگ)
    'monitor-queue-size': {
        'task': 'src.analytics.tasks.get_queue_size',
        'schedule': 600.0,
    },
}

# ✅ تنظیمات اضافی برای Performance
app.conf.update(
    # تعداد task های همزمان
    worker_prefetch_multiplier=4,
    
    # Timeout برای task ها
    task_time_limit=600,  # 10 دقیقه
    task_soft_time_limit=540,  # 9 دقیقه (هشدار)
    
    # Result expiration
    result_expires=3600,  # 1 ساعت
    
    # Task acknowledgment
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
)
