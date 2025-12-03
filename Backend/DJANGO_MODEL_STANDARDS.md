# Django Model Standards for PostgreSQL

This document defines standardized structure and professional best practices for Django models optimized for PostgreSQL.

---

## 📋 Table of Contents

- [Part 1: Pattern & Structure](#part-1-pattern--structure)
- [Part 2: Professional Optimization & Performance](#part-2-professional-optimization--performance)

---

# Part 1: Pattern & Structure

This section defines the **standard pattern** and **consistent structure** for all Django models.

## 1.1 Field Definitions

### CharField
```python
field_name = models.CharField(
    max_length=VALUE,
    db_index=True,           # Add if frequently queried
    unique=True,             # Add if uniqueness required
    null=False,              # Default, avoid null for strings
    blank=False,             # Default, set True if optional in forms
    default='value',         # Add if default value needed
    verbose_name="Field Name",
    help_text="Description of field purpose"
)
```

### SlugField
```python
slug = models.SlugField(
    max_length=60,
    unique=True,
    db_index=True,
    allow_unicode=True,
    verbose_name="URL Slug",
    help_text="URL-friendly identifier"
)
```

### TextField
```python
description = models.TextField(
    null=True,
    blank=True,
    verbose_name="Description",
    help_text="Detailed description"
)
```

### BooleanField
```python
is_active = models.BooleanField(
    default=True,
    db_index=True,           # Add if frequently filtered
    verbose_name="Active Status",
    help_text="Designates whether this record is active"
)
```

### ForeignKey
```python
category = models.ForeignKey(
    'app.ModelName',
    on_delete=models.CASCADE,     # or SET_NULL, PROTECT, etc.
    related_name='related_items',
    null=True,                    # If optional
    blank=True,                   # If optional
    db_index=True,                # Automatically indexed by Django
    verbose_name="Category",
    help_text="Associated category"
)
```

### ManyToManyField
```python
tags = models.ManyToManyField(
    'app.Tag',
    blank=True,
    related_name='tagged_items',
    verbose_name="Tags",
    help_text="Associated tags"
)
```

### DateTimeField
```python
created_at = models.DateTimeField(
    default=timezone.now,
    db_index=True,
    editable=False,              # For auto-set fields
    verbose_name="Created At",
    help_text="Date and time when record was created"
)

updated_at = models.DateTimeField(
    auto_now=True,
    verbose_name="Updated At",
    help_text="Date and time when record was last updated"
)
```

### UUIDField
```python
public_id = models.UUIDField(
    default=uuid.uuid4,
    unique=True,
    editable=False,
    db_index=True,
    verbose_name="Public ID",
    help_text="Unique identifier for public-facing operations"
)
```

### EmailField
```python
email = models.EmailField(
    unique=True,
    null=True,
    blank=True,
    db_index=True,
    verbose_name="Email Address",
    help_text="User email address"
)
```

### Choices Field
```python
STATUS_CHOICES = (
    ('draft', 'Draft'),
    ('published', 'Published'),
    ('archived', 'Archived'),
)

status = models.CharField(
    max_length=20,
    choices=STATUS_CHOICES,
    default='draft',
    db_index=True,
    verbose_name="Status",
    help_text="Publication status"
)
```

---

## 1.2 Field Ordering Convention

Fields should be ordered in the following sequence:

1. **Status/State Fields** (choices, status)
2. **Primary Content Fields** (title, name, slug)
3. **Description Fields** (short_description, description, content)
4. **Boolean Flags** (is_featured, is_public, is_active)
5. **Relationships** (ForeignKey, ManyToManyField)
6. **Metadata Fields** (SEO fields if using mixin)
7. **Timestamps** (created_at, updated_at - usually in BaseModel)

### Example Order:
```python
class Article(BaseModel, SEOMixin):
    # 1. Status
    status = models.CharField(...)
    
    # 2. Primary content
    title = models.CharField(...)
    slug = models.SlugField(...)
    
    # 3. Descriptions
    short_description = models.CharField(...)
    description = models.TextField(...)
    
    # 4. Boolean flags
    is_featured = models.BooleanField(...)
    is_public = models.BooleanField(...)
    
    # 5. Relationships
    category = models.ForeignKey(...)
    tags = models.ManyToManyField(...)
    
    # 6. Custom manager
    objects = CustomQuerySet.as_manager()
```

---

## 1.3 Meta Class Configuration

### Standard Meta Class Structure

```python
class Meta:
    db_table = 'app_model_name'
    verbose_name = "Model Name"
    verbose_name_plural = "Model Names"
    ordering = ['-created_at']
    
    indexes = [
        # List all composite and important indexes
    ]
    
    constraints = [
        # Database-level constraints if needed
    ]
```

### Inheriting from Multiple Meta Classes

```python
class Meta(BaseModel.Meta, SEOMixin.Meta):
    db_table = 'custom_table_name'
    verbose_name = "Custom Name"
    verbose_name_plural = "Custom Names"
    ordering = ['-created_at']
    indexes = [...]
```

### Database Constraints

```python
constraints = [
    models.CheckConstraint(
        check=models.Q(field__isnull=False) | models.Q(other_field__isnull=False),
        name='at_least_one_field_required'
    ),
    models.UniqueConstraint(
        fields=['field1', 'field2'],
        name='unique_combination'
    ),
]
```

---

## 1.4 Model Examples

### Basic Content Model

```python
from django.db import models
from src.core.models.base import BaseModel
from .managers import ArticleQuerySet

class Article(BaseModel):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('published', 'Published'),
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
        verbose_name="Status"
    )
    title = models.CharField(
        max_length=200,
        db_index=True,
        verbose_name="Title"
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="Slug"
    )
    content = models.TextField(
        null=True,
        blank=True,
        verbose_name="Content"
    )
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Featured"
    )
    
    objects = ArticleQuerySet.as_manager()
    
    class Meta:
        db_table = 'articles'
        verbose_name = "Article"
        verbose_name_plural = "Articles"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_public']),
            models.Index(fields=['slug']),
            models.Index(fields=['title']),
        ]
    
    def __str__(self):
        return self.title
```

### Taxonomy Model (Category/Tag)

```python
from django.db import models
from src.core.models.base import BaseModel

class Category(BaseModel):
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name="Name"
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="Slug"
    )
    description = models.TextField(
        null=True,
        blank=True,
        verbose_name="Description"
    )
    is_public = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Public"
    )
    
    class Meta:
        db_table = 'categories'
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return self.name
```

### Relationship/Junction Model

```python
from django.db import models

class ArticleImage(models.Model):
    article = models.ForeignKey(
        'Article',
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name="Article"
    )
    image = models.ForeignKey(
        'media.ImageMedia',
        on_delete=models.CASCADE,
        related_name='article_images',
        verbose_name="Image"
    )
    is_main = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Main Image"
    )
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order"
    )
    
    class Meta:
        db_table = 'article_images'
        verbose_name = "Article Image"
        verbose_name_plural = "Article Images"
        ordering = ['order']
        indexes = [
            models.Index(fields=['article', 'is_main']),
            models.Index(fields=['article', 'order']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'image'],
                name='unique_article_image'
            ),
        ]
    
    def __str__(self):
        return f"{self.article.title} - {self.image.title}"
```

---

# Part 2: Professional Optimization & Performance

This section covers **professional best practices** for high-performance Django applications with PostgreSQL.

---

## 2.1 Index Strategy & Optimization

### How Many Indexes Per Table?

**General Guidelines:**
- **Recommended:** 3-7 indexes per table
- **Maximum:** No more than 10 indexes per table
- **Rule of Thumb:** ~5 indexes per table, with no more than 5 fields per composite index

**Why Not More?**
- Each index adds overhead to INSERT, UPDATE, DELETE operations
- Indexes consume disk space
- Too many indexes slow down write operations significantly
- Query planner takes longer to choose optimal execution plan

### When to Add db_index=True

Add `db_index=True` for fields that are:

✅ **Always Index:**
- Primary keys (automatic)
- Foreign keys (automatic in Django)
- Unique fields (slug, email, username)
- Fields in WHERE clauses (status, is_active, is_public)
- Fields in ORDER BY clauses (created_at, updated_at, order)
- Fields in JOIN operations

❌ **Never Index:**
- Boolean fields with low cardinality (unless filtered very frequently)
- Fields that are rarely queried
- Very large text fields (use full-text search instead)
- Fields that change frequently

### Composite Index Strategy

**Order Matters!** Place fields in this order:
1. **Equality filters first** (status = 'published')
2. **Range filters second** (created_at > '2024-01-01')
3. **Sort fields last** (ORDER BY created_at)

```python
class Meta:
    indexes = [
        # Good: Equality → Range → Sort
        models.Index(fields=['status', 'created_at']),
        models.Index(fields=['is_public', 'is_featured', '-created_at']),
        
        # Bad: Wrong order
        # models.Index(fields=['created_at', 'status']),  # Don't do this
    ]
```

### Index Types for PostgreSQL

```python
from django.contrib.postgres.indexes import BTreeIndex, GinIndex, BrinIndex, HashIndex

class Meta:
    indexes = [
        # B-Tree (default) - for equality and range queries
        BTreeIndex(fields=['created_at']),
        
        # GIN - for full-text search, arrays, JSONB
        GinIndex(fields=['search_vector']),
        
        # BRIN - for very large tables with natural ordering (time series)
        BrinIndex(fields=['created_at']),
        
        # Hash - for equality only (rarely used)
        HashIndex(fields=['status']),
    ]
```

### Partial Indexes (Conditional Indexes)

Use partial indexes to index only a subset of rows:

```python
from django.db.models import Q

class Meta:
    indexes = [
        # Index only published articles
        models.Index(
            fields=['created_at'],
            name='published_created_idx',
            condition=Q(status='published')
        ),
        
        # Index only active users
        models.Index(
            fields=['email'],
            name='active_users_email_idx',
            condition=Q(is_active=True)
        ),
    ]
```

**Benefits:**
- Smaller index size
- Faster writes
- Better performance for filtered queries

---

## 2.2 Query Optimization

### Avoid N+1 Problem

**Problem:** Executing 1 query + N queries for related objects

```python
# Bad: N+1 queries
articles = Article.objects.all()
for article in articles:
    print(article.category.name)  # 1 query per article!
```

**Solution 1: select_related (for ForeignKey, OneToOne)**

```python
# Good: 1 query with JOIN
articles = Article.objects.select_related('category').all()
for article in articles:
    print(article.category.name)  # No extra queries
```

**Solution 2: prefetch_related (for ManyToMany, Reverse ForeignKey)**

```python
# Good: 2 queries total
articles = Article.objects.prefetch_related('tags').all()
for article in articles:
    for tag in article.tags.all():  # No extra queries
        print(tag.name)
```

**Advanced: Prefetch with custom queryset**

```python
from django.db.models import Prefetch

articles = Article.objects.prefetch_related(
    Prefetch(
        'images',
        queryset=ArticleImage.objects.select_related('image').filter(is_main=True)
    )
).all()
```

### QuerySet Best Practices

```python
# 1. Use only() to fetch specific fields
Article.objects.only('id', 'title', 'slug')

# 2. Use defer() to exclude large fields
Article.objects.defer('content', 'description')

# 3. Use values() for dictionaries (faster)
Article.objects.values('id', 'title')

# 4. Use values_list() for tuples (even faster)
Article.objects.values_list('id', flat=True)

# 5. Use exists() instead of count() for checking
if Article.objects.filter(status='published').exists():
    # Better than: if Article.objects.filter(...).count() > 0

# 6. Use iterator() for large querysets
for article in Article.objects.iterator(chunk_size=1000):
    process(article)

# 7. Use bulk_create() for multiple inserts
Article.objects.bulk_create([
    Article(title='Article 1'),
    Article(title='Article 2'),
], batch_size=1000)

# 8. Use update() instead of save() for updates
Article.objects.filter(status='draft').update(status='published')
```

---

## 2.3 Database-Level Optimizations

### Use Database Constraints

```python
class Meta:
    constraints = [
        # Ensure at least one contact method
        models.CheckConstraint(
            check=Q(email__isnull=False) | Q(mobile__isnull=False),
            name='at_least_one_contact'
        ),
        
        # Ensure end date is after start date
        models.CheckConstraint(
            check=Q(end_date__gte=models.F('start_date')),
            name='valid_date_range'
        ),
        
        # Unique together with condition
        models.UniqueConstraint(
            fields=['user', 'article'],
            condition=Q(is_active=True),
            name='unique_active_user_article'
        ),
    ]
```

### PostgreSQL-Specific Features

#### Full-Text Search

```python
from django.contrib.postgres.search import SearchVector, SearchVectorField
from django.contrib.postgres.indexes import GinIndex

class Article(BaseModel):
    search_vector = SearchVectorField(null=True)
    
    class Meta:
        indexes = [
            GinIndex(fields=['search_vector']),
        ]
    
    def save(self, *args, **kwargs):
        self.search_vector = SearchVector('title', weight='A') + SearchVector('content', weight='B')
        super().save(*args, **kwargs)

# Query
Article.objects.filter(search_vector='django postgresql')
```

#### Array Fields

```python
from django.contrib.postgres.fields import ArrayField

class Article(BaseModel):
    tags = ArrayField(
        models.CharField(max_length=50),
        blank=True,
        default=list,
        verbose_name="Tags"
    )
    
    class Meta:
        indexes = [
            GinIndex(fields=['tags']),  # For array contains queries
        ]

# Query
Article.objects.filter(tags__contains=['django'])
```

#### JSON Fields

```python
class Article(BaseModel):
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        verbose_name="Metadata"
    )
    
    class Meta:
        indexes = [
            GinIndex(fields=['metadata']),
        ]

# Query
Article.objects.filter(metadata__author__name='John')
```

---

## 2.4 Redis Caching Strategy (2025 Best Practices)

### Where to Implement Caching?

**Critical Decision:** Caching can be implemented at multiple layers. Choose based on your needs:

| Layer | When to Use | Performance | Complexity | Example |
|-------|-------------|-------------|------------|---------|
| **Model Methods** | Expensive computations, related data fetching | High | Low | `get_main_image()` |
| **QuerySet/Manager** | Frequently accessed queries | Very High | Medium | Custom managers |
| **Service Layer** | Business logic, external APIs | High | Medium | Separate service classes |
| **View Layer** | Full page caching | Highest | Low | `@cache_page` decorator |

### ✅ Recommended: Model-Level Caching (Your Current Approach)

**When to use:**
- Fetching related objects (images, videos, etc.)
- Expensive computations on model instances
- Structured data generation
- Frequently accessed properties

**Example from your project:**

```python
from django.core.cache import cache

class Portfolio(BaseModel):
    def get_main_image(self):
        # Check if data is already in prefetched attributes
        if hasattr(self, 'all_images'):
            all_images = getattr(self, 'all_images', [])
            main_images = [m for m in all_images if m.is_main]
            if main_images and len(main_images) > 0:
                return main_images[0].image if main_images[0].image else None
            return None
        
        # Use Redis cache
        cache_key = f'portfolio_{self.pk}_main_image'
        main_image = cache.get(cache_key)
        
        if main_image is None:
            try:
                main_media = self.images.select_related('image').filter(is_main=True).first()
                if main_media:
                    main_image = main_media.image
                else:
                    # Fallback to other media types
                    video = self.videos.select_related('video__cover_image').first()
                    if video and video.video.cover_image:
                        main_image = video.video.cover_image
            except Exception:
                main_image = False
            
            # Cache for 30 minutes
            cache.set(cache_key, main_image, 1800)
        
        return main_image if main_image else None
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Invalidate cache on save
        if self.pk:
            cache.delete(f'portfolio_{self.pk}_main_image')
            cache.delete(f'portfolio_{self.pk}_structured_data')
    
    def delete(self, *args, **kwargs):
        portfolio_id = self.pk
        super().delete(*args, **kwargs)
        
        # Invalidate cache on delete
        if portfolio_id:
            cache.delete(f'portfolio_{portfolio_id}_main_image')
            cache.delete(f'portfolio_{portfolio_id}_structured_data')
```

### Cache Key Naming Convention

**Best Practice:** Use descriptive, hierarchical cache keys

```python
# Good: Descriptive and unique
f'{app_name}_{model_name}_{instance_id}_{data_type}'
f'portfolio_{self.pk}_main_image'
f'blog_{self.pk}_structured_data'
f'category_{self.pk}_children'

# Bad: Generic and collision-prone
f'image_{self.pk}'
f'data_{self.pk}'
```

### Cache Timeout Strategy (Based on Data Volatility)

```python
# Static data (rarely changes) - 24 hours
CACHE_TIMEOUT_STATIC = 86400

# Semi-static data (changes occasionally) - 1 hour
CACHE_TIMEOUT_SEMI_STATIC = 3600

# Dynamic data (changes frequently) - 5-15 minutes
CACHE_TIMEOUT_DYNAMIC = 300

# Real-time data (changes constantly) - 1 minute or don't cache
CACHE_TIMEOUT_REALTIME = 60

# Example usage
class Portfolio(BaseModel):
    def get_main_image(self):
        cache_key = f'portfolio_{self.pk}_main_image'
        main_image = cache.get(cache_key)
        
        if main_image is None:
            main_image = self._fetch_main_image()
            # Semi-static: Images don't change often
            cache.set(cache_key, main_image, 3600)
        
        return main_image
    
    def get_view_count(self):
        cache_key = f'portfolio_{self.pk}_view_count'
        count = cache.get(cache_key)
        
        if count is None:
            count = self.statistics.aggregate(total=Sum('views'))['total'] or 0
            # Dynamic: View counts change frequently
            cache.set(cache_key, count, 300)
        
        return count
```

### Cache Invalidation Patterns

**Pattern 1: Direct Invalidation (Simple)**

```python
def save(self, *args, **kwargs):
    super().save(*args, **kwargs)
    cache.delete(f'portfolio_{self.pk}_main_image')
```

**Pattern 2: Bulk Invalidation with Patterns (django-redis)**

```python
from django_redis import get_redis_connection

def save(self, *args, **kwargs):
    super().save(*args, **kwargs)
    
    # Delete all cache keys matching pattern
    redis_conn = get_redis_connection('default')
    pattern = f'portfolio_{self.pk}_*'
    keys = redis_conn.keys(pattern)
    if keys:
        redis_conn.delete(*keys)
```

**Pattern 3: Cache Manager (Recommended for Complex Apps)**

```python
# utils/cache.py
class PortfolioCacheManager:
    @staticmethod
    def get_cache_keys(portfolio_id):
        return {
            'main_image': f'portfolio_{portfolio_id}_main_image',
            'structured_data': f'portfolio_{portfolio_id}_structured_data',
            'related_items': f'portfolio_{portfolio_id}_related',
        }
    
    @classmethod
    def invalidate_portfolio(cls, portfolio_id):
        keys = cls.get_cache_keys(portfolio_id)
        cache.delete_many(keys.values())
    
    @classmethod
    def invalidate_all(cls):
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection('default')
        redis_conn.delete(*redis_conn.keys('portfolio_*'))

# models.py
class Portfolio(BaseModel):
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.pk:
            PortfolioCacheManager.invalidate_portfolio(self.pk)
```

### QuerySet Caching

**Option 1: Cache QuerySet Results**

```python
# Good for small, frequently accessed lists
cache_key = 'featured_portfolios'
portfolios = cache.get(cache_key)

if portfolios is None:
    # Convert to list to cache (QuerySets are not picklable)
    portfolios = list(
        Portfolio.objects.filter(is_featured=True)
        .select_related('category')
        .prefetch_related('tags')[:10]
    )
    cache.set(cache_key, portfolios, 600)  # 10 minutes
```

**Option 2: Custom Manager with Caching**

```python
class PortfolioManager(models.Manager):
    def get_featured(self):
        cache_key = 'featured_portfolios'
        portfolios = cache.get(cache_key)
        
        if portfolios is None:
            portfolios = list(
                self.filter(is_featured=True, is_public=True)
                .select_related('category')
                .prefetch_related('tags')[:10]
            )
            cache.set(cache_key, portfolios, 600)
        
        return portfolios

class Portfolio(BaseModel):
    objects = PortfolioManager()
```

### Using @cached_property for Instance-Level Caching

```python
from django.utils.functional import cached_property

class Portfolio(BaseModel):
    @cached_property
    def main_image_url(self):
        """
        Cached for the lifetime of the instance (single request)
        No Redis involved - just Python object caching
        """
        main_image = self.get_main_image()
        return main_image.file.url if main_image else None
    
    @cached_property
    def tag_names(self):
        """
        Avoid repeated queries for tags in the same request
        """
        return list(self.tags.values_list('name', flat=True))
```

### Redis Configuration (Your Current Setup)

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
                'socket_connect_timeout': 5,
                'socket_timeout': 5,
            },
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'webtalik',
        'VERSION': 1,
        'TIMEOUT': 300,  # Default 5 minutes
    },
}
```

### Best Practices Summary

✅ **DO:**
- Cache expensive database queries in model methods
- Use descriptive cache key naming conventions
- Set appropriate timeouts based on data volatility
- Invalidate cache on `save()` and `delete()`
- Use `@cached_property` for request-scoped caching
- Check for prefetched data before hitting cache
- Use cache managers for complex invalidation logic
- Monitor cache hit/miss rates

❌ **DON'T:**
- Don't cache sensitive data (passwords, tokens)
- Don't cache user-specific data in shared keys
- Don't forget to invalidate cache on updates
- Don't cache data that changes more often than timeout
- Don't over-cache (memory is limited)
- Don't use cache as primary data store
- Don't cache entire large querysets (use pagination)

### Performance Impact

| Technique | Database Queries | Redis Calls | Performance Gain |
|-----------|------------------|-------------|------------------|
| No Caching | Every request | 0 | Baseline |
| Model Caching | First request only | Every request | 80-95% |
| @cached_property | First access only | 0 | 50-70% (per request) |
| QuerySet Caching | First request only | Every request | 85-98% |

---

## 2.5 Performance Monitoring

### Use Django Debug Toolbar

```python
# settings.py
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

### Use EXPLAIN ANALYZE

```python
# Check query execution plan
queryset = Article.objects.filter(status='published').select_related('category')
print(queryset.explain(analyze=True))
```

### Monitor Slow Queries

```python
# settings.py
LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

---

## 2.6 Best Practices Summary

### DO:
- ✅ Use 3-7 indexes per table (max 10)
- ✅ Index frequently queried fields (WHERE, ORDER BY, JOIN)
- ✅ Use composite indexes for multi-field queries
- ✅ Use select_related() for ForeignKey
- ✅ Use prefetch_related() for ManyToMany
- ✅ Use only() and defer() to limit fields
- ✅ Use bulk_create() and update() for batch operations
- ✅ Use database constraints for data integrity
- ✅ Use partial indexes for filtered queries
- ✅ Cache expensive queries
- ✅ Monitor query performance with EXPLAIN
- ✅ Use PostgreSQL-specific features (GIN, JSONB, Arrays)

### DON'T:
- ❌ Don't over-index (slows down writes)
- ❌ Don't index low-cardinality fields (boolean, gender)
- ❌ Don't use count() when exists() is enough
- ❌ Don't fetch all fields when you need only a few
- ❌ Don't use save() in loops (use bulk_create/update)
- ❌ Don't forget to invalidate cache on updates
- ❌ Don't use null=True for CharField/TextField
- ❌ Don't create indexes without testing performance
- ❌ Don't ignore N+1 query problems
- ❌ Don't use Persian/Farsi in code

---

## 2.7 Index Performance Guidelines

### Index Size vs Performance

| Indexes | Read Speed | Write Speed | Disk Usage | Recommendation |
|---------|------------|-------------|------------|----------------|
| 0-3     | Slow       | Fast        | Low        | Too few        |
| 3-7     | Fast       | Good        | Medium     | **Optimal**    |
| 7-10    | Fast       | Slower      | High       | Acceptable     |
| 10+     | Fast       | Very Slow   | Very High  | **Avoid**      |

### Query Optimization Impact

| Technique | Performance Gain | Complexity | When to Use |
|-----------|------------------|------------|-------------|
| select_related | 50-90% | Low | ForeignKey, OneToOne |
| prefetch_related | 50-90% | Low | ManyToMany, Reverse FK |
| only()/defer() | 10-30% | Low | Large models |
| Composite Index | 30-70% | Medium | Multi-field filters |
| Partial Index | 20-50% | Medium | Filtered queries |
| GIN Index | 80-95% | Medium | Full-text, JSONB, Arrays |
| Caching | 90-99% | High | Expensive queries |

---

## 2.8 Model Creation Checklist

When creating a new model, ensure:

- [ ] Fields are ordered logically (status → content → flags → relationships)
- [ ] 3-7 indexes total (not more than 10)
- [ ] Composite indexes for common multi-field queries
- [ ] Partial indexes for frequently filtered subsets
- [ ] `verbose_name` and `help_text` are provided
- [ ] Appropriate `null` and `blank` settings
- [ ] `related_name` is set for all relationships
- [ ] `on_delete` behavior is appropriate
- [ ] `db_table` is explicitly set
- [ ] `__str__` method returns meaningful value
- [ ] No Persian/Farsi text in code
- [ ] Custom manager/queryset if needed
- [ ] Validation logic in `clean()` method
- [ ] Cache invalidation in `save()` and `delete()` if applicable
- [ ] Database constraints for data integrity
- [ ] Tested with EXPLAIN ANALYZE for performance

---

## 2.9 Common Query Patterns

### Pattern 1: List View with Filters

```python
# Optimized list view
def get_articles(status=None, category_id=None):
    queryset = Article.objects.select_related(
        'category'
    ).prefetch_related(
        'tags'
    ).only(
        'id', 'title', 'slug', 'created_at', 'category__name'
    )
    
    if status:
        queryset = queryset.filter(status=status)
    if category_id:
        queryset = queryset.filter(category_id=category_id)
    
    return queryset.order_by('-created_at')
```

### Pattern 2: Detail View with Related Data

```python
# Optimized detail view
def get_article_detail(slug):
    return Article.objects.select_related(
        'category'
    ).prefetch_related(
        Prefetch(
            'images',
            queryset=ArticleImage.objects.select_related('image').order_by('order')
        ),
        'tags'
    ).get(slug=slug)
```

### Pattern 3: Aggregation Queries

```python
from django.db.models import Count, Avg, Max

# Count articles per category
Category.objects.annotate(
    article_count=Count('article_categories')
).filter(article_count__gt=0)

# Average rating per article
Article.objects.annotate(
    avg_rating=Avg('ratings__score')
)
```

---

## Conclusion

Following these standards ensures:
- **Consistent code structure** across all apps
- **Optimal database performance** with PostgreSQL
- **Scalable architecture** for growing applications
- **Maintainable codebase** for team collaboration
- **Professional quality** production-ready code
