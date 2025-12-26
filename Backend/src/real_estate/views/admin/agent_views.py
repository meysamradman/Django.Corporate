import re
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionValidator

from src.real_estate.models.agent import PropertyAgent
from src.real_estate.serializers.admin.agent_serializer import (
    PropertyAgentAdminListSerializer,
    PropertyAgentAdminDetailSerializer,
    PropertyAgentAdminCreateSerializer,
    PropertyAgentAdminUpdateSerializer,
)
from src.real_estate.services.admin.agent_services import PropertyAgentAdminService
from src.real_estate.messages.messages import AGENT_SUCCESS, AGENT_ERRORS


class PropertyAgentAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__mobile', 'user__email', 'user__admin_profile__first_name', 'user__admin_profile__last_name', 'license_number']
    ordering_fields = ['created_at', 'updated_at', 'rating', 'total_sales', 'user__admin_profile__last_name']
    ordering = ['-rating', '-total_sales', 'user__admin_profile__last_name']
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        if self.action == 'list':
            return PropertyAgentAdminService.get_agent_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PropertyAgentAdminService.get_agent_queryset()
        else:
            return PropertyAgent.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyAgentAdminListSerializer
        elif self.action == 'create':
            return PropertyAgentAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyAgentAdminUpdateSerializer
        else:
            return PropertyAgentAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agent.read'):
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
            'is_verified': self._parse_bool(request.query_params.get('is_verified')),
            'agency_id': request.query_params.get('agency_id'),
            'city_id': request.query_params.get('city_id'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = PropertyAgentAdminService.get_agent_queryset(filters=filters, search=search)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=AGENT_SUCCESS["agent_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')
    
    def create(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agent.create'):
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            agent = PropertyAgentAdminService.create_agent(
                serializer.validated_data,
                created_by=request.user
            )
            
            detail_serializer = PropertyAgentAdminDetailSerializer(agent)
            return APIResponse.success(
                message=AGENT_SUCCESS["agent_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            error_msg = str(e)
            if "already has" in error_msg.lower():
                message = AGENT_ERRORS["user_already_has_agent"]
            else:
                message = AGENT_ERRORS["agent_create_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agent.read'):
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        agent = PropertyAgentAdminService.get_agent_by_id(kwargs.get('pk'))
        
        if not agent:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(agent)
        return APIResponse.success(
            message=AGENT_SUCCESS["agent_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agent.update'):
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        partial = kwargs.pop('partial', False)
        agent_id = kwargs.get('pk')

        # fetch the instance and pass it to the serializer so instance-aware
        # validators (like excluding current object when checking uniqueness)
        # work correctly.
        agent = PropertyAgentAdminService.get_agent_by_id(agent_id)
        if not agent:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        # make a mutable copy of incoming data
        data = request.data.copy()

        serializer = self.get_serializer(agent, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            updated_agent = PropertyAgentAdminService.update_agent_by_id(
                agent_id,
                serializer.validated_data
            )

            detail_serializer = PropertyAgentAdminDetailSerializer(updated_agent)
            return APIResponse.success(
                message=AGENT_SUCCESS["agent_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except PropertyAgent.DoesNotExist:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agent.delete'):
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        agent_id = kwargs.get('pk')
        
        try:
            PropertyAgentAdminService.delete_agent_by_id(agent_id)
            return APIResponse.success(
                message=AGENT_SUCCESS["agent_deleted"],
                status_code=status.HTTP_200_OK
            )
        except PropertyAgent.DoesNotExist:
            return APIResponse.error(
                message=AGENT_ERRORS["agent_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "properties" in error_msg.lower():
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = AGENT_ERRORS["agent_has_properties"].format(count=count)
            else:
                message = AGENT_ERRORS["agent_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        agent_ids = request.data.get('ids', [])
        
        if not agent_ids:
            return APIResponse.error(
                message=AGENT_ERRORS.get("agent_not_found", "Agent IDs required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(agent_ids, list):
            agent_ids = [agent_ids]
        
        try:
            deleted_count = PropertyAgentAdminService.bulk_delete_agents(agent_ids)
            return APIResponse.success(
                message=AGENT_SUCCESS.get("agent_deleted", "Agents deleted successfully"),
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "properties" in error_msg.lower():
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = AGENT_ERRORS["agent_has_properties"].format(count=count)
            else:
                message = AGENT_ERRORS["agent_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

