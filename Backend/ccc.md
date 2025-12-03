📘 معماری حرفه‌ای Django REST Framework
راهنمای جامع تفکیک مسئولیت‌های Serializer، Service و View
نسخه: 2025
پروژه: Django + Next.js Corporate
هدف: ایجاد معماری تمیز، قابل نگهداری و مقیاس‌پذیر

📋 فهرست مطالب
نمای کلی معماری
Serializer - لایه اعتبارسنجی و تبدیل داده
Service - لایه منطق کسب‌وکار
View - لایه مدیریت HTTP
Messages - مدیریت پیام‌ها
ساختار فایل‌ها
مثال‌های عملی
Anti-Patterns (الگوهای اشتباه)
چک‌لیست بررسی کد
🏗️ نمای کلی معماری
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                      │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP Request
┌─────────────────────────────────────────────────────────┐
│  VIEW LAYER (views/)                                     │
│  • دریافت Request                                        │
│  • بررسی Permission                                      │
│  • فراخوانی Serializer برای Validation                  │
│  • فراخوانی Service برای Business Logic                 │
│  • برگرداندن Response                                    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  SERIALIZER LAYER (serializers/)                         │
│  • Validation ورودی                                      │
│  • تبدیل Model → JSON                                    │
│  • تبدیل JSON → Model                                    │
│  • محاسبات ساده برای نمایش                              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  SERVICE LAYER (services/)                               │
│  • Business Logic                                        │
│  • تراکنش‌های پیچیده DB                                 │
│  • کار با Cache/Redis                                    │
│  • ارسال Email/SMS                                       │
│  • فراخوانی API خارجی                                   │
│  • پردازش فایل و Media                                  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  MODEL LAYER (models/)                                   │
│  • تعریف ساختار داده                                    │
│  • روابط بین جداول                                      │
└─────────────────────────────────────────────────────────┘
🔵 Serializer
✅ مسئولیت‌های مجاز
1. اعتبارسنجی ورودی (Validation)
class PortfolioAdminCreateSerializer(serializers.ModelSerializer):
    categories_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Portfolio
        fields = ['title', 'slug', 'short_description', ...]
    
    def validate_title(self, value):
        """✅ اعتبارسنجی ساده فیلد"""
        if len(value) < 3:
            raise serializers.ValidationError("عنوان باید حداقل 3 کاراکتر باشد")
        return value
    
    def validate(self, data):
        """✅ اعتبارسنجی چند فیلدی"""
        if data.get('is_featured') and not data.get('meta_title'):
            raise serializers.ValidationError({
                'meta_title': 'نمونه‌کار ویژه باید عنوان متا داشته باشد'
            })
        return data
2. تبدیل Model → JSON
class PortfolioAdminListSerializer(serializers.ModelSerializer):
    main_image = serializers.SerializerMethodField()
    categories = PortfolioCategorySimpleAdminSerializer(many=True, read_only=True)
    
    class Meta:
        model = Portfolio
        fields = ['id', 'title', 'main_image', 'categories', ...]
    
    def get_main_image(self, obj):
        """✅ محاسبه ساده برای نمایش"""
        return obj.get_main_image_details()
3. تبدیل JSON → Model (فقط در create/update)
def create(self, validated_data):
    """✅ ایجاد ساده - بدون Business Logic پیچیده"""
    categories_ids = validated_data.pop('categories_ids', [])
    tags_ids = validated_data.pop('tags_ids', [])
    
    # ✅ فقط تنظیم پیش‌فرض‌های ساده
    if not validated_data.get('meta_title') and validated_data.get('title'):
        validated_data['meta_title'] = validated_data['title'][:70]
    
    portfolio = Portfolio.objects.create(**validated_data)
    
    # ✅ تنظیم روابط ساده
    if categories_ids:
        portfolio.categories.set(categories_ids)
    
    return portfolio
4. محاسبات ساده مخصوص نمایش
def get_seo_status(self, obj):
    """✅ محاسبه ساده برای UI"""
    has_meta_title = bool(obj.meta_title)
    has_meta_description = bool(obj.meta_description)
    has_og_image = bool(obj.og_image)
    
    score = sum([has_meta_title, has_meta_description, has_og_image])
    return {
        'score': score,
        'total': 3,
        'status': 'complete' if score == 3 else 'incomplete' if score > 0 else 'missing'
    }
❌ ممنوعیت‌ها
# ❌ WRONG: Business Logic در Serializer
def create(self, validated_data):
    portfolio = Portfolio.objects.create(**validated_data)
    
    # ❌ ارسال ایمیل
    send_mail('Portfolio Created', ...)
    
    # ❌ کار با Cache
    cache.delete('portfolio_list')
    
    # ❌ فراخوانی API خارجی
    requests.post('https://api.example.com/notify', ...)
    
    # ❌ منطق پیچیده کسب‌وکار
    if portfolio.is_featured:
        # پردازش پیچیده...
    
    return portfolio
# ❌ WRONG: تراکنش پیچیده
def update(self, instance, validated_data):
    with transaction.atomic():
        # ❌ عملیات پیچیده روی چندین مدل
        instance.save()
        OtherModel.objects.filter(...).update(...)
        AnotherModel.objects.create(...)
📌 قوانین کلیدی Serializer
فقط Validation و تبدیل داده
هیچ Business Logic پیچیده ندارد
هیچ تراکنش DB پیچیده ندارد
هیچ فراخوانی سرویس خارجی ندارد
هیچ کار با Cache/Email/SMS ندارد
create/update فقط برای عملیات ساده CRUD
🟣 Service
✅ مسئولیت‌های مجاز و ضروری
1. Business Logic کامل
class PortfolioAdminService:
    
    @staticmethod
    def create_portfolio(validated_data, created_by=None):
        """✅ منطق کسب‌وکار کامل برای ایجاد نمونه‌کار"""
        
        # ✅ منطق تولید خودکار SEO
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
            
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        # ✅ منطق اعتبارسنجی URL
        if 'canonical_url' in validated_data and validated_data.get('canonical_url'):
            canonical_url = validated_data['canonical_url']
            if not canonical_url.startswith(('http://', 'https://')):
                validated_data['canonical_url'] = None
        
        return Portfolio.objects.create(**validated_data)
2. تراکنش‌های پیچیده
@staticmethod
def bulk_delete_portfolios(portfolio_ids):
    """✅ تراکنش پیچیده با چندین عملیات"""
    from django.core.exceptions import ValidationError
    
    if not portfolio_ids:
        raise ValidationError("Portfolio IDs required")
    
    portfolios = Portfolio.objects.filter(id__in=portfolio_ids)
    
    if not portfolios.exists():
        raise ValidationError("Selected portfolios not found")
    
    # ✅ استفاده از transaction.atomic
    with transaction.atomic():
        deleted_count = portfolios.count()
        portfolios.delete()
        
        # ✅ پاک‌سازی Cache
        PortfolioCacheManager.invalidate_portfolios(portfolio_ids)
    
    return deleted_count
3. کار با Cache
@staticmethod
def get_seo_report():
    """✅ مدیریت Cache در Service"""
    from src.portfolio.utils.cache import PortfolioCacheKeys
    
    cache_key = PortfolioCacheKeys.seo_report()
    cached_report = cache.get(cache_key)
    if cached_report:
        return cached_report
    
    # محاسبات پیچیده...
    total = Portfolio.objects.count()
    complete_seo = Portfolio.objects.filter(
        meta_title__isnull=False,
        meta_description__isnull=False,
        og_image__isnull=False
    ).count()
    
    report_data = {
        'total': total,
        'complete_seo': complete_seo,
        'completion_percentage': round((complete_seo / total * 100), 1) if total > 0 else 0,
    }
    
    # ✅ ذخیره در Cache
    cache.set(cache_key, report_data, 600)
    return report_data
4. Query پیچیده و Optimization
@staticmethod
def get_portfolio_queryset(filters=None, search=None, order_by=None, order_desc=None):
    """✅ Query پیچیده با Prefetch و Annotation"""
    queryset = Portfolio.objects.select_related('og_image').prefetch_related(
        'categories',
        'tags',
        Prefetch(
            'images',
            queryset=PortfolioImage.objects.filter(is_main=True).select_related('image'),
            to_attr='main_image_media'
        ),
        'images',
        'videos',
        'audios',
        'documents'
    )
    
    # ✅ منطق فیلترینگ پیچیده
    if filters:
        if filters.get('seo_status'):
            if filters['seo_status'] == 'complete':
                queryset = queryset.filter(
                    meta_title__isnull=False,
                    meta_description__isnull=False,
                    og_image__isnull=False
                )
            elif filters['seo_status'] == 'incomplete':
                queryset = queryset.filter(
                    Q(meta_title__isnull=False) | Q(meta_description__isnull=False)
                ).exclude(
                    meta_title__isnull=False,
                    meta_description__isnull=False,
                    og_image__isnull=False
                )
    
    # ✅ Annotation برای محاسبات
    queryset = queryset.annotate(
        categories_count=Count('categories', distinct=True),
        tags_count=Count('tags', distinct=True),
        media_count=Count('images', distinct=True) + Count('videos', distinct=True)
    )
    
    return queryset
5. منطق پیچیده کسب‌وکار
class PortfolioAdminSEOService:
    
    @staticmethod
    def auto_generate_seo(portfolio_id):
        """✅ منطق پیچیده تولید خودکار SEO"""
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
        updates = {}
        
        # ✅ منطق هوشمند تولید SEO
        if not portfolio.meta_title and portfolio.title:
            updates['meta_title'] = portfolio.title[:70]
        
        if not portfolio.meta_description and portfolio.short_description:
            updates['meta_description'] = portfolio.short_description[:300]
        
        if not portfolio.og_title and (portfolio.meta_title or portfolio.title):
            updates['og_title'] = (portfolio.meta_title or portfolio.title)[:70]
        
        if not portfolio.og_description and (portfolio.meta_description or portfolio.short_description):
            updates['og_description'] = (portfolio.meta_description or portfolio.short_description)[:300]
        
        # ✅ منطق انتخاب تصویر اصلی
        if not portfolio.og_image:
            main_image = portfolio.get_main_image()
            if main_image:
                updates['og_image'] = main_image
        
        # ✅ اعمال تغییرات
        if updates:
            for field, value in updates.items():
                setattr(portfolio, field, value)
            portfolio.save()
        
        return portfolio
    
    @staticmethod
    def validate_seo_data(portfolio_id):
        """✅ منطق اعتبارسنجی پیچیده SEO"""
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
        suggestions = []
        
        # ✅ قوانین کسب‌وکار برای SEO
        if portfolio.meta_title:
            if len(portfolio.meta_title) > 60:
                suggestions.append("Meta title should be under 60 characters for optimal display")
        
        if portfolio.meta_description:
            if len(portfolio.meta_description) < 120:
                suggestions.append("Meta description should be at least 120 characters")
            elif len(portfolio.meta_description) > 160:
                suggestions.append("Meta description should be under 160 characters")
        
        if not portfolio.og_image:
            suggestions.append("Adding an OG image improves social media sharing")
        
        return {
            'is_valid': len(suggestions) == 0,
            'suggestions': suggestions,
            'completeness_score': portfolio.seo_completeness_score() if hasattr(portfolio, 'seo_completeness_score') else None
        }
❌ ممنوعیت‌ها
# ❌ WRONG: HTTP Request/Response در Service
def create_portfolio(request):  # ❌ نباید request بگیرد
    data = request.data  # ❌
    serializer = SomeSerializer(data=data)  # ❌
    return Response(...)  # ❌
# ❌ WRONG: کار با Serializer
def get_portfolios():
    portfolios = Portfolio.objects.all()
    serializer = PortfolioSerializer(portfolios, many=True)  # ❌
    return serializer.data  # ❌
# ❌ WRONG: بررسی Permission
def delete_portfolio(portfolio_id, user):
    if not user.has_perm('portfolio.delete'):  # ❌
        raise PermissionDenied
📌 قوانین کلیدی Service
مستقل از HTTP است (هیچ Request/Response ندارد)
مستقل از DRF است (هیچ Serializer/Permission ندارد)
تمام Business Logic اینجاست
تمام تراکنش‌های پیچیده اینجاست
قابل تست بدون نیاز به HTTP Request
می‌تواند از CLI، Celery، Management Command فراخوانی شود
🟢 View
✅ مسئولیت‌های مجاز
1. دریافت HTTP Request و بررسی Permission
class PortfolioAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [PortfolioManagerAccess]
    
    def retrieve(self, request, *args, **kwargs):
        """✅ بررسی Permission"""
        if not PermissionValidator.has_permission(request.user, 'portfolio.read'):
            return APIResponse.error(
                message=PORTFOLIO_ERRORS.get("portfolio_not_authorized"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # ✅ دریافت داده
        queryset = Portfolio.objects.for_detail()
        pk = kwargs.get('pk')
        
        try:
            instance = queryset.get(pk=pk)
        except Portfolio.DoesNotExist:
            return APIResponse.error(
                message=PORTFOLIO_ERRORS["portfolio_not_found"],
                status_code=status.HTTP_404_NOT_FOUND
            )
        
        # ✅ Serialize کردن
        serializer = self.get_serializer(instance)
        
        # ✅ برگرداندن Response
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_retrieved"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
2. فراخوانی Serializer برای Validation
def create(self, request, *args, **kwargs):
    """✅ استفاده از Serializer فقط برای Validation"""
    if not PermissionValidator.has_permission(request.user, 'portfolio.create'):
        return APIResponse.error(
            message=PORTFOLIO_ERRORS.get("portfolio_not_authorized"),
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    # ✅ Validation ورودی
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    portfolio = serializer.save()
    
    # ✅ فراخوانی Service برای کار اصلی
    if media_files or media_ids:
        PortfolioAdminMediaService.add_media_bulk(
            portfolio_id=portfolio.id,
            media_files=media_files,
            media_ids=media_ids,
            created_by=request.user
        )
        portfolio.refresh_from_db()
        PortfolioCacheManager.invalidate_portfolio(portfolio.id)
    
    # ✅ Serialize کردن خروجی
    portfolio = Portfolio.objects.for_detail().get(id=portfolio.id)
    detail_serializer = PortfolioAdminDetailSerializer(portfolio)
    
    # ✅ برگرداندن Response
    return APIResponse.success(
        message=PORTFOLIO_SUCCESS["portfolio_created"],
        data=detail_serializer.data,
        status_code=status.HTTP_201_CREATED
    )
3. فراخوانی Service برای Business Logic
@action(detail=False, methods=['post'], url_path='bulk-delete')
def bulk_delete(self, request):
    """✅ View فقط orchestration می‌کند"""
    # ✅ دریافت ورودی
    portfolio_ids = request.data.get('ids', [])
    
    # ✅ Validation ساده
    if not portfolio_ids:
        return APIResponse.error(
            message=PORTFOLIO_ERRORS["portfolio_ids_required"],
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # ✅ فراخوانی Service
    try:
        deleted_count = PortfolioAdminService.bulk_delete_portfolios(portfolio_ids)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_bulk_deleted"],
            data={'deleted_count': deleted_count},
            status_code=status.HTTP_200_OK
        )
    except ValidationError as e:
        # ✅ مدیریت Exception
        error_msg = str(e)
        if "not found" in error_msg.lower():
            message = PORTFOLIO_ERRORS["portfolio_not_found"]
        elif "required" in error_msg.lower():
            message = PORTFOLIO_ERRORS["portfolio_ids_required"]
        else:
            message = PORTFOLIO_ERRORS["portfolio_delete_failed"]
        
        return APIResponse.error(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST
        )
4. مدیریت Exception و ارسال پیام
@action(detail=True, methods=['post'])
def publish(self, request, pk=None):
    """✅ مدیریت Exception و پیام‌ها"""
    try:
        # ✅ فراخوانی Service
        result = PortfolioAdminStatusService.publish_portfolio(pk)
        
        # ✅ Serialize کردن
        serializer = PortfolioAdminDetailSerializer(result['portfolio'])
        
        # ✅ آماده‌سازی Response
        response_data = {
            'portfolio': serializer.data,
            'seo_warnings': result['seo_warnings']
        }
        
        # ✅ برگرداندن پیام موفقیت
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_published"],
            data=response_data,
            status_code=status.HTTP_200_OK
        )
    except Portfolio.DoesNotExist:
        # ✅ مدیریت خطا
        return APIResponse.error(
            message=PORTFOLIO_ERRORS["portfolio_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )
❌ ممنوعیت‌ها
# ❌ WRONG: Business Logic در View
def create(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    portfolio = serializer.save()
    
    # ❌ منطق کسب‌وکار
    if portfolio.is_featured:
        # پردازش پیچیده...
    
    # ❌ تراکنش پیچیده
    with transaction.atomic():
        portfolio.save()
        OtherModel.objects.create(...)
    
    # ❌ کار با Cache
    cache.delete('portfolio_list')
    
    # ❌ ارسال ایمیل
    send_mail(...)
# ❌ WRONG: Query مستقیم بدون Service
def list(self, request):
    # ❌ Query پیچیده در View
    portfolios = Portfolio.objects.select_related(...).prefetch_related(...).annotate(...)
    
    # ❌ فیلترینگ پیچیده
    if request.query_params.get('seo_status') == 'complete':
        portfolios = portfolios.filter(...)
# ❌ WRONG: Validation تکراری
def update(self, request, pk=None):
    # ❌ Validation دستی (باید در Serializer باشد)
    if len(request.data.get('title', '')) < 3:
        return Response({'error': 'Title too short'})
📌 قوانین کلیدی View
فقط HTTP Request/Response
فقط Permission و Authentication
فقط Orchestration (هماهنگی بین لایه‌ها)
هیچ Business Logic ندارد
هیچ Query پیچیده ندارد
هیچ تراکنش DB ندارد
همه چیز را به Service واگذار می‌کند
💬 Messages
ساختار فایل Messages
# src/portfolio/messages/messages.py
PORTFOLIO_SUCCESS = {
    "portfolio_list_success": "لیست نمونه کارها با موفقیت دریافت شد.",
    "portfolio_created": "نمونه کار با موفقیت ایجاد شد.",
    "portfolio_updated": "نمونه کار با موفقیت به‌روزرسانی شد.",
    "portfolio_deleted": "نمونه کار با موفقیت حذف شد.",
    "portfolio_retrieved": "نمونه کار با موفقیت دریافت شد.",
}
PORTFOLIO_ERRORS = {
    "portfolio_not_found": "نمونه کار یافت نشد.",
    "portfolio_not_authorized": "شما اجازه دسترسی به این نمونه‌کار را ندارید.",
    "portfolio_invalid_status": "وضعیت نامعتبر است.",
    "portfolio_create_failed": "ایجاد نمونه کار ناموفق بود.",
}
استفاده از Messages
✅ در View
from src.portfolio.messages.messages import PORTFOLIO_SUCCESS, PORTFOLIO_ERRORS
def retrieve(self, request, *args, **kwargs):
    try:
        instance = queryset.get(pk=pk)
    except Portfolio.DoesNotExist:
        return APIResponse.error(
            message=PORTFOLIO_ERRORS["portfolio_not_found"],  # ✅
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    return APIResponse.success(
        message=PORTFOLIO_SUCCESS["portfolio_retrieved"],  # ✅
        data=serializer.data,
        status_code=status.HTTP_200_OK
    )
❌ پیام Hard-coded
# ❌ WRONG
return APIResponse.error(
    message="Portfolio not found",  # ❌ Hard-coded
    status_code=status.HTTP_404_NOT_FOUND
)
# ✅ CORRECT
return APIResponse.error(
    message=PORTFOLIO_ERRORS["portfolio_not_found"],  # ✅
    status_code=status.HTTP_404_NOT_FOUND
)
📌 قوانین Messages
همه پیام‌ها در 
messages/messages.py
تفکیک SUCCESS و ERRORS
نام‌گذاری واضح و توصیفی
هیچ پیام Hard-coded در View/Service/Serializer
پیام‌ها فقط در View استفاده می‌شوند
📁 ساختار فایل‌ها
src/
└── portfolio/
    ├── __init__.py
    ├── apps.py
    ├── urls.py
    │
    ├── models/
    │   ├── __init__.py
    │   ├── portfolio.py
    │   ├── category.py
    │   ├── tag.py
    │   └── media.py
    │
    ├── serializers/
    │   ├── __init__.py
    │   ├── admin/
    │   │   ├── __init__.py
    │   │   ├── portfolio_serializer.py
    │   │   ├── category_serializer.py
    │   │   └── tag_serializer.py
    │   └── public/
    │       ├── __init__.py
    │       └── portfolio_serializer.py
    │
    ├── services/
    │   ├── __init__.py
    │   ├── admin/
    │   │   ├── __init__.py
    │   │   ├── portfolio_services.py
    │   │   ├── category_services.py
    │   │   ├── media_services.py
    │   │   └── pdf_export_service.py
    │   └── public/
    │       ├── __init__.py
    │       └── portfolio_services.py
    │
    ├── views/
    │   ├── __init__.py
    │   ├── admin/
    │   │   ├── __init__.py
    │   │   ├── portfolio_views.py
    │   │   ├── category_views.py
    │   │   └── tag_views.py
    │   └── public/
    │       ├── __init__.py
    │       └── portfolio_views.py
    │
    ├── messages/
    │   ├── __init__.py
    │   └── messages.py
    │
    ├── filters/
    │   ├── __init__.py
    │   └── admin/
    │       └── portfolio_filters.py
    │
    └── utils/
        ├── __init__.py
        └── cache.py
🎯 مثال‌های عملی
مثال 1: ایجاد نمونه‌کار با رسانه
❌ روش اشتباه (همه چیز در Serializer)
# ❌ WRONG
class PortfolioCreateSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        media_files = self.context['request'].FILES.getlist('media_files')  # ❌
        
        # ❌ Business Logic در Serializer
        if not validated_data.get('meta_title'):
            validated_data['meta_title'] = validated_data['title'][:70]
        
        portfolio = Portfolio.objects.create(**validated_data)
        
        # ❌ پردازش پیچیده Media
        for media_file in media_files:
            media = ImageMedia.objects.create(file=media_file)
            PortfolioImage.objects.create(portfolio=portfolio, image=media)
        
        # ❌ ارسال ایمیل
        send_mail('Portfolio Created', ...)
        
        # ❌ کار با Cache
        cache.delete('portfolio_list')
        
        return portfolio
✅ روش صحیح (تفکیک مسئولیت‌ها)
1. Serializer - فقط Validation

# ✅ CORRECT
class PortfolioAdminCreateSerializer(serializers.ModelSerializer):
    categories_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Portfolio
        fields = ['title', 'slug', 'short_description', 'categories_ids', ...]
    
    def validate_title(self, value):
        """✅ فقط Validation"""
        if len(value) < 3:
            raise serializers.ValidationError("عنوان باید حداقل 3 کاراکتر باشد")
        return value
    
    def create(self, validated_data):
        """✅ فقط ایجاد ساده"""
        categories_ids = validated_data.pop('categories_ids', [])
        
        portfolio = Portfolio.objects.create(**validated_data)
        
        if categories_ids:
            portfolio.categories.set(categories_ids)
        
        return portfolio
2. Service - Business Logic

# ✅ CORRECT
class PortfolioAdminService:
    
    @staticmethod
    def create_portfolio_with_media(validated_data, media_files, created_by=None):
        """✅ منطق کسب‌وکار کامل"""
        
        # ✅ تولید خودکار SEO
        if not validated_data.get('meta_title') and validated_data.get('title'):
            validated_data['meta_title'] = validated_data['title'][:70]
        
        if not validated_data.get('meta_description') and validated_data.get('short_description'):
            validated_data['meta_description'] = validated_data['short_description'][:300]
        
        # ✅ ایجاد Portfolio
        portfolio = Portfolio.objects.create(**validated_data)
        
        # ✅ پردازش Media
        if media_files:
            PortfolioAdminMediaService.add_media_bulk(
                portfolio_id=portfolio.id,
                media_files=media_files,
                created_by=created_by
            )
        
        # ✅ پاک‌سازی Cache
        PortfolioCacheManager.invalidate_portfolio(portfolio.id)
        
        return portfolio
3. View - Orchestration

# ✅ CORRECT
class PortfolioAdminViewSet(viewsets.ModelViewSet):
    
    def create(self, request, *args, **kwargs):
        """✅ فقط هماهنگی بین لایه‌ها"""
        
        # ✅ بررسی Permission
        if not PermissionValidator.has_permission(request.user, 'portfolio.create'):
            return APIResponse.error(
                message=PORTFOLIO_ERRORS.get("portfolio_not_authorized"),
                status_code=status.HTTP_403_FORBIDDEN
            )
        
        # ✅ دریافت فایل‌ها
        media_files = request.FILES.getlist('media_files')
        
        # ✅ Validation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        portfolio = serializer.save()
        
        # ✅ فراخوانی Service
        if media_files:
            PortfolioAdminMediaService.add_media_bulk(
                portfolio_id=portfolio.id,
                media_files=media_files,
                created_by=request.user
            )
            portfolio.refresh_from_db()
        
        # ✅ Serialize خروجی
        detail_serializer = PortfolioAdminDetailSerializer(portfolio)
        
        # ✅ Response
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_created"],
            data=detail_serializer.data,
            status_code=status.HTTP_201_CREATED
        )
مثال 2: تولید خودکار SEO
✅ Service
class PortfolioAdminSEOService:
    
    @staticmethod
    def auto_generate_seo(portfolio_id):
        """✅ منطق پیچیده در Service"""
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            raise Portfolio.DoesNotExist("Portfolio not found")
        
        updates = {}
        
        if not portfolio.meta_title and portfolio.title:
            updates['meta_title'] = portfolio.title[:70]
        
        if not portfolio.meta_description and portfolio.short_description:
            updates['meta_description'] = portfolio.short_description[:300]
        
        if not portfolio.og_image:
            main_image = portfolio.get_main_image()
            if main_image:
                updates['og_image'] = main_image
        
        if updates:
            for field, value in updates.items():
                setattr(portfolio, field, value)
            portfolio.save()
        
        return portfolio
✅ View
@action(detail=True, methods=['post'])
def generate_seo(self, request, pk=None):
    """✅ فقط فراخوانی Service"""
    try:
        portfolio = PortfolioAdminSEOService.auto_generate_seo(pk)
        serializer = PortfolioAdminDetailSerializer(portfolio)
        return APIResponse.success(
            message=PORTFOLIO_SUCCESS["portfolio_seo_generated"],
            data=serializer.data,
            status_code=status.HTTP_200_OK
        )
    except Portfolio.DoesNotExist:
        return APIResponse.error(
            message=PORTFOLIO_ERRORS["portfolio_not_found"],
            status_code=status.HTTP_404_NOT_FOUND
        )
⚠️ Anti-Patterns
1. Business Logic در Serializer
# ❌ WRONG
class PortfolioSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        portfolio = Portfolio.objects.create(**validated_data)
        
        # ❌ منطق کسب‌وکار
        if portfolio.is_featured:
            send_notification_to_subscribers(portfolio)
            cache.delete('featured_portfolios')
        
        return portfolio
2. Query پیچیده در View
# ❌ WRONG
def list(self, request):
    # ❌ Query پیچیده
    portfolios = Portfolio.objects.select_related('og_image').prefetch_related(
        'categories', 'tags',
        Prefetch('images', queryset=PortfolioImage.objects.filter(is_main=True))
    ).annotate(
        media_count=Count('images') + Count('videos')
    ).filter(
        Q(status='published') | Q(is_featured=True)
    )
3. HTTP در Service
# ❌ WRONG
def create_portfolio(request):  # ❌ نباید request بگیرد
    data = request.data
    portfolio = Portfolio.objects.create(**data)
    return Response({'id': portfolio.id})  # ❌
4. پیام Hard-coded
# ❌ WRONG
return APIResponse.success(
    message="Portfolio created successfully",  # ❌
    data=serializer.data
)
5. Validation در View
# ❌ WRONG
def create(self, request):
    # ❌ Validation دستی
    if len(request.data.get('title', '')) < 3:
        return Response({'error': 'Title too short'})
    
    if not request.data.get('slug'):
        return Response({'error': 'Slug required'})
✅ چک‌لیست بررسی کد
Serializer
 فقط Validation دارد؟
 فقط تبدیل Model ↔ JSON دارد؟
 هیچ Business Logic پیچیده ندارد؟
 هیچ تراکنش DB ندارد؟
 هیچ فراخوانی سرویس خارجی ندارد؟
 هیچ کار با Cache/Email/SMS ندارد؟
Service
 مستقل از HTTP است؟
 مستقل از DRF است؟
 تمام Business Logic اینجاست؟
 از transaction.atomic() برای تراکنش‌ها استفاده می‌کند؟
 قابل تست بدون HTTP Request است؟
 می‌تواند از CLI/Celery فراخوانی شود؟
View
 فقط HTTP Request/Response دارد؟
 Permission را بررسی می‌کند؟
 از Serializer فقط برای Validation استفاده می‌کند؟
 همه Business Logic را به Service واگذار می‌کند؟
 هیچ Query پیچیده ندارد؟
 هیچ تراکنش DB ندارد؟
 از Messages برای پیام‌ها استفاده می‌کند؟
Messages
 همه پیام‌ها در 
messages/messages.py
 هستند؟
 تفکیک SUCCESS و ERRORS دارد؟
 هیچ پیام Hard-coded نیست؟
📚 خلاصه
لایه	مسئولیت اصلی	مجاز	ممنوع
Serializer	Validation + تبدیل داده	✅ Validation
✅ Model ↔ JSON
✅ محاسبات ساده نمایش	❌ Business Logic
❌ تراکنش DB
❌ Cache/Email/API
Service	Business Logic	✅ منطق کسب‌وکار
✅ تراکنش‌های پیچیده
✅ Cache/Email/SMS
✅ API خارجی	❌ HTTP Request/Response
❌ Serializer
❌ Permission
View	HTTP Handling	✅ Request/Response
✅ Permission
✅ فراخوانی Service
✅ مدیریت Exception	❌ Business Logic
❌ Query پیچیده
❌ تراکنش DB
Messages	مدیریت پیام‌ها	✅ تمرکز پیام‌ها
✅ تفکیک SUCCESS/ERRORS	❌ Hard-coded Messages
🎓 نتیجه‌گیری
این معماری باعث می‌شود:

کد تمیز و خوانا - هر لایه مسئولیت مشخص دارد
قابل تست - Service مستقل از HTTP قابل تست است
قابل استفاده مجدد - Service از CLI، Celery، Management Command قابل فراخوانی است
قابل نگهداری - تغییرات در یک لایه بقیه را تحت تأثیر قرار نمی‌دهد
مقیاس‌پذیر - به راحتی می‌توان قابلیت‌های جدید اضافه کرد
نسخه: 1.0.0
تاریخ: 2025-01-03
نویسنده: Architecture Team