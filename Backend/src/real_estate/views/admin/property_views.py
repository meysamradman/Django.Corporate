from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from src.core.responses.response import APIResponse
from src.core.pagination import StandardLimitPagination
from src.user.access_control import real_estate_permission, PermissionValidator

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


class PropertyAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [real_estate_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyAdminFilter
    search_fields = ['title', 'short_description', 'description', 'address', 'meta_title', 'meta_description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'price', 'published_at', 'views_count']
    ordering = ['-is_featured', '-published_at', '-created_at']
    pagination_class = StandardLimitPagination
    
    def get_queryset(self):
        if self.action == 'list':
            return Property.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            # Ensure district and related location fields are loaded for updates
            return Property.objects.for_detail().select_related(
                'district__region__city__province__country'
            )
        else:
            return Property.objects.all()
    
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.read'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.read'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.create'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        media_ids = self._extract_media_ids(request)
        media_files = request.FILES.getlist('media_files')
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.delete'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.delete'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        property_ids = request.data.get('ids', [])
        is_published = request.data.get('is_published')
        is_featured = request.data.get('is_featured')
        is_verified = request.data.get('is_verified')
        
        if not property_ids:
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_ids_required"],
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success = PropertyAdminService.bulk_update_status(
                property_ids=property_ids,
                is_published=is_published,
                is_featured=is_featured,
                is_verified=is_verified
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
    def toggle_verified(self, request, pk=None):
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        try:
            property_obj = PropertyAdminStatusService.toggle_verified(pk)
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.read'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        stats = PropertyAdminService.get_property_statistics()
        
        recent_properties = Property.objects.for_admin_listing()[:5]
        recent_serializer = PropertyAdminListSerializer(recent_properties, many=True)
        
        stats['recent_properties'] = recent_serializer.data
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS["property_statistics_retrieved"],
            data=stats,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='seo-report')
    def seo_report(self, request):
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.read'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        report = PropertyAdminService.get_seo_report()
        
        return APIResponse.success(
            message=PROPERTY_SUCCESS.get("property_seo_report_retrieved", "SEO report retrieved successfully"),
            data=report,
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'], url_path='bulk-generate-seo')
    def bulk_generate_seo(self, request):
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.read'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
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
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        media_files = request.FILES.getlist('media_files')
        serializer = PropertyMediaSerializer(data=request.data.copy())
        serializer.is_valid(raise_exception=True)
        
        media_ids = serializer.validated_data.get('media_ids', [])
        if not media_ids and not media_files:
            raise DRFValidationError({
                'non_field_errors': ['At least one of media_ids or media_files must be provided.']
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
    
    @action(detail=True, methods=['post'], url_path='set-main-image')
    def set_main_image(self, request, pk=None):
        if not PermissionValidator.has_permission(request.user, 'real_estate.property.update'):
            return APIResponse.error(
                message=PROPERTY_ERRORS["property_not_authorized"],
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        media_id = request.data.get('media_id')
        
        if not media_id:
            return APIResponse.error(
                message=PROPERTY_ERRORS.get("media_id_required", "Media ID is required"),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from src.real_estate.models.media import PropertyImage
            
            PropertyImage.objects.filter(property_id=pk, is_main=True).update(is_main=False)
            
            property_image = PropertyImage.objects.filter(property_id=pk, image_id=media_id).first()
            if property_image:
                property_image.is_main = True
                property_image.save()
            else:
                PropertyAdminService.set_main_image(pk, media_id)
            
            PropertyCacheManager.invalidate_property(pk)
            
            return APIResponse.success(
                message=PROPERTY_SUCCESS["property_main_image_set"],
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=str(e) or PROPERTY_ERRORS["property_update_failed"],
                status_code=status.HTTP_400_BAD_REQUEST
            )

