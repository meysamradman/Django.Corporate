import uuid
from django.db import models
from django.utils import timezone


class BaseModel(models.Model):
    id = models.AutoField(primary_key=True, editable=False)
    public_id = models.UUIDField(
        default=uuid.uuid4, 
        unique=True, 
        editable=False,
        verbose_name="Public ID",
        db_index=True,
        help_text="Unique identifier for public-facing operations"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Active Status",
        help_text="Designates whether this record should be treated as active"
    )
    created_at = models.DateTimeField(
        default=timezone.now, 
        db_index=True,
        verbose_name="Created At",
        help_text="Date and time when the record was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Updated At", 
        help_text="Date and time when the record was last updated"
    )

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['public_id']),
            models.Index(fields=['is_active', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.__class__.__name__} ({self.public_id})"
    
    def get_public_url(self):
        app_label = self._meta.app_label
        model_name = self._meta.model_name
        return f"/{app_label}/{model_name}/{self.public_id}/"
    
    @property
    def is_new(self):
        return self.pk is None
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)