import os
import sys
import django
import argparse
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from django_redis import get_redis_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def clear_all_cache():
    redis_client = get_redis_connection('default')
    print('⚠️  Clearing ALL cache entries...')
    redis_client.flushdb()
    print('✅ All cache entries cleared successfully!')
    logger.info("All cache entries cleared via script")


def clear_pattern(pattern):
    redis_client = get_redis_connection('default')
    print(f'⚠️  Clearing cache entries matching pattern: {pattern}')
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)
        print(f'✅ Cleared {len(keys)} cache entries matching pattern: {pattern}')
        logger.info(f"Cleared {len(keys)} cache entries matching pattern: {pattern}")
    else:
        print(f'⚠️  No cache entries found matching pattern: {pattern}')


def clear_app_cache(app_name):
    """Clear cache for specific app"""
    app_patterns = {
        'user': 'webtalik:1:user_*',
        'blog': 'webtalik:1:blog_*',
        'portfolio': 'webtalik:1:portfolio_*',
        'ticket': 'webtalik:1:ticket_*',
        'ai': 'webtalik:1:ai_*',
        'chatbot': 'webtalik:1:chatbot_*',
        'statistics': 'webtalik:1:statistics_*',
        'captcha': 'webtalik:1:captcha_*',
    }
    
    if app_name.lower() not in app_patterns:
        print(f'❌ Unknown app: {app_name}')
        print(f'Available apps: {", ".join(app_patterns.keys())}')
        return
    
    pattern = app_patterns[app_name.lower()]
    print(f'⚠️  Clearing cache for app: {app_name} (pattern: {pattern})')
    keys = redis_client.keys(pattern)
    if keys:
        redis_client = get_redis_connection('default')
        redis_client.delete(*keys)
        print(f'✅ Cleared {len(keys)} cache entries for app: {app_name}')
        logger.info(f"Cleared {len(keys)} cache entries for app: {app_name}")
    else:
        print(f'⚠️  No cache entries found for app: {app_name}')


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Clear Redis cache entries')
    parser.add_argument(
        '--all',
        action='store_true',
        help='Clear ALL cache entries (use with caution!)'
    )
    parser.add_argument(
        '--app',
        type=str,
        help='Clear cache for specific app (user, blog, portfolio, ticket, ai, chatbot, statistics, captcha)'
    )
    parser.add_argument(
        '--pattern',
        type=str,
        help='Clear cache entries matching pattern (e.g., "webtalik:1:portfolio:*")'
    )
    
    args = parser.parse_args()
    
    try:
        if args.all:
            clear_all_cache()
        elif args.pattern:
            clear_pattern(args.pattern)
        elif args.app:
            clear_app_cache(args.app)
        else:
            print('❌ Please specify --all, --app APP_NAME, or --pattern PATTERN')
            print('\nUsage examples:')
            print('  python scripts/clear_cache.py --all')
            print('  python scripts/clear_cache.py --app portfolio')
            print('  python scripts/clear_cache.py --pattern "webtalik:1:portfolio:*"')
            sys.exit(1)
    except Exception as e:
        print(f'❌ Error clearing cache: {str(e)}')
        logger.error(f"Error clearing cache: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()

