from rest_framework import viewsets, status
from rest_framework.decorators import action

from src.core.responses.response import APIResponse
from src.chatbot.models.faq import FAQ
from src.chatbot.models.settings import ChatbotSettings
from src.chatbot.serializers.admin import FAQSerializer, FAQListSerializer, ChatbotSettingsSerializer
from src.chatbot.messages.messages import CHATBOT_SUCCESS, CHATBOT_ERRORS
from src.user.access_control import PermissionRequiredMixin

class AdminFAQViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    serializer_class = FAQSerializer

    permission_map = {
        'list': 'chatbot.manage',
        'retrieve': 'chatbot.manage',
        'create': 'chatbot.manage',
        'update': 'chatbot.manage',
        'partial_update': 'chatbot.manage',
        'destroy': 'chatbot.manage',
    }
    permission_denied_message = CHATBOT_ERRORS['permission_denied']

    def get_queryset(self):
        return FAQ.objects.all().order_by('order', '-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return FAQListSerializer
        return FAQSerializer

    def list(self, request, *args, **kwargs):
        from src.chatbot.services.admin.chatbot_service import ChatbotAdminService

        data, is_cached = ChatbotAdminService.get_faq_list()

        if is_cached:
            return APIResponse.success(
                message=CHATBOT_SUCCESS['faq_list_retrieved'],
                data=data,
                status_code=status.HTTP_200_OK
            )

        response = super().list(request, *args, **kwargs)
        if hasattr(response, 'data'):
            ChatbotAdminService.cache_faq_list(response.data)
        return response

    def perform_create(self, serializer):
        from src.chatbot.services.admin.chatbot_service import ChatbotAdminService
        super().perform_create(serializer)
        ChatbotAdminService.invalidate_chatbot_cache()

    def perform_update(self, serializer):
        from src.chatbot.services.admin.chatbot_service import ChatbotAdminService
        super().perform_update(serializer)
        ChatbotAdminService.invalidate_chatbot_cache()

    def perform_destroy(self, instance):
        from src.chatbot.services.admin.chatbot_service import ChatbotAdminService
        super().perform_destroy(instance)
        ChatbotAdminService.invalidate_chatbot_cache()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            return APIResponse.success(
                message=CHATBOT_SUCCESS['faq_created'],
                data=response.data,
                status_code=status.HTTP_201_CREATED
            )
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            return APIResponse.success(
                message=CHATBOT_SUCCESS['faq_updated'],
                data=response.data,
                status_code=status.HTTP_200_OK
            )
        return response

    def destroy(self, request, *args, **kwargs):
        super().destroy(request, *args, **kwargs)
        return APIResponse.success(
            message=CHATBOT_SUCCESS['faq_deleted'],
            status_code=status.HTTP_200_OK
        )

class AdminChatbotSettingsViewSet(PermissionRequiredMixin, viewsets.ModelViewSet):
    serializer_class = ChatbotSettingsSerializer

    permission_map = {
        'list': 'chatbot.manage',
        'retrieve': 'chatbot.manage',
        'create': 'chatbot.manage',
        'update': 'chatbot.manage',
        'partial_update': 'chatbot.manage',
        'destroy': 'chatbot.manage',
        'update_settings': 'chatbot.manage',
    }
    permission_denied_message = CHATBOT_ERRORS['permission_denied']

    def get_queryset(self):
        return ChatbotSettings.objects.all()

    def list(self, request, *args, **kwargs):
        from src.chatbot.services.admin.chatbot_service import ChatbotAdminService

        data, is_cached = ChatbotAdminService.get_settings()

        if is_cached:
            return APIResponse.success(
                message=CHATBOT_SUCCESS['settings_retrieved'],
                data=data,
                status_code=status.HTTP_200_OK
            )

        serializer = self.get_serializer(data)
        serialized_data = serializer.data
        ChatbotAdminService.cache_settings(serialized_data)

        return APIResponse.success(
            message=CHATBOT_SUCCESS['settings_retrieved'],
            data=serialized_data,
            status_code=status.HTTP_200_OK
        )

    @action(detail=False, methods=['put', 'patch'], url_path='update')
    def update_settings(self, request, *args, **kwargs):
        from src.chatbot.services.admin.chatbot_service import ChatbotAdminService

        instance = self.get_queryset().first()
        if not instance:
            instance = ChatbotSettings.objects.create()

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        ChatbotAdminService.update_settings(instance, serializer.validated_data)

        return APIResponse.success(
            message=CHATBOT_SUCCESS['settings_updated'],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )

__all__ = [
    'AdminFAQViewSet',
    'AdminChatbotSettingsViewSet',
]
