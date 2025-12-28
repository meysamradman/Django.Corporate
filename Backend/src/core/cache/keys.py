from typing import Optional, Any
from .namespaces import CacheNamespace
import hashlib
import json


class CacheKeyBuilder:
    
    @staticmethod
    def _build(namespace: str, *parts: Any) -> str:
        key_parts = [namespace] + [str(part) for part in parts if part is not None]
        return ":".join(key_parts)
    
    @staticmethod
    def admin_session(session_key: str) -> str:
        return CacheKeyBuilder._build(CacheNamespace.ADMIN_SESSION, session_key)
    
    @staticmethod
    def user_session(session_key: str) -> str:
        return CacheKeyBuilder._build(CacheNamespace.USER_SESSION, session_key)
    
    @staticmethod
    def otp(mobile: str) -> str:
        return CacheKeyBuilder._build(CacheNamespace.OTP, mobile)
    
    @staticmethod
    def captcha(captcha_id: str) -> str:
        return CacheKeyBuilder._build(CacheNamespace.CAPTCHA, captcha_id)
    
    @staticmethod
    def user_permissions(user_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.USER_PERMISSIONS, user_id)
    
    @staticmethod
    def user_profile(user_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.USER_PROFILE, user_id)
    
    @staticmethod
    def user_modules(user_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.USER_MODULES, user_id)
    
    @staticmethod
    def admin_permissions(user_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.ADMIN_PERMISSIONS, user_id)
    
    @staticmethod
    def admin_roles(user_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.ADMIN_ROLES, user_id)
    
    @staticmethod
    def admin_profile(user_id: int, profile_type: str = "full") -> str:
        return CacheKeyBuilder._build(CacheNamespace.ADMIN_PROFILE, user_id, profile_type)
    
    @staticmethod
    def admin_info(user_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.ADMIN_INFO, user_id)
    
    @staticmethod
    def admin_perm_check(user_id: int, method: str, view_name: str) -> str:
        return CacheKeyBuilder._build(CacheNamespace.ADMIN_PERMISSIONS, user_id, method, view_name)
    
    @staticmethod
    def portfolio_list(page: Optional[int] = None, filters: Optional[str] = None) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_LIST, page, filters)
    
    @staticmethod
    def portfolio_detail(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_DETAIL, portfolio_id)
    
    @staticmethod
    def portfolio_seo() -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_SEO)
    
    @staticmethod
    def blog_list(page: Optional[int] = None, filters: Optional[str] = None) -> str:
        return CacheKeyBuilder._build(CacheNamespace.BLOG_LIST, page, filters)
    
    @staticmethod
    def blog_detail(blog_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.BLOG_DETAIL, blog_id)
    
    @staticmethod
    def media_file(file_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.MEDIA_FILE, file_id)
    
    @staticmethod
    def media_list(page: Optional[int] = None) -> str:
        return CacheKeyBuilder._build(CacheNamespace.MEDIA_LIST, page)
    
    @staticmethod
    def permission_map() -> str:
        return CacheNamespace.PERMISSION_MAP
    
    @staticmethod
    def permission_display(perm: str) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PERMISSION_DISPLAY, perm)
    
    @staticmethod
    def pattern(namespace: str) -> str:
        return f"{namespace}:*"
    
    @staticmethod
    def user_all_keys(user_id: int) -> list[str]:
        return [
            CacheKeyBuilder.user_permissions(user_id),
            CacheKeyBuilder.user_profile(user_id),
            CacheKeyBuilder.user_modules(user_id),
            CacheKeyBuilder.admin_permissions(user_id),
            CacheKeyBuilder.admin_roles(user_id),
            CacheKeyBuilder.admin_info(user_id),
            CacheKeyBuilder.admin_profile(user_id, "full"),
            CacheKeyBuilder.admin_profile(user_id, "super"),
            CacheKeyBuilder.admin_profile(user_id, "regular"),
        ]
    
    @staticmethod
    def _hash_params(params: dict) -> str:
        params_str = json.dumps(params, sort_keys=True)
        return hashlib.md5(params_str.encode()).hexdigest()[:8]
    
    @staticmethod
    def portfolio_list_admin(params: dict) -> str:
        params_hash = CacheKeyBuilder._hash_params(params)
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_LIST, "admin", params_hash)
    
    @staticmethod
    def portfolio_main_image(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_DETAIL, portfolio_id, "main_image")
    
    @staticmethod
    def portfolio_seo_data(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_SEO, portfolio_id, "data")
    
    @staticmethod
    def portfolio_seo_preview(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_SEO, portfolio_id, "preview")
    
    @staticmethod
    def portfolio_seo_completeness(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_SEO, portfolio_id, "completeness")
    
    @staticmethod
    def portfolio_structured_data(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_DETAIL, portfolio_id, "structured")
    
    @staticmethod
    def portfolio_main_image_details(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_DETAIL, portfolio_id, "main_image_details")
    
    @staticmethod
    def portfolio_media_list(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_DETAIL, portfolio_id, "media_list")
    
    @staticmethod
    def portfolio_media_detail(portfolio_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.PORTFOLIO_DETAIL, portfolio_id, "media_detail")
    
    @staticmethod
    def portfolio_all_keys(portfolio_id: int) -> list[str]:
        return [
            CacheKeyBuilder.portfolio_detail(portfolio_id),
            CacheKeyBuilder.portfolio_main_image(portfolio_id),
            CacheKeyBuilder.portfolio_seo_data(portfolio_id),
            CacheKeyBuilder.portfolio_seo_preview(portfolio_id),
            CacheKeyBuilder.portfolio_seo_completeness(portfolio_id),
            CacheKeyBuilder.portfolio_structured_data(portfolio_id),
            CacheKeyBuilder.portfolio_main_image_details(portfolio_id),
            CacheKeyBuilder.portfolio_media_list(portfolio_id),
            CacheKeyBuilder.portfolio_media_detail(portfolio_id),
        ]
    
    @staticmethod
    def blog_list_admin(params: dict) -> str:
        params_hash = CacheKeyBuilder._hash_params(params)
        return CacheKeyBuilder._build(CacheNamespace.BLOG_LIST, "admin", params_hash)
    
    @staticmethod
    def blog_main_image(blog_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.BLOG_DETAIL, blog_id, "main_image")
    
    @staticmethod
    def blog_seo_data(blog_id: int) -> str:
        return CacheKeyBuilder._build("blog:seo", blog_id, "data")
    
    @staticmethod
    def blog_seo_preview(blog_id: int) -> str:
        return CacheKeyBuilder._build("blog:seo", blog_id, "preview")
    
    @staticmethod
    def blog_seo_completeness(blog_id: int) -> str:
        return CacheKeyBuilder._build("blog:seo", blog_id, "completeness")
    
    @staticmethod
    def blog_structured_data(blog_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.BLOG_DETAIL, blog_id, "structured")
    
    @staticmethod
    def blog_all_keys(blog_id: int) -> list[str]:
        return [
            CacheKeyBuilder.blog_detail(blog_id),
            CacheKeyBuilder.blog_main_image(blog_id),
            CacheKeyBuilder.blog_seo_data(blog_id),
            CacheKeyBuilder.blog_seo_preview(blog_id),
            CacheKeyBuilder.blog_seo_completeness(blog_id),
            CacheKeyBuilder.blog_structured_data(blog_id),
            CacheKeyBuilder._build(CacheNamespace.BLOG_DETAIL, blog_id, "main_image_details"),
            CacheKeyBuilder._build(CacheNamespace.BLOG_DETAIL, blog_id, "media_list"),
            CacheKeyBuilder._build(CacheNamespace.BLOG_DETAIL, blog_id, "media_detail"),
        ]
    
    @staticmethod
    def ai_provider(slug: str) -> str:
        return CacheKeyBuilder._build(CacheNamespace.AI_PROVIDER, slug)
    
    @staticmethod
    def ai_providers_active() -> str:
        return CacheKeyBuilder._build(CacheNamespace.AI_PROVIDER, "active")
    
    @staticmethod
    def ai_models_by_provider(provider_slug: str, capability: Optional[str] = None) -> str:
        cap = capability or "all"
        return CacheKeyBuilder._build(CacheNamespace.AI_MODEL, "provider", provider_slug, cap)
    
    @staticmethod
    def ai_models_by_capability(capability: str, include_inactive: bool = True) -> str:
        status = "all" if include_inactive else "active"
        return CacheKeyBuilder._build(CacheNamespace.AI_MODEL, "capability", capability, status)
    
    @staticmethod
    def ai_admin_settings(admin_id: int, provider_id: int) -> str:
        return CacheKeyBuilder._build(CacheNamespace.AI_PROVIDER, "settings", admin_id, provider_id)
    
    # ============================================
    # Real Estate Cache Keys
    # ============================================
    
    @staticmethod
    def property_list_admin(params: dict) -> str:
        """Cache key for property admin list with filters"""
        params_hash = CacheKeyBuilder._hash_params(params)
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_LIST, "admin", params_hash)
    
    @staticmethod
    def property_detail(property_id: int) -> str:
        """Cache key for property detail"""
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_DETAIL, property_id)
    
    @staticmethod
    def property_main_image(property_id: int) -> str:
        """Cache key for property main image"""
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_DETAIL, property_id, "main_image")
    
    @staticmethod
    def property_seo_data(property_id: int) -> str:
        """Cache key for property SEO data"""
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_SEO, property_id, "data")
    
    @staticmethod
    def property_seo_preview(property_id: int) -> str:
        """Cache key for property SEO preview"""
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_SEO, property_id, "preview")
    
    @staticmethod
    def property_seo_completeness(property_id: int) -> str:
        """Cache key for property SEO completeness check"""
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_SEO, property_id, "completeness")
    
    @staticmethod
    def property_structured_data(property_id: int) -> str:
        """Cache key for property structured data (Schema.org)"""
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_DETAIL, property_id, "structured")
    
    @staticmethod
    def property_statistics() -> str:
        """Cache key for property statistics"""
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_STATS, "general")
    
    @staticmethod
    def property_featured() -> str:
        """Cache key for featured properties"""
        return CacheKeyBuilder._build(CacheNamespace.PROPERTY_LIST, "featured")
    
    @staticmethod
    def property_all_keys(property_id: int) -> list[str]:
        """Get all cache keys for a specific property"""
        return [
            CacheKeyBuilder.property_detail(property_id),
            CacheKeyBuilder.property_main_image(property_id),
            CacheKeyBuilder.property_seo_data(property_id),
            CacheKeyBuilder.property_seo_preview(property_id),
            CacheKeyBuilder.property_seo_completeness(property_id),
            CacheKeyBuilder.property_structured_data(property_id),
        ]
