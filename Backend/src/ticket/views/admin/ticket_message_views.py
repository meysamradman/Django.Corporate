from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from src.core.responses.response import APIResponse
from src.ticket.models.ticket_message import TicketMessage
from src.ticket.serializers.ticket_message_serializer import TicketMessageSerializer, TicketMessageCreateSerializer
from src.ticket.messages.messages import TICKET_SUCCESS, TICKET_ERRORS
from src.ticket.utils.cache import TicketCacheManager
from src.statistics.utils.cache import StatisticsCacheManager
from src.user.permissions import PermissionValidator


class AdminTicketMessageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketMessageSerializer
    
    def get_queryset(self):
        ticket_id = self.request.query_params.get('ticket_id')
        queryset = TicketMessage.objects.select_related(
            'ticket', 'ticket__user', 'ticket__assigned_admin',
            'sender_user', 'sender_admin'
        ).prefetch_related('attachments').all()
        
        if ticket_id:
            queryset = queryset.filter(ticket_id=ticket_id)
        
        return queryset.order_by('created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TicketMessageCreateSerializer
        return TicketMessageSerializer
    
    def create(self, request, *args, **kwargs):
        # Replying to tickets requires ticket.manage or ticket.update permission
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.update']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        ticket = serializer.validated_data.get('ticket')
        if ticket.status == 'closed':
            return APIResponse.error(
                message=TICKET_ERRORS['ticket_closed'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        message = serializer.save()
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        TicketCacheManager.invalidate_ticket(ticket.id)
        StatisticsCacheManager.invalidate_tickets()
        
        return APIResponse.success(
            message=TICKET_SUCCESS['message_sent'],
            data=TicketMessageSerializer(message).data,
            status_code=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        # ✅ Support both ticket.manage and ticket.update
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.update']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            message = self.get_object()
            # ✅ Use Cache Manager for standardized cache invalidation (Redis)
            TicketCacheManager.invalidate_ticket_messages(message.ticket.id)
            return APIResponse.success(
                message=TICKET_SUCCESS['message_updated'],
                data=response.data,
                status_code=status.HTTP_200_OK
            )
        return response
    
    def destroy(self, request, *args, **kwargs):
        # ✅ Support both ticket.manage and ticket.delete
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.delete']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        message = self.get_object()
        ticket_id = message.ticket.id
        super().destroy(request, *args, **kwargs)
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        TicketCacheManager.invalidate_ticket(ticket_id)
        StatisticsCacheManager.invalidate_tickets()
        return APIResponse.success(
            message=TICKET_SUCCESS['message_deleted'],
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        # ✅ Support both ticket.manage and ticket.update (marking as read is an update)
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.update']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        message = self.get_object()
        message.is_read = True
        message.save()
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        TicketCacheManager.invalidate_ticket_messages(message.ticket.id)
        return APIResponse.success(
            message=TICKET_SUCCESS['message_updated'],
            data=TicketMessageSerializer(message).data
        )

