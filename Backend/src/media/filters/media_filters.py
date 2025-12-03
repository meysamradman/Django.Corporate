import django_filters
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia

class MediaFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = ImageMedia
        fields = ['title', 'is_active']