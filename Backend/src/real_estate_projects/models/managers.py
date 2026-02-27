from django.db import models
from django.db.models import Prefetch, Q, Count


class RealEstateProjectQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def public(self):
        return self.filter(is_public=True)

    def visible(self):
        return self.active().public()

    def funding(self):
        return self.filter(state__slug="funding")

    def featured(self):
        return self.filter(is_featured=True)

    def with_seo(self):
        return self.only(
            "id",
            "public_id",
            "title",
            "slug",
            "short_description",
            "state",
            "meta_title",
            "meta_description",
            "og_title",
            "og_description",
            "og_image",
            "canonical_url",
            "created_at",
            "updated_at",
        )

    def for_admin_listing(self):
        from src.real_estate_projects.models.media import RealEstateProjectImage

        return self.select_related(
            "province",
            "city",
            "region",
            "og_image",
        ).prefetch_related(
            Prefetch(
                "images",
                queryset=RealEstateProjectImage.objects.select_related("image")
                .filter(is_main=True)
                .order_by("project_id", "order", "created_at", "id")
                .distinct("project_id"),
                to_attr="main_image_prefetch",
            ),
        )

    def for_public_listing(self):
        from src.real_estate_projects.models.media import RealEstateProjectImage

        return self.visible().select_related(
            "province",
            "city",
            "region",
            "og_image",
        ).prefetch_related(
            Prefetch(
                "images",
                queryset=RealEstateProjectImage.objects.filter(is_main=True).select_related("image"),
                to_attr="main_image_media",
            ),
        )

    def for_detail(self):
        from src.real_estate_projects.models.media import (
            RealEstateProjectImage,
            RealEstateProjectVideo,
            RealEstateProjectAudio,
            RealEstateProjectDocument,
        )

        return self.select_related(
            "province",
            "city",
            "region",
            "og_image",
            "created_by",
        ).prefetch_related(
            Prefetch(
                "images",
                queryset=RealEstateProjectImage.objects.select_related("image").order_by("is_main", "order", "created_at"),
                to_attr="all_images",
            ),
            Prefetch(
                "videos",
                queryset=RealEstateProjectVideo.objects.select_related("video", "video__cover_image", "cover_image").order_by("order", "created_at"),
            ),
            Prefetch(
                "audios",
                queryset=RealEstateProjectAudio.objects.select_related("audio", "audio__cover_image", "cover_image").order_by("order", "created_at"),
            ),
            Prefetch(
                "documents",
                queryset=RealEstateProjectDocument.objects.select_related("document", "document__cover_image", "cover_image").order_by("order", "created_at"),
            ),
            "offers",
        )

    def search(self, query):
        query = (query or "").strip()
        if len(query) < 2:
            return self
        return self.filter(
            Q(title__icontains=query)
            | Q(short_description__icontains=query)
            | Q(description__icontains=query)
            | Q(developer__icontains=query)
            | Q(city__name__icontains=query)
            | Q(province__name__icontains=query)
            | Q(region__name__icontains=query)
            | Q(neighborhood__icontains=query)
            | Q(slug__icontains=query)
        ).distinct()

    def by_city(self, city_id):
        return self.filter(city_id=city_id)

    def by_type(self, project_type):
        return self.filter(project_type__slug=project_type)


class RealEstateProjectOfferQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def available(self):
        return self.filter(is_available=True)

    def for_project(self, project_id):
        return self.filter(project_id=project_id)


class RealEstateProjectTypeQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def public(self):
        return self.filter(is_active=True, is_public=True)

    def with_counts(self):
        return self.annotate(
            projects_count=Count("projects", filter=Q(projects__is_active=True))
        )


class RealEstateProjectStateQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def public(self):
        return self.filter(is_active=True, is_public=True)

    def with_counts(self):
        return self.annotate(
            projects_count=Count("projects", filter=Q(projects__is_active=True))
        )


class RealEstateProjectOfferStateQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def public(self):
        return self.filter(is_active=True, is_public=True)

    def with_counts(self):
        return self.annotate(
            offers_count=Count("offers", filter=Q(offers__is_active=True))
        )


class RealEstateProjectLabelQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def with_counts(self):
        return self.annotate(
            projects_count=Count("projects", filter=Q(projects__is_active=True))
        )


class RealEstateProjectFeatureQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def by_group(self, group):
        return self.filter(group=group)

    def with_counts(self):
        return self.annotate(
            projects_count=Count("projects", filter=Q(projects__is_active=True))
        )


class RealEstateProjectTagQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True, is_public=True)

    def public(self):
        return self.filter(is_public=True)

    def popular(self, limit=10):
        return self.filter(is_public=True).annotate(
            usage_count=Count("projects", filter=Q(projects__is_active=True, projects__is_public=True))
        ).order_by("-usage_count")[:limit]

    def with_counts(self):
        return self.annotate(
            projects_count=Count("projects", filter=Q(projects__is_active=True, projects__is_public=True))
        )
