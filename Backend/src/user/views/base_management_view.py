from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from src.core.responses import APIResponse
from src.core.pagination.pagination import StandardLimitPagination
from functools import cached_property
from src.user.messages import AUTH_SUCCESS, AUTH_ERRORS

class BaseManagementView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardLimitPagination
    serializer_class = None
    service_class = None
    filter_serializer_class = None
    create_serializer_class = None

    @cached_property
    def current_user(self):
        return self.request.user

    def get(self, request, user_id=None):

        if user_id:
            try:
                user = self.service_class.get_user_detail(user_id)
                serializer = self.serializer_class(user, context={'request': request})
                return APIResponse.success(
                    message=AUTH_SUCCESS["user_retrieved_successfully"],
                    data=serializer.data
                )
            except Exception as e:
                return APIResponse.error(message=str(e))

        filter_serializer = self.filter_serializer_class(data=request.query_params)
        if not filter_serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=filter_serializer.errors
            )

        search_value = request.query_params.get('search')

        queryset = self.service_class.get_users_list(
            search=search_value,
            is_active=filter_serializer.validated_data.get('is_active'),
            request=request
        )

        if isinstance(queryset, tuple):
            queryset = queryset[0]

        paginator = self.pagination_class()
        paginated_data = paginator.paginate_queryset(queryset, request)
        serializer = self.serializer_class(paginated_data, many=True, context={'request': request})
        
        # Return paginated response using DRF's standard pagination response
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):

        if not self.create_serializer_class:
            return APIResponse.error(message=AUTH_ERRORS["create_operation_not_supported"])
            
        serializer = self.create_serializer_class(data=request.data, context={'admin_user': self.current_user, 'request': request})
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )

        try:
            # Use BaseRegisterService for creating users
            from src.user.services import BaseRegisterService
            user = BaseRegisterService.register_user_from_serializer(
                validated_data=serializer.validated_data,
                admin_user=self.current_user
            )
            response_serializer = self.serializer_class(user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_created_successfully"],
                data=response_serializer.data
            )
        except Exception as e:
            return APIResponse.error(message=str(e))

    def put(self, request, user_id):

        serializer = self.serializer_class(data=request.data, context={'user_id': user_id, 'admin_user': self.current_user, 'request': request})
        if not serializer.is_valid():
            return APIResponse.error(
                message=AUTH_ERRORS["auth_validation_error"],
                errors=serializer.errors
            )

        try:
            user = self.service_class.update_user(user_id, serializer.validated_data, self.current_user)
            response_serializer = self.serializer_class(user, context={'request': request})
            return APIResponse.success(
                message=AUTH_SUCCESS["user_updated_successfully"],
                data=response_serializer.data
            )
        except Exception as e:
            return APIResponse.error(message=str(e))

    def delete(self, request, user_id):

        try:
            self.service_class.delete_user(user_id)
            return APIResponse.success(message=AUTH_SUCCESS["user_deleted_successfully"])
        except Exception as e:
            return APIResponse.error(message=str(e))
