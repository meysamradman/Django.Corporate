from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from src.core.responses.response import APIResponse
from src.ticket.models.ticket import Ticket
from src.ticket.serializers.ticket_serializer import TicketDetailSerializer
from src.ticket.serializers.ticket_message_serializer import TicketMessageSerializer, TicketMessageCreateSerializer
from src.ticket.messages.messages import TICKET_SUCCESS, TICKET_ERRORS
from src.ticket.utils.cache import TicketCacheManager
from src.statistics.utils.cache import StatisticsCacheManager


class PublicTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketDetailSerializer
    
    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated:
            return Ticket.objects.filter(user=self.request.user).select_related(
                'user', 'assigned_admin'
            ).prefetch_related(
                'messages', 'messages__attachments'
            ).order_by('-created_at')
        return Ticket.objects.none()
    
    def create(self, request, *args, **kwargs):
        recent_ticket = Ticket.objects.filter(
            user=request.user,
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).exists()
        
        if recent_ticket:
            return APIResponse.error(
                message=TICKET_ERRORS['too_many_recent_tickets'],
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        open_tickets_count = Ticket.objects.filter(
            user=request.user,
            status__in=['open', 'in_progress']
        ).count()
        
        if open_tickets_count >= 5:
            return APIResponse.error(
                message=TICKET_ERRORS['max_open_tickets_reached'],
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        from src.ticket.serializers.ticket_serializer import TicketSerializer
        serializer = TicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        ticket = serializer.save(user=request.user, status='open')
        StatisticsCacheManager.invalidate_tickets()
        
        message_data = request.data.get('message')
        attachment_ids = request.data.get('attachment_ids', [])
        
        if message_data:
            message_serializer = TicketMessageCreateSerializer(
                data={
                    'ticket': ticket.id,
                    'message': message_data,
                    'sender_type': 'user',
                    'attachment_ids': attachment_ids,
                },
                context={'request': request}
            )
            if message_serializer.is_valid():
                message_serializer.save()
        
        return APIResponse.success(
            message=TICKET_SUCCESS['ticket_created'],
            data=TicketDetailSerializer(ticket).data,
            status_code=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'], url_path='by-token/(?P<token>[^/.]+)')
    def by_token(self, request, token=None):
        try:
            ticket = Ticket.objects.select_related('user', 'assigned_admin').prefetch_related(
                'messages', 'messages__attachments',
                'messages__sender_user', 'messages__sender_admin'
            ).get(public_id=token, user=request.user)
            
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_retrieved'],
                data=TicketDetailSerializer(ticket).data
            )
        except Ticket.DoesNotExist:
            return APIResponse.error(
                message=TICKET_ERRORS['ticket_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        try:
            ticket = Ticket.objects.get(public_id=pk, user=request.user)
        except Ticket.DoesNotExist:
            return APIResponse.error(
                message=TICKET_ERRORS['ticket_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        if ticket.status == 'closed':
            return APIResponse.error(
                message=TICKET_ERRORS['ticket_closed'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        message_serializer = TicketMessageCreateSerializer(
            data={
                'ticket': ticket.id,
                'message': request.data.get('message'),
                'sender_type': 'user',
                'attachment_ids': request.data.get('attachment_ids', []),
            },
            context={'request': request}
        )
        message_serializer.is_valid(raise_exception=True)
        message = message_serializer.save()
        
        TicketCacheManager.invalidate_ticket(ticket.id)
        StatisticsCacheManager.invalidate_tickets()
        
        return APIResponse.success(
            message=TICKET_SUCCESS['message_sent'],
            data=TicketMessageSerializer(message).data,
            status_code=status.HTTP_201_CREATED
        )

