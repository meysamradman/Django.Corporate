from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError as DjangoValidationError

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin

from src.real_estate.models.agency import RealEstateAgency
from src.real_estate.filters.admin.agency_filters import RealEstateAgencyAdminFilter
from src.real_estate.serializers.admin.agency_serializer import (
    RealEstateAgencyAdminListSerializer,
    RealEstateAgencyAdminDetailSerializer,
    RealEstateAgencyAdminCreateSerializer,
    RealEstateAgencyAdminUpdateSerializer,
)
from src.real_estate.services.admin.agency_services import RealEstateAgencyAdminService
from src.real_estate.messages.messages import AGENCY_SUCCESS, AGENCY_ERRORS
from src.core.utils.validation_helpers import normalize_validation_error

class RealEstateAgencyAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    
    permission_map = {
        'list': 'real_estate.agency.read',
        'retrieve': 'real_estate.agency.read',
        'create': 'real_estate.agency.create',
        'update': 'real_estate.agency.update',
        'partial_update': 'real_estate.agency.update',
        'destroy': 'real_estate.agency.delete',
        'bulk_delete': 'real_estate.agency.delete',
    }
    permission_denied_message = AGENCY_ERRORS["agency_not_authorized"]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = RealEstateAgencyAdminFilter
    search_fields = ['name', 'phone', 'email', 'license_number']
    ordering_fields = ['created_at', 'updated_at', 'rating', 'name']
    ordering = ['-rating', 'name']
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        user = self.request.user
        
        is_super = getattr(user, 'is_superuser', False) or getattr(user, 'is_admin_full', False)
        if not is_super:
            has_agent_role = hasattr(user, 'admin_user_roles') and user.admin_user_roles.filter(
                role__name='property_agent',
                is_active=True
            ).exists()
            
            if has_agent_role:
                return RealEstateAgency.objects.none()

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
        queryset = self.filter_queryset(self.get_queryset())
        
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
        serializer = self.get_serializer(data=request.data)
        
        try:
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
        except (DRFValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_create_failed"],
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def retrieve(self, request, *args, **kwargs):
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
        partial = kwargs.pop('partial', False)
        agency_id = kwargs.get('pk')

        agency = RealEstateAgencyAdminService.get_agency_by_id(agency_id)
        if not agency:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(agency, data=request.data, partial=partial)

        try:
            serializer.is_valid(raise_exception=True)

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
        except (DRFValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_update_failed"],
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_update_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
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
        except DjangoValidationError as e:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_delete_failed"],
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        agency_ids = request.data.get('ids', [])
        
        if not agency_ids:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_ids_required"],
                errors={'ids': [AGENCY_ERRORS["agency_ids_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(agency_ids, list):
            agency_ids = [agency_ids]
        
        try:
            deleted_count = RealEstateAgencyAdminService.bulk_delete_agencies(agency_ids)
            return APIResponse.success(
                message=AGENCY_SUCCESS["agency_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except DjangoValidationError as e:
            return APIResponse.error(
                message=AGENCY_ERRORS["agency_delete_failed"],
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

