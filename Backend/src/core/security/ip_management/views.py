from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.core.cache import cache
from src.core.responses.response import APIResponse
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.access_control.classes import IsSuperAdmin
from src.core.security.messages import IP_MANAGEMENT_SUCCESS, IP_MANAGEMENT_ERRORS, IP_MANAGEMENT_DEFAULTS
from .service import IPBanService

class IPManagementViewSet(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsSuperAdmin]
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'نامشخص')

    def _get_actor_label(self, request):
        email = getattr(request.user, 'email', None)
        if email:
            return email

        mobile = getattr(request.user, 'mobile', None)
        if mobile:
            return mobile

        user_id = getattr(request.user, 'id', None)
        if user_id is not None:
            return f'user:{user_id}'

        return 'ادمین-نامشخص'
    
    @action(detail=False, methods=['get'])
    def banned_ips(self, request):
        try:
            banned_ips = cache.get(IPBanService.BAN_CACHE_KEY, {})
            
            banned_list = [
                {
                    'ip': ip,
                    'reason': info.get('reason', IP_MANAGEMENT_DEFAULTS['unknown_reason']),
                    'banned_at': info.get('banned_at', IP_MANAGEMENT_DEFAULTS['unknown_banned_at']),
                }
                for ip, info in banned_ips.items()
            ]
            
            return APIResponse.success(
                message=IP_MANAGEMENT_SUCCESS['banned_ips_retrieved'],
                data=banned_list
            )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['banned_ips_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def unban_ip(self, request):
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['ip_required'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            IPBanService.unban_ip(ip)
            IPBanService.reset_attempts(ip)
            
            return APIResponse.success(
                message=IP_MANAGEMENT_SUCCESS['ip_unbanned'].format(ip=ip)
            )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['ip_unban_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def ban_ip(self, request):
        try:
            ip = request.data.get('ip')
            reason = request.data.get('reason', IP_MANAGEMENT_DEFAULTS['manual_ban_reason'])
            
            if not ip:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['ip_required'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if IPBanService._is_whitelisted(ip):
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['ip_whitelisted_cannot_ban'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            actor = self._get_actor_label(request)
            final_reason = IP_MANAGEMENT_DEFAULTS['ban_reason_with_actor'].format(reason=reason, actor=actor)
            IPBanService.ban_ip(ip, reason=final_reason)
            
            return APIResponse.success(
                message=IP_MANAGEMENT_SUCCESS['ip_banned'].format(ip=ip)
            )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['ip_ban_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def attempts(self, request):
        try:
            ip = request.query_params.get('ip')
            if not ip:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['ip_required'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            attempts = IPBanService.get_attempts(ip)
            is_banned = IPBanService.is_banned(ip)
            
            return APIResponse.success(
                message=IP_MANAGEMENT_SUCCESS['attempts_retrieved'],
                data={
                    'ip': ip,
                    'attempts': attempts,
                    'is_banned': is_banned,
                    'max_attempts': IPBanService.MAX_ATTEMPTS
                }
            )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['attempts_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def whitelist(self, request):
        try:
            whitelist = IPBanService.get_whitelist()
            
            return APIResponse.success(
                message=IP_MANAGEMENT_SUCCESS['whitelist_retrieved'],
                data=whitelist
            )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['whitelist_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def add_to_whitelist(self, request):
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['ip_required'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            import ipaddress
            try:
                ipaddress.ip_address(ip)
            except ValueError:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['invalid_ip'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if IPBanService.add_to_whitelist(ip):
                if IPBanService.is_banned(ip):
                    IPBanService.unban_ip(ip)
                    IPBanService.reset_attempts(ip)

                return APIResponse.success(
                    message=IP_MANAGEMENT_SUCCESS['ip_whitelist_added'].format(ip=ip)
                )
            else:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['ip_already_whitelisted'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['ip_whitelist_add_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def remove_from_whitelist(self, request):
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['ip_required'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            client_ip = self._get_client_ip(request)
            if ip == client_ip:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['cannot_remove_current_ip'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if IPBanService.remove_from_whitelist(ip):
                return APIResponse.success(
                    message=IP_MANAGEMENT_SUCCESS['ip_whitelist_removed'].format(ip=ip)
                )
            else:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['ip_not_in_whitelist'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['ip_whitelist_remove_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def add_current_ip_to_whitelist(self, request):
        try:
            client_ip = self._get_client_ip(request)
            
            if IPBanService.add_to_whitelist(client_ip):
                if IPBanService.is_banned(client_ip):
                    IPBanService.unban_ip(client_ip)
                    IPBanService.reset_attempts(client_ip)
                
                return APIResponse.success(
                    message=IP_MANAGEMENT_SUCCESS['current_ip_whitelist_added'].format(ip=client_ip)
                )
            else:
                return APIResponse.error(
                    message=IP_MANAGEMENT_ERRORS['current_ip_already_whitelisted'],
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['current_ip_whitelist_add_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def current_ip(self, request):
        try:
            client_ip = self._get_client_ip(request)
            is_banned = IPBanService.is_banned(client_ip)
            is_whitelisted = IPBanService._is_whitelisted(client_ip)
            attempts = IPBanService.get_attempts(client_ip)
            
            return APIResponse.success(
                message=IP_MANAGEMENT_SUCCESS['current_ip_retrieved'],
                data={
                    'ip': client_ip,
                    'is_banned': is_banned,
                    'is_whitelisted': is_whitelisted,
                    'attempts': attempts,
                    'max_attempts': IPBanService.MAX_ATTEMPTS
                }
            )
        except Exception as e:
            return APIResponse.error(
                message=IP_MANAGEMENT_ERRORS['current_ip_retrieve_failed'],
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

