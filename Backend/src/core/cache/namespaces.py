from typing import Final


class CacheNamespace:
    
    ADMIN_SESSION: Final[str] = "admin:session"
    USER_SESSION: Final[str] = "user:session"
    
    OTP: Final[str] = "otp"
    CAPTCHA: Final[str] = "captcha"
    
    USER_PERMISSIONS: Final[str] = "user:perms"
    USER_PROFILE: Final[str] = "user:profile"
    USER_MODULES: Final[str] = "user:modules"
    
    ADMIN_PERMISSIONS: Final[str] = "admin:perms"
    ADMIN_ROLES: Final[str] = "admin:roles"
    ADMIN_PROFILE: Final[str] = "admin:profile"
    ADMIN_INFO: Final[str] = "admin:info"
    
    PORTFOLIO_LIST: Final[str] = "portfolio:list"
    PORTFOLIO_DETAIL: Final[str] = "portfolio:detail"
    PORTFOLIO_SEO: Final[str] = "portfolio:seo"
    
    BLOG_LIST: Final[str] = "blog:list"
    BLOG_DETAIL: Final[str] = "blog:detail"
    
    MEDIA_FILE: Final[str] = "media:file"
    MEDIA_LIST: Final[str] = "media:list"
    
    AI_PROVIDER: Final[str] = "ai:provider"
    AI_MODEL: Final[str] = "ai:model"
    
    PERMISSION_MAP: Final[str] = "perm:map"
    PERMISSION_DISPLAY: Final[str] = "perm:display"
    
    PROPERTY_LIST: Final[str] = "property:list"
    PROPERTY_DETAIL: Final[str] = "property:detail"
    PROPERTY_SEO: Final[str] = "property:seo"
    PROPERTY_STATS: Final[str] = "property:stats"


class CacheTTL:
    
    SESSION_ADMIN: Final[int] = 3 * 24 * 60 * 60
    SESSION_USER: Final[int] = 30 * 24 * 60 * 60
    
    OTP: Final[int] = 2 * 60
    CAPTCHA: Final[int] = 5 * 60
    
    PERMISSIONS: Final[int] = 5 * 60
    PROFILE: Final[int] = 15 * 60
    
    LIST_SHORT: Final[int] = 5 * 60
    LIST_MEDIUM: Final[int] = 15 * 60
    LIST_LONG: Final[int] = 30 * 60
    
    DETAIL_SHORT: Final[int] = 10 * 60
    DETAIL_MEDIUM: Final[int] = 30 * 60
    DETAIL_LONG: Final[int] = 60 * 60
    
    DEFAULT: Final[int] = 15 * 60
