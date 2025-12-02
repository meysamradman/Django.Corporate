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
    """
    Ticket management for authenticated users only.
    Users can only see and manage their own tickets.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TicketDetailSerializer
    
    def get_queryset(self):
        # Users can only see their own tickets
        if self.request.user and self.request.user.is_authenticated:
            return Ticket.objects.filter(user=self.request.user).select_related(
                'user', 'assigned_admin'
            ).prefetch_related(
                'messages', 'messages__attachments'
            ).order_by('-created_at')
        return Ticket.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Check rate limiting: max 1 ticket per hour
        recent_ticket = Ticket.objects.filter(
            user=request.user,
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).exists()
        
        if recent_ticket:
            return APIResponse.error(
                message="لطفاً یک ساعت صبر کنید قبل از ایجاد تیکت جدید.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Check max open tickets: limit to 5 open tickets
        open_tickets_count = Ticket.objects.filter(
            user=request.user,
            status__in=['open', 'in_progress']
        ).count()
        
        if open_tickets_count >= 5:
            return APIResponse.error(
                message="شما حداکثر 5 تیکت باز دارید. لطفاً منتظر پاسخ به تیکت‌های قبلی باشید.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        from src.ticket.serializers.ticket_serializer import TicketSerializer
        serializer = TicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Always use authenticated user
        ticket = serializer.save(user=request.user, status='open')
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
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
        """
        Get ticket by public_id token.
        Users can only access their own tickets.
        """
        try:
            ticket = Ticket.objects.select_related('user', 'assigned_admin').prefetch_related(
                'messages', 'messages__attachments',
                'messages__sender_user', 'messages__sender_admin'
            ).get(public_id=token, user=request.user)  # Only user's own tickets
            
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
        """
        Reply to a ticket.
        Users can only reply to their own tickets.
        """
        try:
            ticket = Ticket.objects.get(public_id=pk, user=request.user)  # Only user's own tickets
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
        
        # ✅ Use Cache Manager for standardized cache invalidation (Redis)
        TicketCacheManager.invalidate_ticket(ticket.id)
        StatisticsCacheManager.invalidate_tickets()
        
        return APIResponse.success(
            message=TICKET_SUCCESS['message_sent'],
            data=TicketMessageSerializer(message).data,
            status_code=status.HTTP_201_CREATED
        )

