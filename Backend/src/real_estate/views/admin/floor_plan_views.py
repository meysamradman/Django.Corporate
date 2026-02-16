from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django_filters.rest_framework import DjangoFilterBackend
from src.core.responses.response import APIResponse
from django.conf import settings

from src.real_estate.models.floor_plan import RealEstateFloorPlan
from src.real_estate.models.property import Property
from src.real_estate.serializers.admin import (
    FloorPlanAdminListSerializer,
    FloorPlanAdminDetailSerializer,
    FloorPlanAdminCreateSerializer,
    FloorPlanAdminUpdateSerializer,
    FloorPlanMediaSerializer,
)
from src.real_estate.services.admin import FloorPlanMediaService
from src.real_estate.messages import FLOOR_PLAN_SUCCESS, FLOOR_PLAN_ERRORS
from src.user.access_control import real_estate_permission, PermissionRequiredMixin
from src.core.utils.validation_helpers import extract_validation_message, normalize_validation_error

class FloorPlanAdminViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    
    permission_classes = [real_estate_permission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'unit_type']
    ordering_fields = ['created_at', 'updated_at', 'display_order', 'floor_number', 'price']
    ordering = ['property_obj', 'display_order', 'floor_number']
    
    permission_map = {
        'list': 'real_estate.read',
        'retrieve': 'real_estate.read',
        'create': 'real_estate.create',
        'update': 'real_estate.update',
        'partial_update': 'real_estate.update',
        'destroy': 'real_estate.delete',
        'add_images': 'real_estate.update',
        'remove_image': 'real_estate.update',
        'set_main_image': 'real_estate.update',
        'sync_images': 'real_estate.update',
    }
    permission_denied_message = FLOOR_PLAN_ERRORS["floor_plan_not_authorized"]
    
    def get_queryset(self):
        
        if self.action == 'list':
            return RealEstateFloorPlan.objects.select_related(
                'property_obj'
            ).prefetch_related(
                'images__image'
            ).filter(is_active=True)
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return RealEstateFloorPlan.objects.select_related(
                'property_obj'
            ).prefetch_related(
                'images__image'
            )
        else:
            return RealEstateFloorPlan.objects.all()
    
    def get_serializer_class(self):
        
        if self.action == 'list':
            return FloorPlanAdminListSerializer
        elif self.action == 'create':
            return FloorPlanAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return FloorPlanAdminUpdateSerializer
        else:
            return FloorPlanAdminDetailSerializer
    
    def list(self, request, *args, **kwargs):
        
        queryset = self.filter_queryset(self.get_queryset())
        
        property_id = request.query_params.get('property_id')
        if property_id:
            queryset = queryset.filter(property_obj_id=property_id)
        
        serializer = self.get_serializer(queryset, many=True)
        return APIResponse.success(
            message=FLOOR_PLAN_SUCCESS["floor_plan_list_success"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def retrieve(self, request, *args, **kwargs):
        
        try:
            instance = self.get_object()
        except RealEstateFloorPlan.DoesNotExist:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS["floor_plan_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(instance)
        return APIResponse.success(
            message=FLOOR_PLAN_SUCCESS["floor_plan_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    
    def create(self, request, *args, **kwargs):
        try:
            image_ids = self._extract_image_ids(request)
            image_files = request.FILES.getlist('image_files')

            upload_max = getattr(settings, 'FLOOR_PLAN_IMAGE_UPLOAD_MAX', 10)
            total_images = len(image_ids) + len(image_files)
            if total_images > upload_max:
                raise DRFValidationError({
                    'non_field_errors': [
                        FLOOR_PLAN_ERRORS["media_upload_limit_exceeded"].format(
                            max_items=upload_max,
                            total_items=total_images
                        )
                    ]
                })

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            floor_plan = serializer.save()

            if image_files or image_ids:
                FloorPlanMediaService.add_images_bulk(
                    floor_plan_id=floor_plan.id,
                    image_files=image_files,
                    image_ids=image_ids
                )
                floor_plan.refresh_from_db()

            floor_plan = RealEstateFloorPlan.objects.prefetch_related('images__image').get(id=floor_plan.id)
            detail_serializer = FloorPlanAdminDetailSerializer(floor_plan)

            return APIResponse.success(
                message=FLOOR_PLAN_SUCCESS["floor_plan_created"],
                data=detail_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except (DRFValidationError, ValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, FLOOR_PLAN_ERRORS["floor_plan_create_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS["slug_exists"],
                errors={'slug': [FLOOR_PLAN_ERRORS["slug_exists"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        try:
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            floor_plan = serializer.save()

            image_ids = self._extract_image_ids(request)
            if image_ids is not None:
                FloorPlanMediaService.sync_images(
                    floor_plan_id=floor_plan.id,
                    image_ids=image_ids
                )
                floor_plan.refresh_from_db()

            floor_plan = RealEstateFloorPlan.objects.prefetch_related('images__image').get(pk=floor_plan.pk)
            detail_serializer = FloorPlanAdminDetailSerializer(floor_plan)

            return APIResponse.success(
                message=FLOOR_PLAN_SUCCESS["floor_plan_updated"],
                data=detail_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except (DRFValidationError, ValidationError) as e:
            return APIResponse.error(
                message=extract_validation_message(e, FLOOR_PLAN_ERRORS["floor_plan_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS["slug_exists"],
                errors={'slug': [FLOOR_PLAN_ERRORS["slug_exists"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        
        instance = self.get_object()
        instance.delete()
        
        return APIResponse.success(
            message=FLOOR_PLAN_SUCCESS["floor_plan_deleted"],
            status_code=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'], url_path='add-images')
    def add_images(self, request, pk=None):
        
        floor_plan = self.get_object()
        
        image_ids = self._extract_image_ids(request)
        image_files = request.FILES.getlist('image_files')
        
        if not image_files and not image_ids:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS["image_id_required"],
                errors={'image_ids': [FLOOR_PLAN_ERRORS["image_id_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = FloorPlanMediaService.add_images_bulk(
                floor_plan_id=floor_plan.id,
                image_files=image_files,
                image_ids=image_ids
            )
            
            floor_plan.refresh_from_db()
            serializer = FloorPlanAdminDetailSerializer(floor_plan)
            
            return APIResponse.success(
                message=FLOOR_PLAN_SUCCESS["floor_plan_images_added"],
                data={
                    'floor_plan': serializer.data,
                    'created_count': result['created_count'],
                    'failed_ids': result['failed_ids'],
                    'failed_files': result['failed_files']
                },
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, FLOOR_PLAN_ERRORS["floor_plan_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='remove-image')
    def remove_image(self, request, pk=None):
        
        floor_plan = self.get_object()
        image_id = request.data.get('image_id')
        
        if not image_id:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS["image_id_required"],
                errors={'image_id': [FLOOR_PLAN_ERRORS["image_id_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success = FloorPlanMediaService.remove_image(
                floor_plan_id=floor_plan.id,
                image_id=image_id
            )
            
            if success:
                floor_plan.refresh_from_db()
                serializer = FloorPlanAdminDetailSerializer(floor_plan)
                
                return APIResponse.success(
                    message=FLOOR_PLAN_SUCCESS["floor_plan_image_removed"],
                    data=serializer.data,
                    status_code=status.HTTP_200_OK
                )
            else:
                return APIResponse.error(
                    message=FLOOR_PLAN_ERRORS["image_not_found_in_floor_plan"],
                    status_code=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, FLOOR_PLAN_ERRORS["floor_plan_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='set-main-image')
    def set_main_image(self, request, pk=None):
        
        floor_plan = self.get_object()
        image_id = request.data.get('image_id')
        
        if not image_id:
            return APIResponse.error(
                message=FLOOR_PLAN_ERRORS["image_id_required"],
                errors={'image_id': [FLOOR_PLAN_ERRORS["image_id_required"]]},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            FloorPlanMediaService.set_main_image(
                floor_plan_id=floor_plan.id,
                image_id=image_id
            )
            
            floor_plan.refresh_from_db()
            serializer = FloorPlanAdminDetailSerializer(floor_plan)
            
            return APIResponse.success(
                message=FLOOR_PLAN_SUCCESS["floor_plan_main_image_set"],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, FLOOR_PLAN_ERRORS["floor_plan_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='sync-images')
    def sync_images(self, request, pk=None):
        
        floor_plan = self.get_object()
        image_ids = self._extract_image_ids(request)
        main_image_id = request.data.get('main_image_id')
        
        try:
            result = FloorPlanMediaService.sync_images(
                floor_plan_id=floor_plan.id,
                image_ids=image_ids,
                main_image_id=main_image_id
            )
            
            floor_plan.refresh_from_db()
            serializer = FloorPlanAdminDetailSerializer(floor_plan)
            
            return APIResponse.success(
                message=FLOOR_PLAN_SUCCESS["floor_plan_images_synced"],
                data={
                    'floor_plan': serializer.data,
                    'removed_count': result['removed_count'],
                    'added_count': result['added_count'],
                    'total_count': result['total_count']
                },
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return APIResponse.error(
                message=extract_validation_message(e, FLOOR_PLAN_ERRORS["floor_plan_update_failed"]),
                errors=normalize_validation_error(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )
    
    def _extract_image_ids(self, request):
        
        import json
        
        image_ids = []
        image_ids_value = request.data.get('image_ids') or request.POST.get('image_ids')
        
        if not image_ids_value:
            return []
        
        if isinstance(image_ids_value, list):
            image_ids = [
                int(id) for id in image_ids_value 
                if isinstance(id, (int, str)) and str(id).isdigit()
            ]
        elif isinstance(image_ids_value, int):
            image_ids = [image_ids_value]
        elif isinstance(image_ids_value, str):
            if image_ids_value.strip().startswith('['):
                try:
                    parsed = json.loads(image_ids_value)
                    if isinstance(parsed, list):
                        image_ids = [
                            int(id) for id in parsed 
                            if isinstance(id, (int, str)) and str(id).isdigit()
                        ]
                except json.JSONDecodeError:
                    pass
            
            if not image_ids:
                image_ids = [
                    int(id.strip()) for id in image_ids_value.split(',') 
                    if id.strip().isdigit()
                ]
        
        return image_ids
