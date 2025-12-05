from rest_framework import serializers

from src.email.models.email_attachment import EmailAttachment
from src.email.models.email_message import EmailMessage


class EmailAttachmentSerializer(serializers.ModelSerializer):
    
    file_size_formatted = serializers.ReadOnlyField()
    
    class Meta:
        model = EmailAttachment
        fields = [
            'id',
            'filename',
            'file',
            'file_size',
            'file_size_formatted',
            'content_type',
            'created_at',
        ]
        read_only_fields = ['id', 'file_size', 'file_size_formatted', 'content_type', 'created_at']


class EmailMessageSerializer(serializers.ModelSerializer):
    
    attachments = EmailAttachmentSerializer(many=True, read_only=True)
    has_attachments = serializers.ReadOnlyField()
    is_new = serializers.ReadOnlyField()
    is_replied = serializers.ReadOnlyField()
    is_draft = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = EmailMessage
        fields = [
            'id',
            'public_id',
            'name',
            'email',
            'phone',
            'subject',
            'message',
            'dynamic_fields',
            'status',
            'status_display',
            'source',
            'source_display',
            'ip_address',
            'user_agent',
            'reply_message',
            'replied_at',
            'replied_by',
            'read_at',
            'attachments',
            'has_attachments',
            'is_new',
            'is_replied',
            'is_draft',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'public_id',
            'ip_address',
            'user_agent',
            'replied_at',
            'replied_by',
            'read_at',
            'attachments',
            'has_attachments',
            'is_new',
            'is_replied',
            'is_draft',
            'created_by',
            'created_at',
            'updated_at',
        ]


class EmailMessageCreateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = EmailMessage
        fields = [
            'name',
            'email',
            'phone',
            'subject',
            'message',
            'source',
            'status',
            'dynamic_fields',
        ]
        extra_kwargs = {
            'name': {'required': False},
            'email': {'required': False},
            'phone': {'required': False},
            'subject': {'required': False},
            'message': {'required': False},
        }

