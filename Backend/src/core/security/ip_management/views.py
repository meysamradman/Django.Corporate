"""
IP Management Views
ViewSet برای مدیریت IP Ban و Whitelist در پنل ادمین
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from src.core.responses.response import APIResponse
from src.user.auth.admin_session_auth import CSRFExemptSessionAuthentication
from src.user.access_control.classes import IsSuperAdmin
from .service import IPBanService
import logging

logger = logging.getLogger('security')


class IPManagementViewSet(viewsets.ViewSet):
    """
    مدیریت IP Ban و Whitelist (فقط Super Admin)
    """
    authentication_classes = [CSRFExemptSessionAuthentication]
    permission_classes = [IsSuperAdmin]
    
    def _get_client_ip(self, request):
        """دریافت IP واقعی کاربر"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'Unknown')
    
    @action(detail=False, methods=['get'])
    def banned_ips(self, request):
        """لیست IPهای ban شده"""
        try:
            banned_ips = cache.get(IPBanService.BAN_CACHE_KEY, {})
            
            # تبدیل به لیست برای نمایش
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
            logger.error(f"Error getting banned IPs: {e}")
            return APIResponse.error(
                message="خطا در دریافت لیست IPهای ban شده",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def unban_ip(self, request):
        """رفع ban یک IP"""
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            IPBanService.unban_ip(ip)
            IPBanService.reset_attempts(ip)
            
            logger.info(f"✅ IP UNBANNED by admin: {ip} | Admin: {request.user.email}")
            
            return APIResponse.success(
                message=f"IP {ip} از ban خارج شد"
            )
        except Exception as e:
            logger.error(f"Error unbanning IP: {e}")
            return APIResponse.error(
                message="خطا در رفع ban IP",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def ban_ip(self, request):
        """Ban کردن یک IP دستی"""
        try:
            ip = request.data.get('ip')
            reason = request.data.get('reason', 'Manual ban by admin')
            
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # چک کردن whitelist
            if IPBanService._is_whitelisted(ip):
                return APIResponse.error(
                    message="این IP در whitelist است و نمی‌توان ban کرد",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            IPBanService.ban_ip(ip, reason=f"{reason} (by {request.user.email})")
            
            logger.warning(f"🚫 IP MANUALLY BANNED: {ip} | Reason: {reason} | Admin: {request.user.email}")
            
            return APIResponse.success(
                message=f"IP {ip} ban شد"
            )
        except Exception as e:
            logger.error(f"Error banning IP: {e}")
            return APIResponse.error(
                message="خطا در ban کردن IP",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def attempts(self, request):
        """دریافت تعداد تلاش‌های یک IP"""
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
            logger.error(f"Error getting IP attempts: {e}")
            return APIResponse.error(
                message="خطا در دریافت اطلاعات IP",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def whitelist(self, request):
        """لیست IPهای whitelist"""
        try:
            whitelist = IPBanService.get_whitelist()
            
            return APIResponse.success(
                message="Whitelist IPs retrieved successfully",
                data=whitelist
            )
        except Exception as e:
            logger.error(f"Error getting whitelist: {e}")
            return APIResponse.error(
                message="خطا در دریافت لیست whitelist",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def add_to_whitelist(self, request):
        """اضافه کردن IP به whitelist"""
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # اعتبارسنجی IP
            import ipaddress
            try:
                ipaddress.ip_address(ip)
            except ValueError:
                return APIResponse.error(
                    message="IP address نامعتبر است",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if IPBanService.add_to_whitelist(ip):
                # اگر ban شده بود، unban کن
                if IPBanService.is_banned(ip):
                    IPBanService.unban_ip(ip)
                    IPBanService.reset_attempts(ip)
                
                logger.info(f"✅ IP ADDED TO WHITELIST by admin: {ip} | Admin: {request.user.email}")
                
                return APIResponse.success(
                    message=f"IP {ip} به whitelist اضافه شد"
                )
            else:
                return APIResponse.error(
                    message="این IP قبلاً در whitelist است",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Error adding IP to whitelist: {e}")
            return APIResponse.error(
                message="خطا در اضافه کردن IP به whitelist",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def remove_from_whitelist(self, request):
        """حذف IP از whitelist"""
        try:
            ip = request.data.get('ip')
            if not ip:
                return APIResponse.error(
                    message="IP address is required",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            # چک کردن IP فعلی admin
            client_ip = self._get_client_ip(request)
            if ip == client_ip:
                return APIResponse.error(
                    message="شما نمی‌توانید IP فعلی خود را از whitelist حذف کنید",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            if IPBanService.remove_from_whitelist(ip):
                logger.warning(f"⚠️ IP REMOVED FROM WHITELIST by admin: {ip} | Admin: {request.user.email}")
                
                return APIResponse.success(
                    message=f"IP {ip} از whitelist حذف شد"
                )
            else:
                return APIResponse.error(
                    message="این IP در whitelist نیست",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Error removing IP from whitelist: {e}")
            return APIResponse.error(
                message="خطا در حذف IP از whitelist",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def add_current_ip_to_whitelist(self, request):
        """اضافه کردن IP فعلی به whitelist"""
        try:
            client_ip = self._get_client_ip(request)
            
            if IPBanService.add_to_whitelist(client_ip):
                # اگر ban شده بود، unban کن
                if IPBanService.is_banned(client_ip):
                    IPBanService.unban_ip(client_ip)
                    IPBanService.reset_attempts(client_ip)
                
                logger.info(f"✅ CURRENT IP ADDED TO WHITELIST: {client_ip} | Admin: {request.user.email}")
                
                return APIResponse.success(
                    message=f"IP فعلی شما ({client_ip}) به whitelist اضافه شد"
                )
            else:
                return APIResponse.error(
                    message="IP فعلی شما قبلاً در whitelist است",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            logger.error(f"Error adding current IP to whitelist: {e}")
            return APIResponse.error(
                message="خطا در اضافه کردن IP فعلی به whitelist",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def current_ip(self, request):
        """نمایش IP فعلی"""
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
            logger.error(f"Error getting current IP: {e}")
            return APIResponse.error(
                message="خطا در دریافت IP فعلی",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

