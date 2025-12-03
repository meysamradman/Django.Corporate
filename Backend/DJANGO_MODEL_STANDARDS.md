# Django Model Standards for PostgreSQL

This document defines the standardized structure and best practices for all Django models in this project.

---

## Table of Contents

1. [Field Definitions](#field-definitions)
2. [Field Ordering](#field-ordering)
3. [Index Strategy](#index-strategy)
4. [Meta Class Configuration](#meta-class-configuration)
5. [Model Examples](#model-examples)

---

## Field Definitions

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
    db_index=True,                # Automatically indexed
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

## Field Ordering

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
    # Status
    status = models.CharField(...)
    
    # Primary content
    title = models.CharField(...)
    slug = models.SlugField(...)
    
    # Descriptions
    short_description = models.CharField(...)
    description = models.TextField(...)
    
    # Boolean flags
    is_featured = models.BooleanField(...)
    is_public = models.BooleanField(...)
    
    # Relationships
    category = models.ForeignKey(...)
    tags = models.ManyToManyField(...)
    
    # Custom manager
    objects = CustomQuerySet.as_manager()
```

---

## Index Strategy

### When to Add db_index=True

Add `db_index=True` for fields that are:
- Frequently used in WHERE clauses
- Used in ORDER BY clauses
- Used in JOIN operations
- Unique identifiers (slug, public_id)
- Status/state fields frequently filtered

### Composite Indexes

Use `Meta.indexes` for multi-column queries:

```python
class Meta:
    indexes = [
        # Composite indexes for common query patterns
        models.Index(fields=['status', 'is_public']),
        models.Index(fields=['is_featured', 'status']),
        models.Index(fields=['is_active', 'created_at']),
        
        # Single field indexes
        models.Index(fields=['title']),
        models.Index(fields=['slug']),
        models.Index(fields=['public_id']),
        models.Index(fields=['created_at']),
        
        # SEO indexes
        models.Index(fields=['meta_title']),
    ]
```

### Index Naming Convention

For explicit index names (optional):
```python
models.Index(fields=['user_type', 'is_active'], name='user_type_active_idx')
```

---

## Meta Class Configuration

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

## Model Examples

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
            models.Index(fields=['status', 'is_featured']),
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

## Best Practices

### DO:
- ✅ Always use `db_index=True` for frequently queried fields
- ✅ Use composite indexes for common multi-field queries
- ✅ Add `verbose_name` and `help_text` for clarity
- ✅ Use `null=True, blank=True` for optional fields
- ✅ Use choices for fixed set of values
- ✅ Use `related_name` for all relationships
- ✅ Keep field ordering consistent across models
- ✅ Use appropriate `on_delete` behavior for ForeignKeys
- ✅ Add database constraints for data integrity
- ✅ Use custom managers/querysets for complex queries

### DON'T:
- ❌ Don't use `null=True` for CharField/TextField (use `blank=True` only)
- ❌ Don't over-index (each index has write overhead)
- ❌ Don't use generic field names without context
- ❌ Don't forget to set `db_table` explicitly
- ❌ Don't use Persian/Farsi in code (comments, field names, etc.)
- ❌ Don't mix ordering conventions (stick to one pattern)
- ❌ Don't forget to add indexes for foreign keys used in filters
- ❌ Don't use `auto_now_add` and `default` together

---

## PostgreSQL-Specific Optimizations

### Text Search
```python
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex

class Article(BaseModel):
    search_vector = SearchVectorField(null=True)
    
    class Meta:
        indexes = [
            GinIndex(fields=['search_vector']),
        ]
```

### Array Fields
```python
from django.contrib.postgres.fields import ArrayField

tags = ArrayField(
    models.CharField(max_length=50),
    blank=True,
    default=list,
    verbose_name="Tags"
)
```

### JSON Fields
```python
metadata = models.JSONField(
    null=True,
    blank=True,
    default=dict,
    verbose_name="Metadata"
)
```

---

## Validation

Always implement clean methods for complex validation:

```python
def clean(self):
    from django.core.exceptions import ValidationError
    
    if self.start_date and self.end_date:
        if self.start_date > self.end_date:
            raise ValidationError({
                'end_date': 'End date must be after start date'
            })
    
    super().clean()
```

---

## Summary Checklist

When creating a new model, ensure:

- [ ] Fields are ordered logically (status → content → flags → relationships)
- [ ] All frequently queried fields have `db_index=True`
- [ ] Composite indexes are defined for common query patterns
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
