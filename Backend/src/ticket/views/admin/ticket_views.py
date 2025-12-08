from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Exists, OuterRef
from src.core.responses.response import APIResponse
from src.ticket.models.ticket import Ticket
from src.ticket.models.ticket_message import TicketMessage
from src.ticket.serializers.ticket_serializer import TicketSerializer, TicketListSerializer, TicketDetailSerializer
from src.ticket.messages.messages import TICKET_SUCCESS, TICKET_ERRORS
from src.ticket.utils.cache import TicketCacheManager
from src.statistics.utils.cache import StatisticsCacheManager
from src.user.access_control import PermissionValidator


class AdminTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketSerializer
    
    def get_queryset(self):
        from django.db.models import Count, Q
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
        ).all()
        
        status_filter = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        assigned_to_me = self.request.query_params.get('assigned_to_me', '').lower() == 'true'
        unassigned = self.request.query_params.get('unassigned', '').lower() == 'true'
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if assigned_to_me:
            if hasattr(self.request.user, 'admin_profile'):
                queryset = queryset.filter(assigned_admin=self.request.user.admin_profile)
        if unassigned:
            queryset = queryset.filter(assigned_admin__isnull=True)
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        elif self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketSerializer
    
    def list(self, request, *args, **kwargs):
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.read']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.read']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        return APIResponse.error(
            message=TICKET_ERRORS["admin_cannot_create"],
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    def update(self, request, *args, **kwargs):
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.update']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        response = super().update(request, *args, **kwargs)
        ticket = self.get_object()
        TicketCacheManager.invalidate_ticket(ticket.id)
        StatisticsCacheManager.invalidate_tickets()
        if response.status_code == status.HTTP_200_OK:
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_updated'],
                data=response.data,
                status_code=status.HTTP_200_OK
            )
        return response
    
    def destroy(self, request, *args, **kwargs):
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.delete']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        ticket_id = self.get_object().id
        response = super().destroy(request, *args, **kwargs)
        TicketCacheManager.invalidate_ticket(ticket_id)
        StatisticsCacheManager.invalidate_tickets()
        if response.status_code == status.HTTP_204_NO_CONTENT:
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_deleted'],
                status_code=status.HTTP_200_OK
            )
        return response
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.read']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            ticket = self.get_object()
            
            unread_messages = TicketMessage.objects.filter(
                ticket=ticket,
                sender_type='user',
                is_read=False
            )
            
            count = unread_messages.count()
            unread_messages.update(is_read=True)
            
            TicketCacheManager.invalidate_ticket(ticket.id)
            StatisticsCacheManager.invalidate_tickets()
            
            serializer = TicketDetailSerializer(ticket)
            
            return APIResponse.success(
                message=TICKET_SUCCESS['messages_marked_as_read'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=TICKET_ERRORS['mark_read_failed'].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.update']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            ticket = self.get_object()
            new_status = request.data.get('status')
            
            if not new_status:
                return APIResponse.error(
                    message=TICKET_ERRORS['status_required'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            valid_statuses = ['open', 'in_progress', 'resolved', 'closed']
            if new_status not in valid_statuses:
                return APIResponse.error(
                    message=TICKET_ERRORS['invalid_status'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            ticket.status = new_status
            ticket.save(update_fields=['status', 'updated_at'])
            
            TicketCacheManager.invalidate_ticket(ticket.id)
            StatisticsCacheManager.invalidate_tickets()
            
            serializer = TicketDetailSerializer(ticket)
            
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_updated'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=TICKET_ERRORS['update_status_failed'].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.read']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
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
            if hasattr(request.user, 'admin_profile'):
                assigned_to_me_count = tickets_with_unread.filter(
                    assigned_admin=request.user.admin_profile,
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
            
            stats = {
                'new_tickets_count': new_tickets_count,
                'assigned_to_me_count': assigned_to_me_count,
                'total_new': new_tickets_count + assigned_to_me_count,
                'recent_tickets': recent_tickets_data,
            }
            
            return APIResponse.success(
                message=TICKET_SUCCESS["statistics_retrieved"],
                data=stats,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=TICKET_ERRORS["statistics_retrieve_failed"].format(error=str(e)),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
