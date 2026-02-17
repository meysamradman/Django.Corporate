from rest_framework import serializers

from src.settings.models import FooterSection, FooterLink

class PublicFooterLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = FooterLink
        fields = [
            'title',
            'href',
            'order',
        ]

class PublicFooterSectionSerializer(serializers.ModelSerializer):
    links = serializers.SerializerMethodField()

    class Meta:
        model = FooterSection
        fields = [
            'title',
            'order',
            'links',
        ]

    def get_links(self, obj):
        qs = obj.links.filter(is_active=True).order_by('order', '-created_at')
        return PublicFooterLinkSerializer(qs, many=True).data
