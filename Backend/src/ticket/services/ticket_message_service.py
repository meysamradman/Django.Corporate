from src.ticket.models.ticket_message import TicketMessage
from src.ticket.models.ticket_attachment import TicketAttachment
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia


class TicketMessageService:
    
    @staticmethod
    def create_message_with_attachments(validated_data, attachment_ids=None, sender_user=None, sender_admin=None):
        if sender_user:
            validated_data['sender_user'] = sender_user
        if sender_admin:
            validated_data['sender_admin'] = sender_admin
        
        message = TicketMessage.objects.create(**validated_data)
        
        if attachment_ids:
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
