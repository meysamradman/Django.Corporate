from django.db import transaction
from django.db.models import Count, Q, Exists, OuterRef, Prefetch
from rest_framework.exceptions import ValidationError
from src.ticket.models.ticket import Ticket
from src.ticket.models.ticket_message import TicketMessage
from src.ticket.utils.cache import TicketCacheManager
from src.analytics.utils.cache import AnalyticsCacheManager
from src.ticket.messages.messages import TICKET_ERRORS

class TicketAdminService:
    
    @staticmethod
    def get_queryset(request):
        queryset = Ticket.objects.select_related(
            'user', 
            'assigned_admin'
        ).prefetch_related(
            'messages', 
            'messages__attachments'
        ).annotate(
            messages_count=Count('messages', distinct=True),
            unread_messages_count=Count(
                'messages',
                filter=Q(messages__is_read=False, messages__sender_type='user'),
                distinct=True
            )
        )
        
        status_filter = request.query_params.get('status')
        priority_filter = request.query_params.get('priority')
        assigned_to_me = request.query_params.get('assigned_to_me', '').lower() == 'true'
        unassigned = request.query_params.get('unassigned', '').lower() == 'true'
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if assigned_to_me:
            if hasattr(request.user, 'admin_profile'):
                queryset = queryset.filter(assigned_admin=request.user.admin_profile)
        if unassigned:
            queryset = queryset.filter(assigned_admin__isnull=True)
            
        return queryset.order_by('-created_at')

    @staticmethod
    def mark_as_read(ticket):
        with transaction.atomic():
            unread_messages = TicketMessage.objects.filter(
                ticket=ticket,
                sender_type='user',
                is_read=False
            )
            
            if unread_messages.exists():
                unread_messages.update(is_read=True)
                TicketCacheManager.invalidate_ticket(ticket.id)
                AnalyticsCacheManager.invalidate_tickets()
        
        return ticket

    @staticmethod
    def update_status(ticket, new_status):
        valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
        if new_status not in valid_statuses:
            raise ValidationError(TICKET_ERRORS['invalid_status'])
            
        with transaction.atomic():
            ticket.status = new_status
            ticket.save(update_fields=['status', 'updated_at'])
            
            TicketCacheManager.invalidate_ticket(ticket.id)
            AnalyticsCacheManager.invalidate_tickets()
            
        return ticket

    @staticmethod
    def get_stats(user):
        has_unread = TicketMessage.objects.filter(
            ticket=OuterRef('pk'),
            sender_type='user',
            is_read=False
        )
        
        tickets_with_unread = Ticket.objects.annotate(
            has_unread_messages=Exists(has_unread)
        ).filter(has_unread_messages=True)
        
        new_tickets_count = tickets_with_unread.filter(
            status='open',
            assigned_admin__isnull=True
        ).count()
        
        assigned_to_me_count = 0
        if hasattr(user, 'admin_profile'):
            assigned_to_me_count = tickets_with_unread.filter(
                assigned_admin=user.admin_profile,
                status__in=['open', 'in_progress']
            ).count()
        
        recent_tickets = tickets_with_unread.filter(
            status__in=['open', 'in_progress']
        ).select_related('user').order_by('-created_at')[:5]
        
        recent_tickets_data = []
        for ticket in recent_tickets:
            recent_tickets_data.append({
                'id': ticket.id,
                'public_id': str(ticket.public_id),
                'subject': ticket.subject,
                'status': ticket.status,
                'priority': ticket.priority,
                'created_at': ticket.created_at.isoformat(),
            })
            
        return {
            'new_tickets_count': new_tickets_count,
            'assigned_to_me_count': assigned_to_me_count,
            'total_new': new_tickets_count + assigned_to_me_count,
            'recent_tickets': recent_tickets_data,
        }

    @staticmethod
    def delete_ticket(ticket):
        with transaction.atomic():
            ticket_id = ticket.id
            ticket.delete()
            TicketCacheManager.invalidate_ticket(ticket_id)
            AnalyticsCacheManager.invalidate_tickets()
