from rest_framework import serializers
from src.ticket.models.ticket_message import TicketMessage
from src.ticket.models.ticket_attachment import TicketAttachment
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
            raise serializers.ValidationError("sender_type must be 'user' or 'admin'")
        return attrs
    
    def create(self, validated_data):
        attachment_ids = validated_data.pop('attachment_ids', [])
        sender_type = validated_data.get('sender_type')
        request = self.context.get('request')
        
        if sender_type == 'user' and request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['sender_user'] = request.user
        elif sender_type == 'admin' and request and hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'admin_profile'):
                validated_data['sender_admin'] = request.user.admin_profile
        
        message = TicketMessage.objects.create(**validated_data)
        
        if attachment_ids:
            from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
            
            for media_id in attachment_ids:
                attachment = TicketAttachment(ticket_message=message)
                
                image = ImageMedia.objects.filter(id=media_id, is_active=True).first()
                if image:
                    attachment.image = image
                    attachment.save()
                    continue
                
                video = VideoMedia.objects.filter(id=media_id, is_active=True).first()
                if video:
                    attachment.video = video
                    attachment.save()
                    continue
                
                audio = AudioMedia.objects.filter(id=media_id, is_active=True).first()
                if audio:
                    attachment.audio = audio
                    attachment.save()
                    continue
                
                document = DocumentMedia.objects.filter(id=media_id, is_active=True).first()
                if document:
                    attachment.document = document
                    attachment.save()
                    continue
        
        return message

