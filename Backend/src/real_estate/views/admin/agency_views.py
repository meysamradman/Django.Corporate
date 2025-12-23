import re
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionValidator

from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.serializers.admin.agency_serializer import (
    RealEstateAgencyAdminListSerializer,
    RealEstateAgencyAdminDetailSerializer,
    RealEstateAgencyAdminCreateSerializer,
    RealEstateAgencyAdminUpdateSerializer,
)
from src.real_estate.services.admin.agency_services import RealEstateAgencyAdminService
from src.real_estate.messages.messages import AGENCY_SUCCESS, AGENCY_ERRORS


class RealEstateAgencyAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'email', 'license_number']
    ordering_fields = ['created_at', 'updated_at', 'rating', 'name']
    ordering = ['-rating', '-is_verified', 'name']
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        if self.action == 'list':
            return RealEstateAgencyAdminService.get_agency_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return RealEstateAgencyAdminService.get_agency_queryset()
        else:
            return RealEstateAgency.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RealEstateAgencyAdminListSerializer
        elif self.action == 'create':
            return RealEstateAgencyAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RealEstateAgencyAdminUpdateSerializer
        else:
            return RealEstateAgencyAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agency.read'):
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        filters = {
            'is_active': self._parse_bool(request.query_params.get('is_active')),
            'is_verified': self._parse_bool(request.query_params.get('is_verified')),
            'city_id': request.query_params.get('city_id'),
            'manager_id': request.query_params.get('manager_id'),
        }
        filters = {k: v for k, v in filters.items() if v is not None}
        search = request.query_params.get('search')
        
        queryset = RealEstateAgencyAdminService.get_agency_queryset(filters=filters, search=search)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_list_success"],
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.agency.create'):
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        agency = RealEstateAgencyAdminService.create_agency(
            serializer.validated_data,
            created_by=request.user
        )
        
        detail_serializer = RealEstateAgencyAdminDetailSerializer(agency)
        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agency.read'):
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        agency = RealEstateAgencyAdminService.get_agency_by_id(kwargs.get('pk'))
        
        if not agency:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(agency)
        return APIResponse.success(
            message=AGENCY_SUCCESS["agency_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agency.update'):
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        partial = kwargs.pop('partial', False)
        agency_id = kwargs.get('pk')
        
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            updated_agency = RealEstateAgencyAdminService.update_agency_by_id(
                agency_id,
                serializer.validated_data
            )
            
            detail_serializer = RealEstateAgencyAdminDetailSerializer(updated_agency)
            return APIResponse.success(
                message=AGENCY_SUCCESS["agency_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except RealEstateAgency.DoesNotExist:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        if not PermissionValidator.has_permission(request.user, 'real_estate.agency.delete'):
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        agency_id = kwargs.get('pk')
        
        try:
            RealEstateAgencyAdminService.delete_agency_by_id(agency_id)
            return APIResponse.success(
                message=AGENCY_SUCCESS["agency_deleted"],
                status_code=status.HTTP_200_OK
            )
        except RealEstateAgency.DoesNotExist:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "properties" in error_msg.lower():
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = AGENCY_ERRORS["agency_has_properties"].format(count=count)
            elif "agents" in error_msg.lower():
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = AGENCY_ERRORS["agency_has_agents"].format(count=count)
            else:
                message = AGENCY_ERRORS["agency_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        agency_ids = request.data.get('ids', [])
        
        if not agency_ids:
            return APIResponse.error(
                message=AGENCY_ERRORS.get("agency_not_found", "Agency IDs required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(agency_ids, list):
            agency_ids = [agency_ids]
        
        try:
            deleted_count = RealEstateAgencyAdminService.bulk_delete_agencies(agency_ids)
            return APIResponse.success(
                message=AGENCY_SUCCESS.get("agency_deleted", "Agencies deleted successfully"),
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            error_msg = str(e)
            if "properties" in error_msg.lower():
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = AGENCY_ERRORS["agency_has_properties"].format(count=count)
            elif "agents" in error_msg.lower():
                count_match = re.search(r'\d+', error_msg)
                count = count_match.group() if count_match else "0"
                message = AGENCY_ERRORS["agency_has_agents"].format(count=count)
            else:
                message = AGENCY_ERRORS["agency_delete_failed"]
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )

