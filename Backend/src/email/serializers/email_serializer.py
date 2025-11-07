from rest_framework import serializers
from src.email.models.email_message import EmailMessage
from src.email.models.email_attachment import EmailAttachment


class EmailAttachmentSerializer(serializers.ModelSerializer):
    """Serializer برای ضمیمه‌های ایمیل"""
    
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
    """Serializer برای نمایش پیام‌های ایمیل"""
    
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
    """Serializer برای دریافت پیام جدید از وب‌سایت یا اپلیکیشن"""
    
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
        ]
    
    def create(self, validated_data):
        # اضافه کردن IP و User Agent از request
        request = self.context.get('request')
        if request:
            validated_data['ip_address'] = self.get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
            
            # اگر status draft است، created_by را تنظیم کن
            if validated_data.get('status') == 'draft' and request.user.is_authenticated:
                validated_data['created_by'] = request.user
        
        return super().create(validated_data)
    
    @staticmethod
    def get_client_ip(request):
        """دریافت IP واقعی کاربر"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

