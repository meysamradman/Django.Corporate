from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from django.core.cache import cache

from src.core.responses.response import APIResponse
from src.chatbot.services.public.chatbot_service import RuleBasedChatService
from src.chatbot.messages.messages import CHATBOT_SUCCESS, CHATBOT_ERRORS


class PublicChatbotViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def _rate_limit_check(self, ip_address: str, limit: int) -> bool:
        cache_key = f"chatbot:rate_limit:{ip_address}"
        requests = cache.get(cache_key, 0)
        if requests >= limit:
            return False
        cache.set(cache_key, requests + 1, 60)
        return True

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip

    @action(detail=False, methods=['post'], url_path='send-message')
    def send_message(self, request):
        settings = RuleBasedChatService.get_settings()
        if not settings.is_enabled:
            return APIResponse.error(
                message=CHATBOT_ERRORS['chatbot_disabled'],
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        ip_address = self._get_client_ip(request)
        if not self._rate_limit_check(ip_address, settings.rate_limit_per_minute):
            return APIResponse.error(
                message=CHATBOT_ERRORS['rate_limit_exceeded'],
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )

        message = request.data.get('message', '').strip()
        if not message:
            return APIResponse.error(
                message=CHATBOT_ERRORS['invalid_message'],
                status_code=status.HTTP_400_BAD_REQUEST
            )

        result = RuleBasedChatService.find_answer(message)

        if result:
            return APIResponse.success(
                message=CHATBOT_SUCCESS['message_sent'],
                data={'reply': result['answer'], 'source': result['source']},
                status_code=status.HTTP_200_OK
            )

        return APIResponse.success(
            message=CHATBOT_SUCCESS['message_sent'],
            data={'reply': settings.default_message, 'source': 'default'},
            status_code=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='settings')
    def get_settings(self, request):
        settings = RuleBasedChatService.get_settings()
        if not settings.is_enabled:
            return APIResponse.error(
                message=CHATBOT_ERRORS['chatbot_disabled'],
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return APIResponse.success(
            message=CHATBOT_SUCCESS.get('settings_retrieved', 'Settings retrieved successfully.'),
            data={'is_enabled': settings.is_enabled, 'welcome_message': settings.welcome_message},
            status_code=status.HTTP_200_OK
        )


__all__ = [
    'PublicChatbotViewSet',
]
