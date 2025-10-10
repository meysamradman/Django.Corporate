import django_filters
from src.media.models.media import Media

class MediaFilter(django_filters.FilterSet):
    file_type = django_filters.CharFilter(field_name="media_type", lookup_expr="iexact")
    title = django_filters.CharFilter(field_name="title", lookup_expr="icontains")
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = Media
        fields = ['file_type', 'title', 'is_active']