from rest_framework import serializers
from src.ticket.models.ticket_attachment import TicketAttachment
from src.media.serializers.media_serializer import MediaAdminSerializer

class TicketAttachmentSerializer(serializers.ModelSerializer):
    media = serializers.SerializerMethodField()
    media_type = serializers.SerializerMethodField()
    media_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketAttachment
        fields = [
            'id',
            'public_id',
            'ticket_message',
            'image',
            'video',
            'audio',
            'document',
            'media',
            'media_type',
            'media_url',
            'created_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at']
    
    def get_media(self, obj):
        media = obj.get_media()
        if media:
            return MediaAdminSerializer(media).data
        return None
    
    def get_media_type(self, obj):
        if obj.image:
            return 'image'
        elif obj.video:
            return 'video'
        elif obj.audio:
            return 'audio'
        elif obj.document:
            return 'document'
        return None
    
    def get_media_url(self, obj):
        media = obj.get_media()
        if media and media.file:
            return media.file.url
        return None

