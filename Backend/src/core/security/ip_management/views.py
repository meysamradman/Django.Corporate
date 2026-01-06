from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from src.core.responses.response import APIResponse
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.access_control.classes import IsSuperAdmin
from .service import IPBanService


class IPManagementViewSet(viewsets.ViewSet):
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsSuperAdmin]
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')
    
    @action(detail=False, methods=['get'])
    def banned_ips(self, request):
        try:
            banned_ips = cache.get(IPBanService.BAN_CACHE_KEY, {})
            
            banned_list = [
                {
                    'ip': ip,
                    'reason': info.get('reason', 'Unknown'),
                    'banned_at': info.get('banned_at', 'Unknown'),
                }
                for ip, info in banned_ips.items()
            ]
            
            return APIResponse.success(
                message="Banned IPs retrieved successfully",
                data=banned_list
            )
        except Exception as e:
            return APIResponse.error(
                message="خطا در دریافت لیست IPهای ban شده",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def unban_ip(self, request):
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            IPBanService.unban_ip(ip)
            IPBanService.reset_attempts(ip)
            
            return APIResponse.success(
                message=f"IP {ip} از ban خارج شد"
            )
        except Exception as e:
            return APIResponse.error(
                message="خطا در رفع ban IP",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def ban_ip(self, request):
        try:
            ip = request.data.get('ip')
            reason = request.data.get('reason', 'Manual ban by admin')
            
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if IPBanService._is_whitelisted(ip):
                return APIResponse.error(
                    message="این IP در whitelist است و نمی‌توان ban کرد",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            IPBanService.ban_ip(ip, reason=f"{reason} (by {request.user.email})")
            
            return APIResponse.success(
                message=f"IP {ip} ban شد"
            )
        except Exception as e:
            return APIResponse.error(
                message="خطا در ban کردن IP",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def attempts(self, request):
        try:
            ip = request.query_params.get('ip')
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            attempts = IPBanService.get_attempts(ip)
            is_banned = IPBanService.is_banned(ip)
            
            return APIResponse.success(
                message="IP attempts retrieved",
                data={
                    'ip': ip,
                    'attempts': attempts,
                    'is_banned': is_banned,
                    'max_attempts': IPBanService.MAX_ATTEMPTS
                }
            )
        except Exception as e:
            return APIResponse.error(
                message="خطا در دریافت اطلاعات IP",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def whitelist(self, request):
        try:
            whitelist = IPBanService.get_whitelist()
            
            return APIResponse.success(
                message="Whitelist IPs retrieved successfully",
                data=whitelist
            )
        except Exception as e:
            return APIResponse.error(
                message="خطا در دریافت لیست whitelist",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def add_to_whitelist(self, request):
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            import ipaddress
            try:
                ipaddress.ip_address(ip)
            except ValueError:
                return APIResponse.error(
                    message="IP address نامعتبر است",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if IPBanService.add_to_whitelist(ip):
                if IPBanService.is_banned(ip):
                    IPBanService.unban_ip(ip)
                    IPBanService.reset_attempts(ip)
                
                
                return APIResponse.success(
                    message=f"IP {ip} به whitelist اضافه شد"
                )
            else:
                return APIResponse.error(
                    message="این IP قبلاً در whitelist است",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return APIResponse.error(
                message="خطا در اضافه کردن IP به whitelist",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def remove_from_whitelist(self, request):
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            client_ip = self._get_client_ip(request)
            if ip == client_ip:
                return APIResponse.error(
                    message="شما نمی‌توانید IP فعلی خود را از whitelist حذف کنید",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if IPBanService.remove_from_whitelist(ip):
                return APIResponse.success(
                    message=f"IP {ip} از whitelist حذف شد"
                )
            else:
                return APIResponse.error(
                    message="این IP در whitelist نیست",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return APIResponse.error(
                message="خطا در حذف IP از whitelist",
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
                    message=f"IP فعلی شما ({client_ip}) به whitelist اضافه شد"
                )
            else:
                return APIResponse.error(
                    message="IP فعلی شما قبلاً در whitelist است",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return APIResponse.error(
                message="خطا در اضافه کردن IP فعلی به whitelist",
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
                message="Current IP retrieved",
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
                message="خطا در دریافت IP فعلی",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

