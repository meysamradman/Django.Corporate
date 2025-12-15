from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.core.exceptions import ValidationError
from .models import FeatureFlag
from .services import get_all_feature_flags, invalidate_feature_flag_cache
from .serializers import FeatureFlagSerializer, FeatureFlagListSerializer
from .messages.messages import FEATURE_FLAG_SUCCESS, FEATURE_FLAG_ERRORS
from .feature_config import FEATURE_CONFIG, get_module_to_feature_flag
from src.user.access_control import RequirePermission
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.core.responses.response import APIResponse


@api_view(['GET'])
@permission_classes([AllowAny])
def feature_flags_api(request):
    flags = get_all_feature_flags()
    return Response(flags)


@api_view(['GET'])
@permission_classes([AllowAny])
def feature_flag_detail(request, key):
    from .services import is_feature_active
    return Response({
        'key': key,
        'is_active': is_feature_active(key)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def feature_config_api(request):
    return Response({
        'features': FEATURE_CONFIG,
        'module_to_feature_flag': get_module_to_feature_flag()
    })


class FeatureFlagAdminViewSet(viewsets.ModelViewSet):
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    authentication_classes = [CSRFExemptSessionAuthentication]
    lookup_field = 'key'
    lookup_url_kwarg = 'key'
    
    def get_permissions(self):
        return [RequirePermission('settings.manage')]
    
    def get_queryset(self):
        return FeatureFlag.objects.all().order_by('key')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FeatureFlagListSerializer
        return FeatureFlagSerializer
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return APIResponse.success(
                message=FEATURE_FLAG_SUCCESS['flag_list_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except Exception:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return APIResponse.success(
                message=FEATURE_FLAG_SUCCESS['flag_retrieved'],
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except FeatureFlag.DoesNotExist:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            instance = serializer.save()
            invalidate_feature_flag_cache(instance.key)
            
            response_serializer = FeatureFlagSerializer(instance)
            return APIResponse.success(
                message=FEATURE_FLAG_SUCCESS['flag_created'],
                data=response_serializer.data,
                status_code=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            error_msg = str(e)
            if "duplicate" in error_msg.lower() or "unique" in error_msg.lower():
                message = FEATURE_FLAG_ERRORS['duplicate_key']
            elif "invalid" in error_msg.lower():
                message = FEATURE_FLAG_ERRORS['invalid_key']
            else:
                message = FEATURE_FLAG_ERRORS['flag_create_failed']
            
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            error_msg = str(e)
            if 'unique' in error_msg.lower() or 'duplicate' in error_msg.lower():
                return APIResponse.error(
                    message=FEATURE_FLAG_ERRORS['duplicate_key'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_create_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            
            updated_instance = serializer.save()
            invalidate_feature_flag_cache(updated_instance.key)
            
            response_serializer = FeatureFlagSerializer(updated_instance)
            return APIResponse.success(
                message=FEATURE_FLAG_SUCCESS['flag_updated'],
                data=response_serializer.data,
                status_code=status.HTTP_200_OK
            )
        except FeatureFlag.DoesNotExist:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            error_msg = str(e)
            if "duplicate" in error_msg.lower() or "unique" in error_msg.lower():
                message = FEATURE_FLAG_ERRORS['duplicate_key']
            elif "invalid" in error_msg.lower():
                message = FEATURE_FLAG_ERRORS['invalid_key']
            else:
                message = FEATURE_FLAG_ERRORS['flag_update_failed']
            
            return APIResponse.error(
                message=message,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_update_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            key = instance.key
            instance.delete()
            invalidate_feature_flag_cache(key)
            
            return APIResponse.success(
                message=FEATURE_FLAG_SUCCESS['flag_deleted'],
                status_code=status.HTTP_200_OK
            )
        except FeatureFlag.DoesNotExist:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_delete_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def toggle(self, request, key=None):
        try:
            feature_flag = self.get_object()
            feature_flag.is_active = not feature_flag.is_active
            feature_flag.save()
            invalidate_feature_flag_cache(feature_flag.key)
            
            serializer = self.get_serializer(feature_flag)
            message = FEATURE_FLAG_SUCCESS['flag_activated'] if feature_flag.is_active else FEATURE_FLAG_SUCCESS['flag_deactivated']
            
            return APIResponse.success(
                message=message,
                data=serializer.data,
                status_code=status.HTTP_200_OK
            )
        except FeatureFlag.DoesNotExist:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_not_found'],
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception:
            return APIResponse.error(
                message=FEATURE_FLAG_ERRORS['flag_update_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
