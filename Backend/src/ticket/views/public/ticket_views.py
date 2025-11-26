from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from django.core.cache import cache
from src.core.responses.response import APIResponse
from src.ticket.models.ticket import Ticket
from src.ticket.serializers.ticket_serializer import TicketDetailSerializer
from src.ticket.serializers.ticket_message_serializer import TicketMessageSerializer, TicketMessageCreateSerializer
from src.ticket.messages.messages import TICKET_SUCCESS, TICKET_ERRORS


class PublicTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = TicketDetailSerializer
    
    def get_queryset(self):
        return Ticket.objects.none()
    
    def create(self, request, *args, **kwargs):
        from src.ticket.serializers.ticket_serializer import TicketSerializer
        serializer = TicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = None
        if request.user and request.user.is_authenticated:
            user = request.user
        
        ticket = serializer.save(user=user, status='open')
        cache.delete('ticket:stats')
        
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
            ).get(public_id=token)
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
            ticket = Ticket.objects.get(public_id=pk)
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
        
        cache.delete(f'ticket:{ticket.id}')
        cache.delete(f'ticket:{ticket.id}:messages')
        cache.delete('ticket:stats')
        
        return APIResponse.success(
            message=TICKET_SUCCESS['message_sent'],
            data=TicketMessageSerializer(message).data,
            status_code=status.HTTP_201_CREATED
        )

