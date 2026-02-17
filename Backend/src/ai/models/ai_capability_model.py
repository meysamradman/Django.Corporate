from __future__ import annotations

from django.db import models
from django.db.models import Q
from django.core.cache import cache

from src.ai.models.ai_provider import AIProvider
from src.ai.utils.cache import AICacheKeys
from src.ai.utils.cache_ttl import AICacheTTL


class AICapabilityModelManager(models.Manager):
    CACHE_TIMEOUT = AICacheTTL.ACTIVE_MODEL

    def get_active(self, capability: str):
        capability = (capability or '').strip().lower()
        if not capability:
            return None

        cache_key = AICacheKeys.active_capability_model(capability)
        model_id = cache.get(cache_key)
        if model_id is not None:
            try:
                return self.select_related('provider').get(id=model_id, is_active=True)
            except self.model.DoesNotExist:
                cache.delete(cache_key)

        model = (
            self.filter(is_active=True, capability=capability, provider__is_active=True)
            .select_related('provider')
            .order_by('sort_order', 'id')
            .first()
        )
        if model:
            cache.set(cache_key, model.id, self.CACHE_TIMEOUT)
        return model


class AICapabilityModel(models.Model):
    CAPABILITY_CHOICES = [
        ('chat', 'Chat'),
        ('content', 'Content'),
        ('image', 'Image'),
        ('audio', 'Audio'),
    ]

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text='Is active?',
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Created at',
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Updated at',
    )

    capability = models.CharField(
        max_length=20,
        choices=CAPABILITY_CHOICES,
        db_index=True,
        help_text='Feature capability this model is used for',
    )

    provider = models.ForeignKey(
        AIProvider,
        on_delete=models.CASCADE,
        related_name='capability_models',
        db_index=True,
    )

    model_id = models.CharField(
        max_length=200,
        help_text="API model identifier (e.g., 'gpt-4o', 'dall-e-3')",
    )

    display_name = models.CharField(
        max_length=200,
        help_text='Human-readable model name',
    )

    config = models.JSONField(
        default=dict,
        blank=True,
        help_text='Optional per-capability model config passed to provider',
    )

    sort_order = models.IntegerField(
        default=0,
        db_index=True,
        help_text='Ordering within capability (lower is preferred)',
    )

    objects = AICapabilityModelManager()

    class Meta:
        db_table = 'ai_capability_models'
        verbose_name = 'AI Capability Model'
        verbose_name_plural = 'AI Capability Models'
        ordering = ['capability', 'sort_order', 'id']
        unique_together = ['capability', 'provider', 'model_id']
        constraints = [
            models.UniqueConstraint(
                fields=['capability'],
                condition=Q(is_active=True),
                name='ai_unique_active_model_per_capability',
            )
        ]

    def __str__(self) -> str:
        return f"{self.capability}: {self.provider.slug} / {self.display_name}"

    def save(self, *args, **kwargs):
        if self.is_active:
            AICapabilityModel.objects.filter(
                capability=self.capability,
                is_active=True,
            ).exclude(pk=self.pk).update(is_active=False)

        super().save(*args, **kwargs)

        cache.delete(AICacheKeys.active_capability_model(self.capability))
