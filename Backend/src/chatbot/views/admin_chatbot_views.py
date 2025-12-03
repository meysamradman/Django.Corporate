from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from src.core.responses.response import APIResponse
from src.chatbot.models.faq import FAQ
from src.chatbot.models.settings import ChatbotSettings
from src.chatbot.serializers.faq_serializer import FAQSerializer, FAQListSerializer
from src.chatbot.serializers.settings_serializer import ChatbotSettingsSerializer
from src.chatbot.services.rule_based_service import RuleBasedChatService
from src.chatbot.messages.messages import CHATBOT_SUCCESS, CHATBOT_ERRORS
from src.user.authorization.admin_permission import RequirePermission


class AdminFAQViewSet(viewsets.ModelViewSet):
    serializer_class = FAQSerializer
    
    def get_permissions(self):
        return [RequirePermission('chatbot.manage')]
    
    def get_queryset(self):
        return FAQ.objects.all().order_by('order', '-created_at')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FAQListSerializer
        return FAQSerializer
    
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        RuleBasedChatService.clear_cache()
        if response.status_code == status.HTTP_201_CREATED:
            return APIResponse.success(
                message=CHATBOT_SUCCESS['faq_created'],
                data=response.data,
                status_code=status.HTTP_201_CREATED
            )
        return response
    
    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        RuleBasedChatService.clear_cache()
        if response.status_code == status.HTTP_200_OK:
            return APIResponse.success(
                message=CHATBOT_SUCCESS['faq_updated'],
                data=response.data,
                status_code=status.HTTP_200_OK
            )
        return response
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        super().destroy(request, *args, **kwargs)
        RuleBasedChatService.clear_cache()
        return APIResponse.success(
            message=CHATBOT_SUCCESS['faq_deleted'],
            status_code=status.HTTP_200_OK
        )


class AdminChatbotSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = ChatbotSettingsSerializer
    
    def get_permissions(self):
        return [RequirePermission('chatbot.manage')]
    
    def get_queryset(self):
        return ChatbotSettings.objects.all()
    
    def list(self, request, *args, **kwargs):
        settings = self.get_queryset().first()
        if not settings:
            settings = ChatbotSettings.objects.create()
        
        serializer = self.get_serializer(settings)
        return APIResponse.success(
            message=CHATBOT_SUCCESS.get('settings_retrieved', CHATBOT_SUCCESS.get('settings_updated', '')),
            data=serializer.data
        )
    
    @action(detail=False, methods=['put', 'patch'], url_path='update')
    def update_settings(self, request, *args, **kwargs):
        instance = self.get_queryset().first()
        if not instance:
            instance = ChatbotSettings.objects.create()
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        RuleBasedChatService.clear_cache()
        
        return APIResponse.success(
            message=CHATBOT_SUCCESS['settings_updated'],
            data=serializer.data
        )

