from rest_framework import serializers
from src.ticket.models.ticket_message import TicketMessage
from src.ticket.models.ticket_attachment import TicketAttachment
from src.ticket.messages.messages import TICKET_ERRORS
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.user.serializers.user.user_public_serializer import UserPublicSerializer
from src.user.serializers.admin.admin_profile_serializer import AdminProfileSerializer
from .ticket_attachment_serializer import TicketAttachmentSerializer

class TicketMessageSerializer(serializers.ModelSerializer):
    sender_user = UserPublicSerializer(read_only=True)
    sender_admin = AdminProfileSerializer(read_only=True)
    attachments = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketMessage
        fields = [
            'id',
            'public_id',
            'ticket',
            'message',
            'sender_type',
            'sender_user',
            'sender_admin',
            'is_read',
            'created_at',
            'updated_at',
            'attachments',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
    
    def get_attachments(self, obj):
        attachments = obj.attachments.all().order_by('created_at')
        return TicketAttachmentSerializer(attachments, many=True).data

class TicketMessageCreateSerializer(serializers.ModelSerializer):
    attachment_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=True,
        help_text="List of media IDs to attach (image, video, audio, or document)"
    )
    
    class Meta:
        model = TicketMessage
        fields = [
            'ticket',
            'message',
            'sender_type',
            'attachment_ids',
        ]
    
    def validate(self, attrs):
        sender_type = attrs.get('sender_type')
        if sender_type not in ['user', 'admin']:
            raise serializers.ValidationError(TICKET_ERRORS['invalid_sender_type'])
        return attrs

