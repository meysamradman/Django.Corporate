"""
System Statistics Service - Database size, Cache status, Storage usage
Optimized with caching - Safe for production
"""
from django.core.cache import cache
from django.utils import timezone
from django.db import connection
from django_redis import get_redis_connection
from django.db.models import Sum, Count
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.statistics.utils.cache import StatisticsCacheKeys, StatisticsCacheManager


class SystemStatsService:
    """
    System statistics - Database size, Cache status, Storage usage
    All queries are optimized and cached
    """
    CACHE_TIMEOUT = 600  # 10 minutes (system stats don't change frequently)
    REQUIRED_PERMISSION = 'statistics.system.read'

    @classmethod
    def get_stats(cls) -> dict:
        """Get system statistics"""
        cache_key = StatisticsCacheKeys.system()
        data = cache.get(cache_key)
        if not data:
            data = cls._calculate_stats()
            cache.set(cache_key, data, cls.CACHE_TIMEOUT)
        return data

    @classmethod
    def _calculate_stats(cls) -> dict:
        """
        Calculate system statistics
        Optimized: All queries use aggregation - no N+1 issues
        """
        # ✅ Storage usage by type - Single query per type with SUM
        # Uses file_size field (already stored in DB - no file system scan needed)
        storage_by_type = {
            'image': ImageMedia.objects.aggregate(
                total_size=Sum('file_size'),
                count=Count('id')
            ) or {'total_size': 0, 'count': 0},
            'video': VideoMedia.objects.aggregate(
                total_size=Sum('file_size'),
                count=Count('id')
            ) or {'total_size': 0, 'count': 0},
            'audio': AudioMedia.objects.aggregate(
                total_size=Sum('file_size'),
                count=Count('id')
            ) or {'total_size': 0, 'count': 0},
            'document': DocumentMedia.objects.aggregate(
                total_size=Sum('file_size'),
                count=Count('id')
            ) or {'total_size': 0, 'count': 0},
        }

        # Calculate total storage
        total_storage = sum(
            data.get('total_size', 0) or 0
            for data in storage_by_type.values()
        )

        # Format storage sizes
        formatted_storage = {}
        for media_type, data in storage_by_type.items():
            size_bytes = data.get('total_size', 0) or 0
            formatted_storage[media_type] = {
                'size_bytes': size_bytes,
                'size_mb': round(size_bytes / (1024 * 1024), 2),
                'size_gb': round(size_bytes / (1024 * 1024 * 1024), 2),
                'count': data.get('count', 0) or 0,
                'formatted': cls._format_bytes(size_bytes)
            }

        # ✅ Redis Cache Status - Lightweight (Redis INFO command)
        cache_status = cls._get_cache_status()

        # ✅ Database Size - Lightweight (PostgreSQL/MySQL query)
        db_size = cls._get_database_size()

        return {
            'storage': {
                'total_bytes': total_storage,
                'total_mb': round(total_storage / (1024 * 1024), 2),
                'total_gb': round(total_storage / (1024 * 1024 * 1024), 2),
                'total_formatted': cls._format_bytes(total_storage),
                'by_type': formatted_storage,
            },
            'cache': cache_status,
            'database': db_size,
            'generated_at': timezone.now().isoformat(),
        }

    @classmethod
    def _get_cache_status(cls) -> dict:
        """Get Redis cache status - Lightweight"""
        try:
            redis_client = get_redis_connection('default')
            info = redis_client.info('memory')
            
            # Get memory usage
            used_memory = info.get('used_memory', 0)
            used_memory_human = info.get('used_memory_human', '0B')
            
            # Get key count
            db_info = redis_client.info('keyspace')
            total_keys = 0
            for db_name, db_data in db_info.items():
                if db_name.startswith('db'):
                    total_keys += db_data.get('keys', 0)
            
            # Get cache hit/miss stats (if available)
            stats = redis_client.info('stats')
            keyspace_hits = stats.get('keyspace_hits', 0)
            keyspace_misses = stats.get('keyspace_misses', 0)
            total_requests = keyspace_hits + keyspace_misses
            hit_rate = (keyspace_hits / total_requests * 100) if total_requests > 0 else 0

            return {
                'status': 'connected',
                'used_memory_bytes': used_memory,
                'used_memory_formatted': used_memory_human,
                'total_keys': total_keys,
                'hit_rate': round(hit_rate, 2),
                'keyspace_hits': keyspace_hits,
                'keyspace_misses': keyspace_misses,
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'used_memory_bytes': 0,
                'used_memory_formatted': '0B',
                'total_keys': 0,
                'hit_rate': 0,
            }

    @classmethod
    def _get_database_size(cls) -> dict:
        """Get database size - Lightweight (database-specific query)"""
        try:
            with connection.cursor() as cursor:
                db_name = connection.settings_dict['NAME']
                vendor = connection.vendor
                
                if vendor == 'postgresql':
                    # PostgreSQL
                    cursor.execute("""
                        SELECT pg_size_pretty(pg_database_size(%s)) as size,
                               pg_database_size(%s) as size_bytes
                    """, [db_name, db_name])
                    row = cursor.fetchone()
                    if row:
                        return {
                            'size_formatted': row[0],
                            'size_bytes': row[1],
                            'size_mb': round(row[1] / (1024 * 1024), 2),
                            'size_gb': round(row[1] / (1024 * 1024 * 1024), 2),
                            'vendor': 'postgresql',
                        }
                elif vendor == 'mysql':
                    # MySQL
                    cursor.execute("""
                        SELECT 
                            ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb,
                            ROUND(SUM(data_length + index_length) / 1024 / 1024 / 1024, 2) AS size_gb,
                            SUM(data_length + index_length) AS size_bytes
                        FROM information_schema.tables 
                        WHERE table_schema = %s
                    """, [db_name])
                    row = cursor.fetchone()
                    if row:
                        return {
                            'size_formatted': f"{row[0]} MB",
                            'size_bytes': int(row[2] or 0),
                            'size_mb': row[0] or 0,
                            'size_gb': row[1] or 0,
                            'vendor': 'mysql',
                        }
                elif vendor == 'sqlite':
                    # SQLite - get file size
                    import os
                    db_path = connection.settings_dict['NAME']
                    if os.path.exists(db_path):
                        size_bytes = os.path.getsize(db_path)
                        return {
                            'size_formatted': cls._format_bytes(size_bytes),
                            'size_bytes': size_bytes,
                            'size_mb': round(size_bytes / (1024 * 1024), 2),
                            'size_gb': round(size_bytes / (1024 * 1024 * 1024), 2),
                            'vendor': 'sqlite',
                        }
                
                return {
                    'size_formatted': 'N/A',
                    'size_bytes': 0,
                    'size_mb': 0,
                    'size_gb': 0,
                    'vendor': vendor,
                }
        except Exception as e:
            return {
                'size_formatted': 'Error',
                'size_bytes': 0,
                'size_mb': 0,
                'size_gb': 0,
                'vendor': 'unknown',
                'error': str(e),
            }

    @staticmethod
    def _format_bytes(bytes_size: int) -> str:
        """Format bytes to human readable format"""
        if bytes_size == 0:
            return '0 B'
        
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_size < 1024.0:
                return f"{bytes_size:.2f} {unit}"
            bytes_size /= 1024.0
        return f"{bytes_size:.2f} PB"

    @classmethod
    def clear_cache(cls):
        """Clear system stats cache"""
        StatisticsCacheManager.invalidate_system()

