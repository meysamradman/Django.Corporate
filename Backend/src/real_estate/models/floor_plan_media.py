from django.db import models
from django.core.exceptions import ValidationError
from src.core.models.base import BaseModel
from src.real_estate.models.floor_plan import RealEstateFloorPlan
from src.media.models.media import ImageMedia

class FloorPlanImage(BaseModel):

    floor_plan = models.ForeignKey(
        RealEstateFloorPlan,
        on_delete=models.CASCADE,
        related_name="images",
        db_index=True,
        verbose_name="Floor Plan",
        help_text="Floor plan this image belongs to"
    )
    image = models.ForeignKey(
        ImageMedia,
        on_delete=models.CASCADE,
        related_name="floor_plan_links",
        db_index=True,
        verbose_name="Image File",
        help_text="Image media file (blueprint, 3D render, or photo)"
    )
    
    is_main = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Main Image",
        help_text="Designates whether this is the main image for the floor plan"
    )
    
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name="Display Order",
        help_text="Order in which this image should be displayed"
    )
    
    title = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Image Title",
        help_text="Optional title for this image (e.g., '2D Blueprint', '3D Render')"
    )
    
    description = models.TextField(
        blank=True,
        verbose_name="Description",
        help_text="Optional description for this image"
    )

    class Meta(BaseModel.Meta):
        db_table = "real_estate_floor_plan_images"
        verbose_name = "Floor Plan Image"
        verbose_name_plural = "Floor Plan Images"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["floor_plan", "is_main"]),
            models.Index(fields=["floor_plan", "order"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['floor_plan', 'image'],
                name='unique_floor_plan_image'
            ),
        ]

    def clean(self):
        
        if self.is_main:
            exists = FloorPlanImage.objects.filter(
                floor_plan=self.floor_plan,
                is_main=True
            ).exclude(pk=self.pk).exists()
            if exists:
                raise ValidationError("Only one main image is allowed per floor plan.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.floor_plan.title} - {self.title or self.image.title or 'Image'}"
