from rest_framework import viewsets, status, filters
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.db import IntegrityError
from django.conf import settings
from src.core.utils.request_helpers import MultipartDataParser

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin

from src.real_estate.models.property import Property
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.serializers.admin import (
    PropertyAdminListSerializer,
    PropertyAdminDetailSerializer,
    PropertyAdminCreateSerializer,
    PropertyAdminUpdateSerializer,
    PropertyMediaSerializer,
)
from src.real_estate.services.admin import (
    PropertyAdminService,
    PropertyAdminStatusService,
    PropertyAdminSEOService,
    PropertyAdminMediaService,
)
from src.real_estate.filters.admin.property_filters import PropertyAdminFilter
from src.real_estate.services.admin import (
    PropertyAdminService,
    PropertyAdminStatusService,
    PropertyAdminSEOService,
    PropertyAdminMediaService,
    PropertyExcelExportService,
    PropertyPDFListExportService,
)
from src.real_estate.messages.messages import PROPERTY_SUCCESS, PROPERTY_ERRORS
from src.real_estate.models.constants import LISTING_TYPE_CHOICES
from src.core.utils.validation_helpers import extract_validation_message, normalize_validation_error

class PropertyFinalizeDealSerializer(serializers.Serializer):
    _DEAL_TYPE_CHOICES = tuple(
        (code, label)
        for code, label in LISTING_TYPE_CHOICES.items()
        if code != 'other'
    )

    deal_type = serializers.ChoiceField(choices=_DEAL_TYPE_CHOICES, required=False)
    final_amount = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    sale_price = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    pre_sale_price = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    monthly_rent = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    rent_amount = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    security_deposit = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    mortgage_amount = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    contract_date = serializers.DateField(required=False, allow_null=True)
    responsible_agent = serializers.PrimaryKeyRelatedField(
        required=False,
        allow_null=True,
        queryset=PropertyAgent.objects.all(),
    )
    commission = serializers.IntegerField(required=False, allow_null=True, min_value=0)

class PropertyAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyAdminFilter
    search_fields = [
        'title', 
        'neighborhood',
        'city__name', 
        'region__name',
        'agency__name',
        'agent__user__admin_profile__first_name',
        'agent__user__admin_profile__last_name',
        'slug'
    ]
    ordering_fields = ['created_at', 'updated_at', 'title', 'price', 'published_at', 'views_count']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination
    
    permission_map = {
        'list': 'real_estate.property.read',
        'retrieve': 'real_estate.property.read',
        'create': 'real_estate.property.create',
        'update': 'real_estate.property.update',
        'partial_update': 'real_estate.property.update',
        'destroy': 'real_estate.property.delete',
        'bulk_delete': 'real_estate.property.delete',
        'bulk_update_status': 'real_estate.property.update',
        'publish': 'real_estate.property.update',
        'unpublish': 'real_estate.property.update',
        'toggle_featured': 'real_estate.property.update',
        'finalize_deal': 'real_estate.property.finalize',
        'set_main_image': 'real_estate.property.update',
        'add_media': 'real_estate.property.update',
        'remove_media': 'real_estate.property.update',
        'export_pdf': 'real_estate.property.read',
        'statistics': 'real_estate.property.read',
        'seo_report': 'real_estate.property.read',
        'bulk_generate_seo': 'real_estate.property.update',
        'generate_seo': 'real_estate.property.update',
        'validate_seo': 'real_estate.property.read',
        'field_options': 'real_estate.property.read',
        'export': 'real_estate.property.read',
    }
    permission_denied_message = PROPERTY_ERRORS["property_not_authorized"]

    @staticmethod
    def _map_integrity_unique_error(error):
        error_text = str(error).lower()
        if 'slug' in error_text:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_slug_exists"],
                errors={'slug': [PROPERTY_ERRORS["property_slug_exists"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )

        return APIResponse.error(
            message=PROPERTY_ERRORS["property_create_failed"],
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    def get_queryset(self):
        user = self.request.user
        queryset = Property.objects.all()

        if self.action == 'list':
            queryset = Property.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            queryset = Property.objects.for_detail().select_related(
                'region__city__province__country'
            )
        elif self.action == 'export':
            queryset = Property.objects.for_admin_listing().prefetch_related(
                'labels', 'tags', 'features'
            ).select_related(
                'property_type', 'state', 'city', 'province', 'agent', 'agency'
            )

        is_super = getattr(user, 'is_superuser', False) or getattr(user, 'is_admin_full', False)
        
        if not is_super:
            has_agent_role = hasattr(user, 'admin_user_roles') and user.admin_user_roles.filter(
                role__name='property_agent',
                is_active=True
            ).exists()
            
            if has_agent_role:
                queryset = queryset.filter(created_by=user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropertyAdminListSerializer
        elif self.action == 'create':
            return PropertyAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PropertyAdminUpdateSerializer
        else:
            return PropertyAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def _merge_media_data(self, data, media_ids=None, media_files=None):
        
        if media_ids is not None:
            if hasattr(data, 'setlist'):
                data.setlist('media_ids', media_ids)
            else:
                data['media_ids'] = media_ids
        
        if media_files:
            if hasattr(data, 'setlist'):
                data.setlist('media_files', media_files)
            else:
                data['media_files'] = media_files
        return data

    def _extract_list(self, data, field_name, convert_to_int=False):
        return MultipartDataParser.extract_list(data, field_name, convert_to_int)

    def _extract_media_ids(self, request):
        return self._extract_list(request.data, 'media_ids')

    def _extract_segmented_ids(self, request):

        def _get_dict(key):
            val = request.data.get(key)
            if not val: return {}
            if isinstance(val, dict): return val
            if isinstance(val, str):
                try:
                    import json
                    return json.loads(val)
                except: return {}
            return {}

        return {
            'image_ids': self._extract_list(request.data, 'image_ids', convert_to_int=True),
            'video_ids': self._extract_list(request.data, 'video_ids', convert_to_int=True),
            'audio_ids': self._extract_list(request.data, 'audio_ids', convert_to_int=True),
            'document_ids': self._extract_list(request.data, 'document_ids', convert_to_int=True),
            'image_covers': _get_dict('image_covers'),
            'video_covers': _get_dict('video_covers'),
            'audio_covers': _get_dict('audio_covers'),
            'document_covers': _get_dict('document_covers'),
        }

    def create(self, request, *args, **kwargs):
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        segmented_media = self._extract_segmented_ids(request)
        
        data = request.data.copy()
        
        for field in ['labels', 'tags', 'features', 'extra_attributes']:
            if field in data:
                if field == 'extra_attributes':
                    extracted = data.get(field)
                    if isinstance(extracted, str):
                        try:
                            import json
                            extracted = json.loads(extracted)
                        except (ValueError, json.JSONDecodeError): pass
                else:
                    extracted = self._extract_list(data, field, convert_to_int=True)
                
                if hasattr(data, 'setlist') and isinstance(extracted, list):
                    data.setlist(field, extracted)
                else:
                    data[field] = extracted
        
        data = self._merge_media_data(data, media_ids, media_files)
        for m_key, m_val in segmented_media.items():
            if m_val: data[m_key] = m_val
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        try:
            property_obj = PropertyAdminService.create_property(
                validated_data=serializer.validated_data,
                created_by=request.user
            )
            instance = PropertyAdminService.get_property_detail(property_obj.id)
            detail_serializer = PropertyAdminDetailSerializer(instance, context={'request': request})
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_create_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError as e:
            return self._map_integrity_unique_error(e)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        segmented_media = self._extract_segmented_ids(request)
        
        main_image_id = request.data.get('main_image_id')
        media_covers_raw = request.data.get('media_covers')
        
        data = request.data.copy()
        
        for field in ['labels', 'tags', 'features', 'extra_attributes']:
            if field in data:
                if field == 'extra_attributes':
                    extracted = data.get(field)
                    if isinstance(extracted, str):
                        try:
                            import json
                            extracted = json.loads(extracted)
                        except (ValueError, json.JSONDecodeError): pass
                else:
                    extracted = self._extract_list(data, field, convert_to_int=True)
                
                if hasattr(data, 'setlist') and isinstance(extracted, list):
                    data.setlist(field, extracted)
                else:
                    data[field] = extracted
        
        media_covers = None
        if media_covers_raw:
            if isinstance(media_covers_raw, dict):
                media_covers = media_covers_raw
            elif isinstance(media_covers_raw, str):
                try:
                    import json
                    media_covers = json.loads(media_covers_raw)
                except Exception:
                    media_covers = None
        
        data = self._merge_media_data(data, media_ids, media_files)
        for m_key, m_val in segmented_media.items():
            if m_val: data[m_key] = m_val
            
        if media_covers: data['media_covers'] = media_covers
        if main_image_id: data['main_image_id'] = main_image_id
            
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            updated_instance = PropertyAdminService.update_property(
                property_id=instance.id,
                validated_data=serializer.validated_data,
                media_ids=serializer.validated_data.get('media_ids'),
                media_files=serializer.validated_data.get('media_files'),
                image_ids=serializer.validated_data.get('image_ids'),
                video_ids=serializer.validated_data.get('video_ids'),
                audio_ids=serializer.validated_data.get('audio_ids'),
                document_ids=serializer.validated_data.get('document_ids'),
                main_image_id=serializer.validated_data.get('main_image_id'),
                media_covers=serializer.validated_data.get('media_covers'),
                image_covers=serializer.validated_data.get('image_covers'),
                video_covers=serializer.validated_data.get('video_covers'),
                audio_covers=serializer.validated_data.get('audio_covers'),
                document_covers=serializer.validated_data.get('document_covers'),
                updated_by=request.user
            )
            fresh_instance = PropertyAdminService.get_property_detail(updated_instance.id)
            detail_serializer = PropertyAdminDetailSerializer(fresh_instance, context={'request': request})
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError as e:
            return self._map_integrity_unique_error(e)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        success = PropertyAdminService.delete_property(instance.id)
        
        if success:
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_deleted"],
                status_code=status.HTTP_200_OK
            )
        else:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_delete_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        property_ids = request.data.get('ids', [])
        
        if not property_ids:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_ids_required"],
                errors={'ids': [PROPERTY_ERRORS["property_ids_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            deleted_count = PropertyAdminService.bulk_delete_properties(property_ids)
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_bulk_deleted"],
                data={'deleted_count': deleted_count},
                status_code=status.HTTP_200_OK
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_delete_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-update-status')
    def bulk_update_status(self, request):
        property_ids = request.data.get('ids', [])
        is_published = request.data.get('is_published')
        is_featured = request.data.get('is_featured')
        
        if not property_ids:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success = PropertyAdminService.bulk_update_status(
                property_ids=property_ids,
                is_published=is_published,
                is_featured=is_featured
            )
            
            if success:
                return APIResponse.success(
                    message=PROPERTY_SUCCESS["property_bulk_status_updated"],
                    data={'updated_count': len(property_ids)},
                    status_code=status.HTTP_200_OK
                )
            else:
                return APIResponse.error(
                    message=PROPERTY_ERRORS["property_update_failed"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        try:
            result = PropertyAdminStatusService.publish_property(pk)
            
            serializer = PropertyAdminDetailSerializer(result['property'])
            
            response_data = {
                'property': serializer.data,
                'warnings': result['warnings']
            }
            
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_published"],
                data=response_data,
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        try:
            property_obj = PropertyAdminStatusService.unpublish_property(pk)
            serializer = PropertyAdminDetailSerializer(property_obj)
            
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_updated"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        try:
            property_obj = PropertyAdminStatusService.toggle_featured(pk)
            serializer = PropertyAdminDetailSerializer(property_obj)
            
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_updated"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='finalize-deal')
    def finalize_deal(self, request, pk=None):
        serializer = PropertyFinalizeDealSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)

            property_obj = PropertyAdminStatusService.finalize_deal(
                pk,
                deal_type=serializer.validated_data.get('deal_type'),
                final_amount=serializer.validated_data.get('final_amount'),
                sale_price=serializer.validated_data.get('sale_price'),
                pre_sale_price=serializer.validated_data.get('pre_sale_price'),
                monthly_rent=serializer.validated_data.get('monthly_rent'),
                rent_amount=serializer.validated_data.get('rent_amount'),
                security_deposit=serializer.validated_data.get('security_deposit'),
                mortgage_amount=serializer.validated_data.get('mortgage_amount'),
                contract_date=serializer.validated_data.get('contract_date'),
                responsible_agent=serializer.validated_data.get('responsible_agent'),
                commission=serializer.validated_data.get('commission'),
            )
            detail_serializer = PropertyAdminDetailSerializer(property_obj, context={'request': request})

            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_deal_finalized"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK,
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except (DRFValidationError, ValidationError) as exc:
            return APIResponse.error(
                message=extract_validation_message(exc, PROPERTY_ERRORS["property_update_failed"]),
                errors=normalize_validation_error(exc),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['post'])
    def set_main_image(self, request, pk=None):
        media_id = request.data.get('media_id')
        
        if not media_id:
            return APIResponse.error(
                message=PROPERTY_ERRORS["media_id_required"],
                errors={'media_id': [PROPERTY_ERRORS["media_id_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            PropertyAdminService.set_main_image(pk, media_id)
            
            fresh_instance = PropertyAdminService.get_property_detail(pk)
            serializer = PropertyAdminDetailSerializer(fresh_instance, context={'request': request})
            
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_main_image_set"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        from src.real_estate.services.admin.property_media_services import PropertyAdminMediaService
        from src.real_estate.serializers.admin.media_serializer import PropertyMediaSerializer
        from django.conf import settings
        
        media_files = request.FILES.getlist('media_files')
        serializer = PropertyMediaSerializer(data=request.data.copy())

        try:
            serializer.is_valid(raise_exception=True)

            media_ids = serializer.validated_data.get('media_ids', [])
            if not media_ids and not media_files:
                raise DRFValidationError({
                    'non_field_errors': [PROPERTY_ERRORS["media_ids_or_files_required"]]
                })

            upload_max = settings.PROPERTY_MEDIA_UPLOAD_MAX if hasattr(settings, 'PROPERTY_MEDIA_UPLOAD_MAX') else 20
            total_media = len(media_ids) + len(media_files)
            if total_media > upload_max:
                raise DRFValidationError({
                    'non_field_errors': [
                        PROPERTY_ERRORS["media_upload_limit_exceeded"].format(max_items=upload_max, total_items=total_media)
                    ]
                })

            result = PropertyAdminMediaService.add_media_bulk(
                property_id=pk,
                media_files=media_files,
                media_ids=media_ids,
                created_by=request.user
            )
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_media_added"],
                data=result,
                status_code=status.HTTP_200_OK
            )
        except (DRFValidationError, ValidationError) as exc:
            return APIResponse.error(
                message=extract_validation_message(exc, PROPERTY_ERRORS["property_update_failed"]),
                errors=normalize_validation_error(exc),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def seo_report(self, request):
        report = PropertyAdminService.get_seo_report()
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_seo_report_retrieved"],
            data=report,
            status_code=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        stats = PropertyAdminService.get_property_statistics()
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='seo-report')
    def seo_report(self, request):
        report = PropertyAdminService.get_seo_report()
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_seo_report_retrieved"],
            data=report,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-generate-seo')
    def bulk_generate_seo(self, request):
        property_ids = request.data.get('ids', [])
        
        if not property_ids:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_ids_required"],
                errors={'ids': [PROPERTY_ERRORS["property_ids_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        for property_id in property_ids:
            try:
                PropertyAdminSEOService.auto_generate_seo(property_id)
                updated_count += 1
            except Exception:
                continue
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_bulk_seo_generated"],
            data={'generated_count': updated_count, 'total_count': len(property_ids)},
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], url_path='generate-seo')
    def generate_seo(self, request, pk=None):
        try:
            property_obj = PropertyAdminSEOService.auto_generate_seo(pk)
            serializer = PropertyAdminDetailSerializer(property_obj)
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_seo_generated"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], url_path='validate-seo')
    def validate_seo(self, request, pk=None):
        try:
            validation_result = PropertyAdminSEOService.validate_seo_data(pk)
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_seo_validated"],
                data=validation_result,
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        media_files = request.FILES.getlist('media_files')
        serializer = PropertyMediaSerializer(data=request.data.copy())

        try:
            serializer.is_valid(raise_exception=True)

            media_ids = serializer.validated_data.get('media_ids', [])
            if not media_ids and not media_files:
                raise DRFValidationError({
                    'non_field_errors': [PROPERTY_ERRORS["media_ids_or_files_required"]]
                })

            upload_max = getattr(settings, 'REAL_ESTATE_MEDIA_UPLOAD_MAX', 10)
            total_media = len(media_ids) + len(media_files)
            if total_media > upload_max:
                raise DRFValidationError({
                    'non_field_errors': [
                        PROPERTY_ERRORS["media_upload_limit_exceeded"].format(max_items=upload_max, total_items=total_media)
                    ]
                })

            result = PropertyAdminMediaService.add_media_bulk(
                property_id=pk,
                media_files=media_files,
                media_ids=media_ids,
                created_by=request.user
            )
            
            property_obj = PropertyAdminService.get_property_detail(pk)
            serializer = PropertyAdminDetailSerializer(property_obj)
            
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_media_added"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except (DRFValidationError, ValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='remove-media')
    def remove_media(self, request, pk=None):
        
        property_obj = self.get_object()
        media_id = request.data.get('media_id')
        media_type = request.data.get('media_type', 'image')
        
        if not media_id:
            return APIResponse.error(
                message=PROPERTY_ERRORS["media_id_required"],
                errors={'media_id': [PROPERTY_ERRORS["media_id_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
            
            if media_type == 'image':
                deleted = PropertyImage.objects.filter(property_id=pk, image_id=media_id).delete()[0]
            elif media_type == 'video':
                deleted = PropertyVideo.objects.filter(property_id=pk, video_id=media_id).delete()[0]
            elif media_type == 'audio':
                deleted = PropertyAudio.objects.filter(property_id=pk, audio_id=media_id).delete()[0]
            elif media_type == 'document':
                deleted = PropertyDocument.objects.filter(property_id=pk, document_id=media_id).delete()[0]
            else:
                return APIResponse.error(
                    message=PROPERTY_ERRORS["invalid_media_type"],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if deleted > 0:
                property_obj.refresh_from_db()
                serializer = PropertyAdminDetailSerializer(property_obj)
                
                return APIResponse.success(
                    message=PROPERTY_SUCCESS["property_media_removed"],
                    data=serializer.data,
                    status_code=status.HTTP_200_OK
                )
            else:
                return APIResponse.error(
                    message=PROPERTY_ERRORS["property_media_not_found"],
                    status_code=status.HTTP_404_NOT_FOUND
                )
        except ValidationError as e:
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='field-options')
    def field_options(self, request):
        
        from src.real_estate.models.property import Property
        from src.real_estate.models.constants import (
            get_listing_type_choices_list,
            get_document_type_choices_list,
            get_space_type_choices_list,
            get_construction_status_choices_list,
            get_property_condition_choices_list,
            get_property_direction_choices_list,
            get_city_position_choices_list,
            get_unit_type_choices_list,
            get_property_status_choices_list,
        )
        
        options = {
            'bedrooms': Property.BEDROOM_CHOICES,
            'bathrooms': Property.BATHROOM_CHOICES,
            'parking_spaces': Property.PARKING_CHOICES,
            'storage_rooms': Property.STORAGE_CHOICES,
            'floor_number': Property.FLOOR_CHOICES,
            'kitchens': Property.KITCHEN_CHOICES,
            'living_rooms': Property.LIVING_ROOM_CHOICES,
            'status': get_property_status_choices_list(),
            'listing_type': get_listing_type_choices_list(),
            
            'document_type': get_document_type_choices_list(),
            
            'extra_attributes_options': {
                'space_type': get_space_type_choices_list(),
                'construction_status': get_construction_status_choices_list(),
                'property_condition': get_property_condition_choices_list(),
                'property_direction': get_property_direction_choices_list(),
                'city_position': get_city_position_choices_list(),
                'unit_type': get_unit_type_choices_list(),
            },
            
            'year_built': {
                'min': Property.YEAR_MIN,
                'max': Property.get_year_max(),
                'placeholder': f'مثلاً {Property.get_current_shamsi_year()}',
                'help_text': f'سال شمسی ({Property.YEAR_MIN}-{Property.get_year_max()})'
            },
        }
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_field_options_retrieved"],
            data=options,
            status_code=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        
        queryset = self.filter_queryset(self.get_queryset())
        export_format = request.query_params.get('format', 'excel').lower()
        
        logger.info(f"Property export requested. Format: {export_format}, Count: {queryset.count()}")
        
        try:
            if export_format == 'pdf':
                queryset = queryset.select_related('property_type', 'state', 'city')
                return PropertyPDFListExportService.export_properties_pdf(queryset)
            else:
                return PropertyExcelExportService.export_properties(queryset)
        except ImportError as e:
            logger.error(f"Export dependency missing: {str(e)}")
            return APIResponse.error(
                message=extract_validation_message(e, PROPERTY_ERRORS["property_export_failed"]),
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"Property export failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_export_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        
        try:
            instance = Property.objects.prefetch_related(
                'labels', 'tags', 'features', 'images__image'
            ).select_related(
                'property_type', 'state', 'city', 'province', 'agent', 'agency'
            ).get(pk=pk)
            
            from src.real_estate.services.admin.pdf_export_service import PropertyPDFExportService
            return PropertyPDFExportService.export_property_pdf(instance)
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_export_failed"],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

