from rest_framework import serializers
from src.ticket.models.ticket import Ticket
from src.ticket.models.ticket_message import TicketMessage
from src.ticket.serializers.ticket_message_serializer import TicketMessageSerializer
from src.user.serializers.user.user_public_serializer import UserPublicSerializer
from src.user.serializers.admin.admin_profile_serializer import AdminProfileSerializer


class TicketListSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    assigned_admin = AdminProfileSerializer(read_only=True)
    messages_count = serializers.SerializerMethodField()
    unread_messages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_id',
            'subject',
            'status',
            'priority',
            'user',
            'assigned_admin',
            'last_replied_at',
            'created_at',
            'updated_at',
            'messages_count',
            'unread_messages_count',
        ]
    
    def get_messages_count(self, obj):
        # استفاده از annotate اگر موجود باشه
        if hasattr(obj, 'messages_count'):
            return obj.messages_count
        return obj.messages.count()
    
    def get_unread_messages_count(self, obj):
        # استفاده از annotate اگر موجود باشه
        if hasattr(obj, 'unread_messages_count'):
            return obj.unread_messages_count
        return obj.messages.filter(is_read=False, sender_type='user').count()


class TicketDetailSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)
    assigned_admin = AdminProfileSerializer(read_only=True)
    messages = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()
    unread_messages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_id',
            'subject',
            'description',
            'status',
            'priority',
            'user',
            'assigned_admin',
            'last_replied_at',
            'created_at',
            'updated_at',
            'is_active',
            'messages',
            'messages_count',
            'unread_messages_count',
        ]
    
    def get_messages(self, obj):
        messages = obj.messages.all().order_by('created_at')
        return TicketMessageSerializer(messages, many=True).data
    
    def get_messages_count(self, obj):
        # استفاده از annotate اگر موجود باشه
        if hasattr(obj, 'messages_count'):
            return obj.messages_count
        return obj.messages.count()
    
    def get_unread_messages_count(self, obj):
        # استفاده از annotate اگر موجود باشه
        if hasattr(obj, 'unread_messages_count'):
            return obj.unread_messages_count
        return obj.messages.filter(is_read=False, sender_type='user').count()


class TicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = [
            'id',
            'public_id',
            'subject',
            'description',
            'status',
            'priority',
            'user',
            'assigned_admin',
            'last_replied_at',
            'created_at',
            'updated_at',
            'is_active',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at', 'last_replied_at']

