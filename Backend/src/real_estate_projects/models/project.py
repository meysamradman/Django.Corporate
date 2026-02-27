from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

from src.core.models import BaseModel, Province, City
from src.real_estate.models.location import CityRegion
from .seo import SEOMixin
from .managers import RealEstateProjectQuerySet, RealEstateProjectOfferQuerySet
from .state import RealEstateProjectState
from .type import RealEstateProjectType
from .offer_state import RealEstateProjectOfferState
from .label import RealEstateProjectLabel
from .tag import RealEstateProjectTag
from .feature import RealEstateProjectFeature


class RealEstateProject(BaseModel, SEOMixin):
    title = models.CharField(max_length=100, db_index=True, verbose_name="Project Title")
    slug = models.SlugField(
        max_length=120,
        unique=True,
        db_index=True,
        allow_unicode=True,
        verbose_name="Slug",
    )
    short_description = models.CharField(max_length=300, blank=True, verbose_name="Short Description")
    description = models.TextField(blank=True, null=True, verbose_name="Description")

    state = models.ForeignKey(
        RealEstateProjectState,
        on_delete=models.PROTECT,
        related_name="projects",
        db_index=True,
        verbose_name="Project State",
    )
    project_type = models.ForeignKey(
        RealEstateProjectType,
        on_delete=models.PROTECT,
        related_name="projects",
        db_index=True,
        verbose_name="Project Type",
    )

    is_public = models.BooleanField(default=True, db_index=True, verbose_name="Public Visibility")
    is_featured = models.BooleanField(default=False, db_index=True, verbose_name="Featured")

    province = models.ForeignKey(
        Province,
        on_delete=models.PROTECT,
        related_name="real_estate_projects",
        verbose_name="Province",
    )
    city = models.ForeignKey(
        City,
        on_delete=models.PROTECT,
        related_name="real_estate_projects",
        verbose_name="City",
    )
    region = models.ForeignKey(
        CityRegion,
        on_delete=models.SET_NULL,
        related_name="real_estate_projects",
        null=True,
        blank=True,
        verbose_name="Region",
    )
    neighborhood = models.CharField(max_length=120, blank=True, verbose_name="Neighborhood")
    address = models.TextField(blank=True, verbose_name="Address")

    labels = models.ManyToManyField(
        RealEstateProjectLabel,
        blank=True,
        related_name="projects",
        verbose_name="Labels",
    )
    tags = models.ManyToManyField(
        RealEstateProjectTag,
        blank=True,
        related_name="projects",
        verbose_name="Tags",
    )
    features = models.ManyToManyField(
        RealEstateProjectFeature,
        blank=True,
        related_name="projects",
        verbose_name="Features",
    )

    developer = models.CharField(max_length=100, blank=True, verbose_name="Developer")
    total_duration_months = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MaxValueValidator(240)],
        verbose_name="Total Project Duration (Months)",
    )
    elapsed_months = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(240)],
        verbose_name="Elapsed Months",
    )

    floors_count = models.PositiveSmallIntegerField(default=0, verbose_name="Floors Count")
    units_count = models.PositiveIntegerField(default=0, verbose_name="Units Count")

    total_area = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Total Usable Area",
    )
    remaining_area = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Remaining Area",
    )

    base_price = models.BigIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Base Price",
    )
    regional_avg_price = models.BigIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Regional Average Price",
    )
    min_investment_amount = models.BigIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name="Minimum Investment Amount",
    )
    realized_profit_percent = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        verbose_name="Realized Profit (%)",
    )
    progress_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Progress Percentage",
    )

    funding_started_at = models.DateField(null=True, blank=True, verbose_name="Funding Start Date")
    estimated_end_date = models.DateField(null=True, blank=True, verbose_name="Estimated End Date")

    views_count = models.PositiveIntegerField(default=0, verbose_name="Total Views")
    extra_attributes = models.JSONField(default=dict, blank=True, verbose_name="Extra Attributes")
    objects = RealEstateProjectQuerySet.as_manager()

    class Meta(BaseModel.Meta, SEOMixin.Meta):
        db_table = "real_estate_projects"
        verbose_name = "Real Estate Project"
        verbose_name_plural = "Real Estate Projects"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["state", "is_public", "-created_at"]),
            models.Index(fields=["project_type", "state", "-created_at"]),
            models.Index(fields=["province", "city"]),
            models.Index(fields=["is_featured", "-created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(elapsed_months__gte=0),
                name="re_projects_elapsed_months_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(total_duration_months__isnull=True) | models.Q(total_duration_months__gte=0),
                name="re_projects_total_duration_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(base_price__isnull=True) | models.Q(base_price__gte=0),
                name="re_projects_base_price_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(regional_avg_price__isnull=True) | models.Q(regional_avg_price__gte=0),
                name="re_projects_regional_avg_non_negative",
            ),
        ]

    def __str__(self):
        return self.title

    @property
    def months_remaining(self):
        if self.total_duration_months is None:
            return None
        return max(self.total_duration_months - (self.elapsed_months or 0), 0)

    def get_absolute_url(self):
        return f"/projects/{self.slug}/"

    def get_public_url(self):
        return f"/projects/p/{self.public_id}/"

    def save(self, *args, **kwargs):
        if self.total_duration_months is not None and self.elapsed_months > self.total_duration_months:
            self.elapsed_months = self.total_duration_months

        if self.funding_started_at and self.estimated_end_date:
            if self.estimated_end_date < self.funding_started_at:
                self.estimated_end_date = self.funding_started_at

        if self.funding_started_at and self.total_duration_months is None and self.estimated_end_date:
            days = (self.estimated_end_date - self.funding_started_at).days
            if days >= 0:
                self.total_duration_months = max(round(days / 30), 0)

        state_slug = (self.state.slug if self.state_id else "").lower().strip()
        if self.funding_started_at and self.elapsed_months == 0 and state_slug in {"active", "completed"}:
            now_date = timezone.now().date()
            if now_date >= self.funding_started_at:
                self.elapsed_months = max(round((now_date - self.funding_started_at).days / 30), 0)

        super().save(*args, **kwargs)


class RealEstateProjectOffer(BaseModel):
    project = models.ForeignKey(
        RealEstateProject,
        on_delete=models.CASCADE,
        related_name="offers",
        db_index=True,
        verbose_name="Project",
    )
    unit_name = models.CharField(max_length=180, verbose_name="Unit Name")
    supply_amount = models.DecimalField(
        max_digits=16,
        decimal_places=4,
        validators=[MinValueValidator(0)],
        verbose_name="Supply Amount",
    )
    offer_price = models.BigIntegerField(
        validators=[MinValueValidator(0)],
        verbose_name="Offer Price",
    )
    offer_state = models.ForeignKey(
        RealEstateProjectOfferState,
        on_delete=models.PROTECT,
        related_name="offers",
        db_index=True,
        verbose_name="Offer State",
    )
    order = models.PositiveIntegerField(default=0, db_index=True, verbose_name="Display Order")
    is_available = models.BooleanField(default=True, db_index=True, verbose_name="Is Available")
    objects = RealEstateProjectOfferQuerySet.as_manager()

    class Meta(BaseModel.Meta):
        db_table = "real_estate_project_offers"
        verbose_name = "Project Market Offer"
        verbose_name_plural = "Project Market Offers"
        ordering = ["order", "-created_at"]
        indexes = [
            models.Index(fields=["project", "order"]),
            models.Index(fields=["project", "is_available"]),
            models.Index(fields=["project", "offer_state"]),
        ]

    def __str__(self):
        return f"{self.project.title} - {self.unit_name}"
