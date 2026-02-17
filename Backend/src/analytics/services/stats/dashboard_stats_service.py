from django.apps import apps
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum, Count, Avg
from src.core.cache import CacheService
from src.analytics.utils.cache import AnalyticsCacheKeys, AnalyticsCacheManager
from src.analytics.utils.cache_ttl import AnalyticsCacheTTL
from src.analytics.services.realtime import OnlineUsersRealtimeService

User = get_user_model()

class DashboardStatsService:
    @classmethod
    def get_stats(cls, use_cache: bool = True) -> dict:
        cache_key = AnalyticsCacheKeys.dashboard()
        data = CacheService.get(cache_key) if use_cache else None
        if data is None:
            data = cls._calculate_stats()
            CacheService.set(cache_key, data, timeout=AnalyticsCacheTTL.ADMIN_STATS)
        return data
    
    @classmethod
    def _calculate_stats(cls) -> dict:
        stats = {
            'generated_at': timezone.now().isoformat(),
            'online_users_now': OnlineUsersRealtimeService.get_online_users(),
        }
        
        stats['total_users'] = User.objects.filter(
            user_type='user',
            is_staff=False
        ).count()
        
        stats['total_admins'] = User.objects.filter(
            user_type='admin',
            is_staff=True,
            is_admin_active=True
        ).count()
        
        if apps.is_installed('src.media'):
            from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
            stats['total_media'] = (
                ImageMedia.objects.count() +
                VideoMedia.objects.count() +
                AudioMedia.objects.count() +
                DocumentMedia.objects.count()
            )
        else:
            stats['total_media'] = 0
        
        if apps.is_installed('src.portfolio'):
            from src.portfolio.models.portfolio import Portfolio
            from src.portfolio.models.category import PortfolioCategory
            from src.portfolio.models.tag import PortfolioTag
            from src.portfolio.models.option import PortfolioOption
            
            stats['total_portfolios'] = Portfolio.objects.count()
            stats['total_portfolio_categories'] = PortfolioCategory.objects.count()
            stats['total_portfolio_tags'] = PortfolioTag.objects.count()
            stats['total_portfolio_options'] = PortfolioOption.objects.count()
            
            stats['total_portfolios_views'] = Portfolio.objects.aggregate(total=Sum('views_count'))['total'] or 0
            stats['total_portfolios_web_views'] = Portfolio.objects.aggregate(total=Sum('web_views_count'))['total'] or 0
            stats['total_portfolios_app_views'] = Portfolio.objects.aggregate(total=Sum('app_views_count'))['total'] or 0
            stats['total_portfolios_favorites'] = Portfolio.objects.aggregate(total=Sum('favorites_count'))['total'] or 0
        else:
            stats['total_portfolios'] = 0
            stats['total_portfolio_categories'] = 0
            stats['total_portfolio_tags'] = 0
            stats['total_portfolio_options'] = 0
            stats['total_portfolios_views'] = 0
            stats['total_portfolios_web_views'] = 0
            stats['total_portfolios_app_views'] = 0
            stats['total_portfolios_favorites'] = 0
        
        if apps.is_installed('src.blog'):
            from src.blog.models.blog import Blog
            from src.blog.models.category import BlogCategory
            from src.blog.models.tag import BlogTag
            
            stats['total_posts'] = Blog.objects.count()
            stats['total_blog_categories'] = BlogCategory.objects.count()
            stats['total_blog_tags'] = BlogTag.objects.count()
            
            stats['total_posts_views'] = Blog.objects.aggregate(total=Sum('views_count'))['total'] or 0
            stats['total_posts_web_views'] = Blog.objects.aggregate(total=Sum('web_views_count'))['total'] or 0
            stats['total_posts_app_views'] = Blog.objects.aggregate(total=Sum('app_views_count'))['total'] or 0
            stats['total_posts_favorites'] = Blog.objects.aggregate(total=Sum('favorites_count'))['total'] or 0
        else:
            stats['total_posts'] = 0
            stats['total_blog_categories'] = 0
            stats['total_blog_tags'] = 0
            stats['total_posts_views'] = 0
            stats['total_posts_web_views'] = 0
            stats['total_posts_app_views'] = 0
            stats['total_posts_favorites'] = 0
        
        if apps.is_installed('src.email') and apps.is_installed('src.ticket'):
            stats['communication_performance'] = cls._get_communication_stats()
        
        if apps.is_installed('src.user'):
            stats['admin_leaderboard'] = cls._get_admin_performance()
        
        if apps.is_installed('src.real_estate'):
            from src.real_estate.models.property import Property
            from src.real_estate.models.agent import PropertyAgent
            from src.real_estate.models.agency import RealEstateAgency
            from src.real_estate.models.statistics import PropertyInquiry
            
            stats['total_properties'] = Property.objects.count()
            stats['total_agencies'] = RealEstateAgency.objects.count()
            stats['total_agents'] = PropertyAgent.objects.count()
            stats['total_inquiries'] = PropertyInquiry.objects.count()
            stats['new_inquiries'] = PropertyInquiry.objects.filter(status='new').count()

            from src.real_estate.services.analytics.market_analysis_service import MarketAnalysisService
            stats['property_sentiment'] = MarketAnalysisService.get_market_sentiment()

            stats['total_views'] = Property.objects.aggregate(total=Sum('views_count'))['total'] or 0
            stats['total_web_views'] = Property.objects.aggregate(total=Sum('web_views_count'))['total'] or 0
            stats['total_app_views'] = Property.objects.aggregate(total=Sum('app_views_count'))['total'] or 0
            stats['total_favorites'] = Property.objects.aggregate(total=Sum('favorites_count'))['total'] or 0
            stats['total_inquiries'] = Property.objects.aggregate(total=Sum('inquiries_count'))['total'] or 0

            from src.real_estate.models.statistics import AgentStatistics, AgencyStatistics
            now = timezone.now()
            
            top_agents = AgentStatistics.objects.filter(year=now.year, month=now.month).order_by('-total_sales_value')[:5]
            stats['top_agents'] = [
                {
                    'name': a.agent.full_name,
                    'sales': a.properties_sold,
                    'conversion': float(a.conversion_rate),
                    'avg_time': a.avg_deal_time
                } for a in top_agents
            ]
            
            agency_summary = AgencyStatistics.objects.filter(year=now.year, month=now.month).aggregate(
                total_sales=Sum('total_sales_value'),
                avg_conv=Avg('conversion_rate'),
                avg_time=Avg('avg_deal_time')
            )
            stats['business_performance'] = {
                'total_revenue': agency_summary['total_sales'] or 0,
                'avg_conversion': round(float(agency_summary['avg_conv'] or 0), 2),
                'avg_closure_days': round(float(agency_summary['avg_time'] or 0), 1)
            }
            
            stats['total_listing_value'] = Property.objects.filter(
                state__usage_type='sale',
                is_published=True
            ).aggregate(total=Sum('price'))['total'] or 0

            stats['properties_by_type'] = list(Property.objects.values(
                'property_type__title'
            ).annotate(
                count=Count('id')
            ).order_by('-count'))
            
            stats['properties_by_state'] = list(Property.objects.values(
                'state__title'
            ).annotate(
                count=Count('id')
            ).order_by('-count'))
        else:
            stats['total_properties'] = 0
            stats['total_agencies'] = 0
            stats['total_agents'] = 0
            stats['total_inquiries'] = 0
            stats['new_inquiries'] = 0
        
        return stats
    
    @classmethod
    def _get_communication_stats(cls) -> dict:
        
        from src.email.models.statistics import EmailStatistics
        from src.ticket.models.statistics import TicketStatistics
        from src.email.models.email_message import EmailMessage
        from src.ticket.models.ticket import Ticket
        
        last_7_days_email = EmailStatistics.objects.all()[:7]
        last_7_days_ticket = TicketStatistics.objects.all()[:7]
        
        comm_stats = {
            'email': {
                'total': EmailMessage.objects.count(),
                'new': EmailMessage.objects.filter(status='new').count(),
                'daily_trend': [
                    {'date': s.date.isoformat(), 'received': s.total_received, 'replied': s.total_replied}
                    for s in reversed(last_7_days_email)
                ],
                'sources': EmailStatistics.objects.aggregate(
                    total=Sum('total_received')
                )['total'] or 0 # Example, can be more complex
            },
            'ticket': {
                'total': Ticket.objects.count(),
                'active': Ticket.objects.filter(status__in=['open', 'in_progress']).count(),
                'daily_trend': [
                    {
                        'date': s.date.isoformat(), 
                        'created': s.total_created, 
                        'closed': s.total_closed,
                        'avg_response': s.avg_response_time_minutes
                    }
                    for s in reversed(last_7_days_ticket)
                ],
                'avg_response_time': TicketStatistics.objects.aggregate(
                    avg=Avg('avg_response_time_minutes')
                )['avg'] or 0
            }
        }
        return comm_stats

    @classmethod
    def _get_admin_performance(cls) -> list:
        
        from src.user.models.statistics import AdminPerformanceStatistics
        now = timezone.now()
        
        stats = AdminPerformanceStatistics.objects.filter(
            year=now.year, month=now.month
        ).select_related('admin__admin_user').order_by('-tickets_resolved', '-emails_replied')[:10]
        
        leaderboard = []
        for s in stats:
            leaderboard.append({
                'name': f"{s.admin.first_name} {s.admin.last_name}" if s.admin.first_name else s.admin.admin_user.email,
                'resolved': s.tickets_resolved + s.emails_replied,
                'content_created': s.properties_created + s.blogs_created + s.portfolios_created,
                'avg_response': s.avg_response_time_minutes,
                'logins': s.login_count
            })
        return leaderboard

    @classmethod
    def clear_cache(cls):
        AnalyticsCacheManager.invalidate_dashboard()

