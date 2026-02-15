from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.db.models import Exists, OuterRef
from src.core.responses.response import APIResponse
from src.ticket.models.ticket import Ticket
from src.ticket.models.ticket_message import TicketMessage
from src.ticket.serializers.ticket_serializer import TicketSerializer, TicketListSerializer, TicketDetailSerializer
from src.ticket.messages.messages import TICKET_SUCCESS, TICKET_ERRORS
from src.ticket.utils.cache import TicketCacheManager
from src.analytics.utils.cache import AnalyticsCacheManager
from src.user.access_control import ticket_permission, PermissionRequiredMixin
from src.core.utils.validation_helpers import extract_validation_message
from src.core.utils.validation_helpers import normalize_validation_error

class AdminTicketViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [ticket_permission]
    
    permission_map = {
        'list': ['ticket.manage', 'ticket.read'],  # Check if user has ticket.manage OR ticket.read
        'retrieve': ['ticket.manage', 'ticket.read'],
        'update': ['ticket.manage', 'ticket.update'],
        'destroy': ['ticket.manage', 'ticket.delete'],
        'mark_as_read': ['ticket.manage', 'ticket.read'],
        'update_status': ['ticket.manage', 'ticket.update'],
        'stats': ['ticket.manage', 'ticket.read'],
    }
    permission_denied_message = TICKET_ERRORS['permission_denied']
    serializer_class = TicketSerializer
    
    def get_queryset(self):
        from src.ticket.services.admin.ticket_service import TicketAdminService
        return TicketAdminService.get_queryset(self.request)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        elif self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketSerializer
    
    def create(self, request, *args, **kwargs):
        return APIResponse.error(
            message=TICKET_ERRORS["admin_cannot_create"],
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    def update(self, request, *args, **kwargs):
        
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            ticket = self.get_object()
            TicketCacheManager.invalidate_ticket(ticket.id)
            AnalyticsCacheManager.invalidate_tickets()
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_updated'],
                data=response.data,
                status_code=status.HTTP_200_OK
            )
        return response
    
    def destroy(self, request, *args, **kwargs):
        from src.ticket.services.admin.ticket_service import TicketAdminService
        try:
            ticket = self.get_object()
            TicketAdminService.delete_ticket(ticket)
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_deleted'],
                status_code=status.HTTP_200_OK
            )
        except Exception:
            return APIResponse.error(
                message=TICKET_ERRORS['error_occurred'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        from src.ticket.services.admin.ticket_service import TicketAdminService
        try:
            ticket = self.get_object()
            TicketAdminService.mark_as_read(ticket)
            serializer = TicketDetailSerializer(ticket)
            return APIResponse.success(
                message=TICKET_SUCCESS['messages_marked_as_read'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=TICKET_ERRORS['mark_read_failed'].format(error=extract_validation_message(e, TICKET_ERRORS['error_occurred'])),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        from src.ticket.services.admin.ticket_service import TicketAdminService
        try:
            ticket = self.get_object()
            new_status = request.data.get('status')
            
            if not new_status:
                return APIResponse.error(
                    message=TICKET_ERRORS['status_required'],
                    errors={'status': [TICKET_ERRORS['status_required']]},
                    status_code=status.HTTP_400_BAD_REQUEST
                )

            TicketAdminService.update_status(ticket, new_status)
            serializer = TicketDetailSerializer(ticket)
            
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_updated'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
             return APIResponse.error(
                message=extract_validation_message(e, TICKET_ERRORS['error_occurred']),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=TICKET_ERRORS['update_status_failed'].format(error=extract_validation_message(e, TICKET_ERRORS['error_occurred'])),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from src.ticket.services.admin.ticket_service import TicketAdminService
        try:
            stats = TicketAdminService.get_stats(request.user)
            return APIResponse.success(
                message=TICKET_SUCCESS["statistics_retrieved"],
                data=stats,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=TICKET_ERRORS["statistics_retrieve_failed"].format(error=extract_validation_message(e, TICKET_ERRORS['error_occurred'])),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
