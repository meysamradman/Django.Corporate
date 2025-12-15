import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')

app = Celery('corporate')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'process-analytics-views': {
        'task': 'src.analytics.tasks.process_views',
        'schedule': 300.0,
    },
    
    'calculate-daily-stats': {
        'task': 'src.analytics.tasks.calculate_daily',
        'schedule': crontab(hour=1, minute=0),
    },
    
    'cleanup-old-views': {
        'task': 'src.analytics.tasks.cleanup_old_views',
        'schedule': crontab(hour=2, minute=0, day_of_week=0),
    },
    
    'monitor-queue-size': {
        'task': 'src.analytics.tasks.get_queue_size',
        'schedule': 600.0,
    },
}

app.conf.update(
    worker_prefetch_multiplier=4,
    task_time_limit=600,
    task_soft_time_limit=540,
    result_expires=3600,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
)
