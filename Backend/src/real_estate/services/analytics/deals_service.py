from datetime import datetime, time

from django.utils import timezone
from django.db import models
from django.db.models import F, Avg
from src.real_estate.models.statistics import AgentStatistics, AgencyStatistics

class DealsService:
    @classmethod
    def process_deal_closure(
        cls,
        property_obj,
        *,
        deal_type=None,
        closed_status=None,
        contract_date=None,
        final_amount=None,
        sale_price=None,
        pre_sale_price=None,
        monthly_rent=None,
        rent_amount=None,
        security_deposit=None,
        mortgage_amount=None,
        commission=None,
        responsible_agent=None,
    ):
        
        if contract_date:
            closed_dt = datetime.combine(contract_date, time(hour=12, minute=0, second=0))
            if timezone.is_naive(closed_dt):
                closed_dt = timezone.make_aware(closed_dt, timezone.get_current_timezone())
            property_obj.closed_at = closed_dt
        else:
            property_obj.closed_at = timezone.now()

        if closed_status in ('sold', 'rented'):
            property_obj.status = closed_status

        if responsible_agent is not None:
            property_obj.agent = responsible_agent

        property_obj.is_published = False
        update_fields = ['closed_at', 'is_published']
        if closed_status in ('sold', 'rented'):
            update_fields.append('status')
        if responsible_agent is not None:
            update_fields.append('agent')

        resolved_type = deal_type or ('rent' if property_obj.status == 'rented' else 'sale')
        effective_final_amount = final_amount

        if resolved_type == 'rent':
            resolved_monthly_rent = monthly_rent if monthly_rent is not None else final_amount
            if resolved_monthly_rent is not None:
                property_obj.monthly_rent = resolved_monthly_rent
                update_fields.append('monthly_rent')

            if rent_amount is not None:
                property_obj.rent_amount = rent_amount
                update_fields.append('rent_amount')

            if security_deposit is not None:
                property_obj.security_deposit = security_deposit
                update_fields.append('security_deposit')

            if mortgage_amount is not None:
                property_obj.mortgage_amount = mortgage_amount
                update_fields.append('mortgage_amount')

            effective_final_amount = resolved_monthly_rent
        elif resolved_type == 'presale':
            resolved_pre_sale_price = pre_sale_price if pre_sale_price is not None else final_amount
            if resolved_pre_sale_price is not None:
                property_obj.pre_sale_price = resolved_pre_sale_price
                property_obj.price = resolved_pre_sale_price
                update_fields.extend(['pre_sale_price', 'price'])
                effective_final_amount = resolved_pre_sale_price
        else:
            resolved_sale_price = sale_price if sale_price is not None else final_amount
            if resolved_sale_price is not None:
                property_obj.sale_price = resolved_sale_price
                property_obj.price = resolved_sale_price
                update_fields.extend(['sale_price', 'price'])
                effective_final_amount = resolved_sale_price

            if resolved_type == 'mortgage' and mortgage_amount is not None:
                property_obj.mortgage_amount = mortgage_amount
                update_fields.append('mortgage_amount')

        property_obj.save(update_fields=update_fields)
        
        listing_time = 0
        if property_obj.published_at:
            delta = property_obj.closed_at - property_obj.published_at
            listing_time = max(delta.days, 1)
            
        cls._update_agent_kpis(property_obj, listing_time, final_amount=effective_final_amount, commission=commission)
        cls._update_agency_kpis(property_obj, listing_time, final_amount=effective_final_amount, commission=commission)

    @classmethod
    def _update_agent_kpis(cls, property_obj, listing_time, final_amount=None, commission=None):
        if not property_obj.agent:
            return
            
        now = timezone.now()
        stats, _ = AgentStatistics.objects.get_or_create(
            agent=property_obj.agent,
            year=now.year,
            month=now.month
        )
        
        is_sale = property_obj.status == 'sold'
        if is_sale:
            stats.properties_sold = F('properties_sold') + 1
            effective_final_amount = final_amount if final_amount is not None else (property_obj.sale_price or property_obj.price)
            if effective_final_amount:
                stats.total_sales_value = F('total_sales_value') + effective_final_amount
        else:
            stats.properties_rented = F('properties_rented') + 1

        if commission is not None:
            stats.total_commissions = F('total_commissions') + commission
            
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
    def _update_agency_kpis(cls, property_obj, listing_time, final_amount=None, commission=None):
        if not property_obj.agency:
            return
            
        now = timezone.now()
        stats, _ = AgencyStatistics.objects.get_or_create(
            agency=property_obj.agency,
            year=now.year,
            month=now.month
        )
        
        is_sale = property_obj.status == 'sold'
        if is_sale:
            stats.properties_sold = F('properties_sold') + 1
            effective_final_amount = final_amount if final_amount is not None else (property_obj.sale_price or property_obj.price)
            if effective_final_amount:
                stats.total_sales_value = F('total_sales_value') + effective_final_amount
        else:
            stats.properties_rented = F('properties_rented') + 1

        if commission is not None:
            stats.total_commissions = F('total_commissions') + commission
            
        stats.save()
