from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from src.core.responses.response import APIResponse
from src.ticket.models.ticket import Ticket
from src.ticket.serializers.ticket_serializer import TicketSerializer, TicketListSerializer, TicketDetailSerializer
from src.ticket.messages.messages import TICKET_SUCCESS, TICKET_ERRORS
from src.user.permissions import PermissionValidator


class AdminTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TicketSerializer
    
    def get_queryset(self):
        queryset = Ticket.objects.select_related('user', 'assigned_admin').prefetch_related(
            'messages', 'messages__attachments'
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
        # ✅ Support both ticket.manage and ticket.read
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.read']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        # ✅ Support both ticket.manage and ticket.read
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.read']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        # ✅ Support both ticket.manage and ticket.create
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.create']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        response = super().create(request, *args, **kwargs)
        cache.delete('ticket:stats')
        if response.status_code == status.HTTP_201_CREATED:
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_created'],
                data=response.data,
                status_code=status.HTTP_201_CREATED
            )
        return response
    
    def update(self, request, *args, **kwargs):
        # ✅ Support both ticket.manage and ticket.update
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.update']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        response = super().update(request, *args, **kwargs)
        cache.delete('ticket:stats')
        if response.status_code == status.HTTP_200_OK:
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_updated'],
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
        instance = self.get_object()
        super().destroy(request, *args, **kwargs)
        cache.delete('ticket:stats')
        return APIResponse.success(
            message=TICKET_SUCCESS['ticket_deleted'],
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        # ✅ Support both ticket.manage and ticket.update (assigning is an update operation)
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.update']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        ticket = self.get_object()
        admin_id = request.data.get('admin_id')
        
        if admin_id:
            from src.user.models.admin_profile import AdminProfile
            try:
                admin = AdminProfile.objects.get(id=admin_id)
                ticket.assigned_admin = admin
                ticket.save()
                cache.delete(f'ticket:{ticket.id}')
                cache.delete('ticket:stats')
                return APIResponse.success(
                    message=TICKET_SUCCESS['ticket_assigned'],
                    data=TicketDetailSerializer(ticket).data
                )
            except AdminProfile.DoesNotExist:
                return APIResponse.error(
                    message=TICKET_ERRORS['ticket_not_found'],
                    status_code=status.HTTP_404_NOT_FOUND
                )
        else:
            ticket.assigned_admin = None
            ticket.save()
            cache.delete(f'ticket:{ticket.id}')
            cache.delete('ticket:stats')
            return APIResponse.success(
                message=TICKET_SUCCESS['ticket_assigned'],
                data=TicketDetailSerializer(ticket).data
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        # ✅ Support both ticket.manage and ticket.update (status change is an update operation)
        if not PermissionValidator.has_any_permission(request.user, ['ticket.manage', 'ticket.update']):
            return APIResponse.error(
                message=TICKET_ERRORS['permission_denied'],
                status_code=status.HTTP_403_FORBIDDEN
            )
        ticket = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['open', 'in_progress', 'resolved', 'closed']:
            return APIResponse.error(
                message=TICKET_ERRORS['invalid_status'],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.status = new_status
        ticket.save()
        cache.delete(f'ticket:{ticket.id}')
        cache.delete('ticket:stats')
        return APIResponse.success(
            message=TICKET_SUCCESS['ticket_status_updated'],
            data=TicketDetailSerializer(ticket).data
        )

