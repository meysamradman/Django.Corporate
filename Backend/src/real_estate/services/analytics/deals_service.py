from django.utils import timezone
from django.db import models
from django.db.models import F, Avg
from src.real_estate.models.statistics import AgentStatistics, AgencyStatistics

class DealsService:
    @classmethod
    def process_deal_closure(cls, property_obj):
        
        property_obj.closed_at = timezone.now()
        property_obj.is_published = False
        property_obj.save(update_fields=['closed_at', 'is_published'])
        
        listing_time = 0
        if property_obj.published_at:
            delta = property_obj.closed_at - property_obj.published_at
            listing_time = max(delta.days, 1)
            
        cls._update_agent_kpis(property_obj, listing_time)
        cls._update_agency_kpis(property_obj, listing_time)

    @classmethod
    def _update_agent_kpis(cls, property_obj, listing_time):
        if not property_obj.agent:
            return
            
        now = timezone.now()
        stats, _ = AgentStatistics.objects.get_or_create(
            agent=property_obj.agent,
            year=now.year,
            month=now.month
        )
        
        is_sale = property_obj.state.slug == 'sale' if property_obj.state else True
        if is_sale:
            stats.properties_sold = F('properties_sold') + 1
            if property_obj.price:
                stats.total_sales_value = F('total_sales_value') + property_obj.price
        else:
            stats.properties_rented = F('properties_rented') + 1
            
        stats.save()
        stats.refresh_from_db()
        
        all_agent_listings = property_obj.agent.properties.all()
        total_listed = all_agent_listings.count()
        total_closed = all_agent_listings.filter(closed_at__isnull=False).count()
        total_inquiries = property_obj.agent.properties.aggregate(total=models.Sum('inquiries_count'))['total'] or 0
        
        if total_listed > 0:
            stats.conversion_rate = (total_closed / total_listed) * 100
            
        if total_closed > 0:
            avg_time = all_agent_listings.filter(closed_at__isnull=False).aggregate(
                avg=Avg(F('closed_at') - F('published_at'))
            )['avg']
            if avg_time:
                stats.avg_deal_time = avg_time.days
                
        stats.save()

    @classmethod
    def _update_agency_kpis(cls, property_obj, listing_time):
        if not property_obj.agency:
            return
            
        now = timezone.now()
        stats, _ = AgencyStatistics.objects.get_or_create(
            agency=property_obj.agency,
            year=now.year,
            month=now.month
        )
        
        is_sale = property_obj.state.slug == 'sale' if property_obj.state else True
        if is_sale:
            stats.properties_sold = F('properties_sold') + 1
            if property_obj.price:
                stats.total_sales_value = F('total_sales_value') + property_obj.price
        else:
            stats.properties_rented = F('properties_rented') + 1
            
        stats.save()
