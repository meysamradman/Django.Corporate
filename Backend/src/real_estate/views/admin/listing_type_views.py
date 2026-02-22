from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin

from src.real_estate.models.listing_type import ListingType
from src.real_estate.filters.admin.listing_type_filters import ListingTypeAdminFilter
from src.real_estate.serializers.admin.listing_type_serializer import (
    ListingTypeAdminListSerializer,
    ListingTypeAdminDetailSerializer,
    ListingTypeAdminCreateSerializer,
    ListingTypeAdminUpdateSerializer,
)
from src.real_estate.services.admin.listing_type_services import ListingTypeAdminService
from src.real_estate.messages.messages import LISTING_TYPE_SUCCESS, LISTING_TYPE_ERRORS
from src.core.utils.validation_helpers import extract_validation_message, normalize_validation_error

class ListingTypeAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    
    permission_map = {
        'list': 'real_estate.listing_type.read',
        'retrieve': 'real_estate.listing_type.read',
        'create': 'real_estate.listing_type.create',
        'update': 'real_estate.listing_type.update',
        'partial_update': 'real_estate.listing_type.update',
        'destroy': 'real_estate.listing_type.delete',
        'bulk_delete': 'real_estate.listing_type.delete',
        'field_options': 'real_estate.listing_type.read',
    }
    permission_denied_message = LISTING_TYPE_ERRORS["listing_type_not_authorized"]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ListingTypeAdminFilter
    search_fields = ['title']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination

    def get_queryset(self):
        if self.action == 'list':
            return ListingTypeAdminService.get_listing_type_queryset()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return ListingTypeAdminService.get_listing_type_queryset()
        else:
            return ListingType.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ListingTypeAdminListSerializer
        elif self.action == 'create':
            return ListingTypeAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ListingTypeAdminUpdateSerializer
        else:
            return ListingTypeAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        user_id = getattr(request.user, 'id', None)
        cached_payload = ListingTypeAdminService.get_cached_list_payload(
            user_id=user_id,
            query_params=request.query_params,
        )
        if cached_payload is not None:
            return Response(cached_payload, status=status.HTTP_200_OK)

        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            ListingTypeAdminService.set_cached_list_payload(
                user_id=user_id,
                query_params=request.query_params,
                payload=response.data,
            )
            return response
        
        serializer = self.get_serializer(queryset, many=True)
        response = APIResponse.success(
            message=LISTING_TYPE_SUCCESS["listing_type_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
        ListingTypeAdminService.set_cached_list_payload(
            user_id=user_id,
            query_params=request.query_params,
            payload=response.data,
        )
        return response
    
    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')

    @staticmethod
    def _map_integrity_unique_error(error):
        error_text = str(error).lower()
        errors = {}

        if 'title' in error_text:
            errors['title'] = [LISTING_TYPE_ERRORS["listing_type_exists"]]
        if 'slug' in error_text:
            errors['slug'] = [LISTING_TYPE_ERRORS["listing_type_slug_exists"]]

        if errors:
            return APIResponse.error(
                message=next(iter(errors.values()))[0],
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return APIResponse.error(
            message=LISTING_TYPE_ERRORS["listing_type_create_failed"],
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)

            listing_type_obj = ListingTypeAdminService.create_listing_type(
                serializer.validated_data,
                created_by=request.user
            )

            detail_serializer = ListingTypeAdminDetailSerializer(listing_type_obj)
            return APIResponse.success(
                message=LISTING_TYPE_SUCCESS["listing_type_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except (DRFValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, LISTING_TYPE_ERRORS["listing_type_create_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError as e:
            return self._map_integrity_unique_error(e)
    
    def retrieve(self, request, *args, **kwargs):
        listing_type_obj = ListingTypeAdminService.get_listing_type_by_id(kwargs.get('pk'))
        
        if not listing_type_obj:
            return APIResponse.error(
                message=LISTING_TYPE_ERRORS["listing_type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(listing_type_obj)
        return APIResponse.success(
            message=LISTING_TYPE_SUCCESS["listing_type_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        listing_type_id = kwargs.get('pk')
        listing_type_obj = ListingTypeAdminService.get_listing_type_by_id(listing_type_id)

        if not listing_type_obj:
            return APIResponse.error(
                message=LISTING_TYPE_ERRORS["listing_type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(listing_type_obj, data=request.data, partial=partial)

        try:
            serializer.is_valid(raise_exception=True)

            updated_listing_type = ListingTypeAdminService.update_listing_type_by_id(
                listing_type_id,
                serializer.validated_data
            )
            
            detail_serializer = ListingTypeAdminDetailSerializer(updated_listing_type)
            return APIResponse.success(
                message=LISTING_TYPE_SUCCESS["listing_type_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ListingType.DoesNotExist:
            return APIResponse.error(
                message=LISTING_TYPE_ERRORS["listing_type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except (DRFValidationError, DjangoValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, LISTING_TYPE_ERRORS["listing_type_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError as e:
            return self._map_integrity_unique_error(e)
    
    @action(detail=False, methods=['get'], url_path='field-options')
    def field_options(self, request):
        
        from src.real_estate.models.constants import get_listing_type_choices_list
        return APIResponse.success(
            data={
                'usage_type': get_listing_type_choices_list()
            },
            status_code=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        listing_type_id = kwargs.get('pk')
        
        try:
            ListingTypeAdminService.delete_listing_type_by_id(listing_type_id)
            return APIResponse.success(
                message=LISTING_TYPE_SUCCESS["listing_type_deleted"],
                status_code=status.HTTP_200_OK
            )
        except ListingType.DoesNotExist:
            return APIResponse.error(
                message=LISTING_TYPE_ERRORS["listing_type_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except DjangoValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, LISTING_TYPE_ERRORS["listing_type_delete_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        listing_type_ids = request.data.get('ids', [])
        
        if not listing_type_ids:
            return APIResponse.error(
                message=LISTING_TYPE_ERRORS["listing_type_ids_required"],
                errors={'ids': [LISTING_TYPE_ERRORS["listing_type_ids_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(listing_type_ids, list):
            listing_type_ids = [listing_type_ids]
        
        try:
            deleted_count = ListingTypeAdminService.bulk_delete_listing_types(listing_type_ids)
            return APIResponse.success(
                message=LISTING_TYPE_SUCCESS["listing_type_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except DjangoValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, LISTING_TYPE_ERRORS["listing_type_delete_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

