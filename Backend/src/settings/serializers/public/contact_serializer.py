from rest_framework import serializers

from src.settings.models import (
    ContactPhone,
    ContactMobile,
    ContactEmail,
    SocialMedia,
    MapSettings,
)


class PublicContactPhoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactPhone
        fields = [
            'phone_number',
            'label',
            'order',
        ]


class PublicContactMobileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMobile
        fields = [
            'mobile_number',
            'label',
            'order',
        ]


class PublicContactEmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactEmail
        fields = [
            'email',
            'label',
            'order',
        ]


class PublicSocialMediaSerializer(serializers.ModelSerializer):
    icon_url = serializers.SerializerMethodField()

    class Meta:
        model = SocialMedia
        fields = [
            'name',
            'url',
            'order',
            'icon_url',
        ]

    def get_icon_url(self, obj):
        if obj.icon and getattr(obj.icon, 'file', None):
            return obj.icon.file.url
        return None


class PublicMapSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapSettings
        fields = [
            'provider',
            'configs',
        ]


class PublicContactSettingsSerializer(serializers.Serializer):
    phones = PublicContactPhoneSerializer(many=True)
    mobiles = PublicContactMobileSerializer(many=True)
    emails = PublicContactEmailSerializer(many=True)
    social_media = PublicSocialMediaSerializer(many=True)
    map_settings = PublicMapSettingsSerializer(allow_null=True)
