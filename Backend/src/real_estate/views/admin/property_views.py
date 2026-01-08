from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.conf import settings

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionRequiredMixin

from src.real_estate.models.property import Property
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
from src.real_estate.utils.cache import PropertyCacheManager
from src.real_estate.messages.messages import PROPERTY_SUCCESS, PROPERTY_ERRORS


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
        'set_main_image': 'real_estate.property.update',
        'add_media': 'real_estate.property.update',
        'remove_media': 'real_estate.property.update',
        'statistics': 'real_estate.property.read',
        'seo_report': 'real_estate.property.read',
        'bulk_generate_seo': 'real_estate.property.update',
        'generate_seo': 'real_estate.property.update',
        'validate_seo': 'real_estate.property.read',
        'field_options': 'real_estate.property.read',
    }
    permission_denied_message = PROPERTY_ERRORS["property_not_authorized"]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Property.objects.all()

        if self.action == 'list':
            queryset = Property.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            queryset = Property.objects.for_detail().select_related(
                'region__city__province__country'
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
    
    def _extract_media_ids(self, request):
        media_ids = []
        
        media_ids_value = request.data.get('media_ids')
        
        if not media_ids_value:
            media_ids_value = request.POST.get('media_ids')
        
        if not media_ids_value:
            return []
        
        if isinstance(media_ids_value, list):
            media_ids = [
                int(id) for id in media_ids_value 
                if isinstance(id, (int, str)) and str(id).isdigit()
            ]
        elif isinstance(media_ids_value, int):
            media_ids = [media_ids_value]
        elif isinstance(media_ids_value, str):
            if media_ids_value.strip().startswith('['):
                try:
                    import json
                    parsed = json.loads(media_ids_value)
                    if isinstance(parsed, list):
                        media_ids = [int(id) for id in parsed if isinstance(id, (int, str)) and str(id).isdigit()]
                except json.JSONDecodeError:
                    pass
            
            if not media_ids:
                media_ids = [
                    int(id.strip()) for id in media_ids_value.split(',') 
                    if id.strip().isdigit()
                ]
        
        return media_ids
    
    def create(self, request, *args, **kwargs):
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        
        upload_max = getattr(settings, 'REAL_ESTATE_MEDIA_UPLOAD_MAX', 10)
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    PROPERTY_ERRORS["media_upload_limit_exceeded"].format(max_items=upload_max, total_items=total_media)
                ]
            })
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_validation_failed"],
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data.copy()
        
        property_obj = PropertyAdminService.create_property(
            validated_data=validated_data,
            created_by=request.user
        )
        
        if media_files or media_ids:
            PropertyAdminMediaService.add_media_bulk(
                property_id=property_obj.id,
                media_files=media_files,
                media_ids=media_ids,
                created_by=request.user
            )
            property_obj.refresh_from_db()
            PropertyCacheManager.invalidate_property(property_obj.id)
        
        property_obj = Property.objects.for_detail().get(id=property_obj.id)
        detail_serializer = PropertyAdminDetailSerializer(property_obj)
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        media_ids = self._extract_media_ids(request)
        main_image_id = request.data.get('main_image_id')
        media_covers_raw = request.data.get('media_covers')
        
        media_covers = None
        if media_covers_raw:
            if isinstance(media_covers_raw, dict):
                media_covers = media_covers_raw
            elif isinstance(media_covers_raw, str):
                try:
                    import json
                    media_covers = json.loads(media_covers_raw)
                except:
                    media_covers = None
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data.copy()
        labels_ids = validated_data.pop('labels_ids', None)
        tags_ids = validated_data.pop('tags_ids', None)
        features_ids = validated_data.pop('features_ids', None)
        media_ids_from_serializer = validated_data.pop('media_ids', None)
        main_image_id_from_serializer = validated_data.pop('main_image_id', None)
        media_covers_from_serializer = validated_data.pop('media_covers', None)
        
        if media_ids_from_serializer is not None:
            media_ids = media_ids_from_serializer
        if main_image_id_from_serializer is not None:
            main_image_id = main_image_id_from_serializer
        if media_covers_from_serializer is not None:
            media_covers = media_covers_from_serializer
        
        updated_instance = PropertyAdminService.update_property(
            property_id=instance.id,
            validated_data=validated_data,
            labels_ids=labels_ids,
            tags_ids=tags_ids,
            features_ids=features_ids,
            updated_by=request.user
        )
        
        if media_ids is not None or main_image_id is not None or media_covers:
            PropertyAdminMediaService.sync_media(
                property_id=instance.id,
                media_ids=media_ids if media_ids is not None else None,
                main_image_id=main_image_id,
                media_covers=media_covers
            )
            updated_instance.refresh_from_db()
            PropertyCacheManager.invalidate_property(instance.id)
        
        updated_instance = Property.objects.for_detail().get(pk=updated_instance.pk)
        detail_serializer = PropertyAdminDetailSerializer(updated_instance)
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_updated"],
            data=detail_serializer.data,
            status_code=status.HTTP_200_OK
        )
    
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
            error_msg = str(e)
            if "not found" in error_msg.lower():
                message = PROPERTY_ERRORS["properties_not_found"]
            elif "required" in error_msg.lower():
                message = PROPERTY_ERRORS["property_ids_required"]
            else:
                message = PROPERTY_ERRORS["property_delete_failed"]
            return APIResponse.error(
                message=message,
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
                message=str(e),
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
    
    
    @action(detail=True, methods=['post'])
    def set_main_image(self, request, pk=None):
        media_id = request.data.get('media_id')
        
        if not media_id:
            return APIResponse.error(
                message=PROPERTY_ERRORS["media_id_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            PropertyAdminService.set_main_image(pk, media_id)
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_main_image_set"],
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e) or PROPERTY_ERRORS["property_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
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
            message=PROPERTY_SUCCESS.get("property_seo_report_retrieved", "SEO report retrieved successfully"),
            data=report,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-generate-seo')
    def bulk_generate_seo(self, request):
        property_ids = request.data.get('ids', [])
        
        if not property_ids:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_ids_required"],
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
            message=PROPERTY_SUCCESS.get("property_bulk_seo_generated", "SEO generated successfully"),
            data={'generated_count': updated_count, 'total_count': len(property_ids)},
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], url_path='generate-seo')
    def generate_seo(self, request, pk=None):
        try:
            property_obj = PropertyAdminSEOService.auto_generate_seo(pk)
            serializer = PropertyAdminDetailSerializer(property_obj)
            return APIResponse.success(
                message=PROPERTY_SUCCESS.get("property_seo_generated", "SEO generated successfully"),
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
                message=PROPERTY_SUCCESS.get("property_seo_validated", "SEO validated successfully"),
                data=validation_result,
                status_code=status.HTTP_200_OK
            )
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='add-media')
    def add_media(self, request, pk=None):
        media_files = request.FILES.getlist('media_files')
        serializer = PropertyMediaSerializer(data=request.data.copy())
        serializer.is_valid(raise_exception=True)
        
        media_ids = serializer.validated_data.get('media_ids', [])
        if not media_ids and not media_files:
            raise DRFValidationError({
                'non_field_errors': ['At least one of media_ids or media_files must be provided.']
            })
            
        upload_max = getattr(settings, 'REAL_ESTATE_MEDIA_UPLOAD_MAX', 10)
        total_media = len(media_ids) + len(media_files)
        if total_media > upload_max:
            raise DRFValidationError({
                'non_field_errors': [
                    PROPERTY_ERRORS["media_upload_limit_exceeded"].format(max_items=upload_max, total_items=total_media)
                ]
            })
        
        try:
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
        except Property.DoesNotExist:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e) or PROPERTY_ERRORS["property_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='remove-media')
    def remove_media(self, request, pk=None):
        """
        Remove single media from property
        POST /property/{id}/remove-media/
        Body: media_id (int), media_type (str: image/video/audio/document)
        """
        property_obj = self.get_object()
        media_id = request.data.get('media_id')
        media_type = request.data.get('media_type', 'image')
        
        if not media_id:
            return APIResponse.error(
                message=PROPERTY_ERRORS["media_id_required"],
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
                    message="Invalid media type",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if deleted > 0:
                property_obj.refresh_from_db()
                PropertyCacheManager.invalidate_property(property_obj.id)
                serializer = PropertyAdminDetailSerializer(property_obj)
                
                return APIResponse.success(
                    message="رسانه با موفقیت حذف شد.",
                    data=serializer.data,
                    status_code=status.HTTP_200_OK
                )
            else:
                return APIResponse.error(
                    message="رسانه یافت نشد.",
                    status_code=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return APIResponse.error(
                message=str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='field-options')
    def field_options(self, request):
        """
        Returns field options/choices for property form fields
        Dynamically retrieves choices from Property model and Constants
        """
        from src.real_estate.models.property import Property
        from src.real_estate.models.constants import (
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
            message="Field options retrieved successfully",
            data=options,
            status_code=status.HTTP_200_OK
        )

