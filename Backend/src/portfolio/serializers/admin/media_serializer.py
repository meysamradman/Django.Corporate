from rest_framework import serializers
import json

class PortfolioMediaSerializer(serializers.Serializer):
    media_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        help_text="List of media IDs to associate with the portfolio"
    )
    media_files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        help_text="List of media files to upload and associate with the portfolio"
    )

    def validate_media_ids(self, value):
        if value is None:
            return []
        return value

    def to_internal_value(self, data):
        processed_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        media_ids_str = processed_data.get('media_ids')
        if media_ids_str:
            try:
                if isinstance(media_ids_str, str) and media_ids_str.startswith('['):
                    processed_data['media_ids'] = json.loads(media_ids_str)
                elif isinstance(media_ids_str, str):
                    if not media_ids_str.strip():
                        processed_data['media_ids'] = []
                    else:
                        processed_data['media_ids'] = [
                            int(id.strip()) for id in media_ids_str.split(',') 
                            if id.strip().isdigit()
                        ]
                elif isinstance(media_ids_str, list):
                    processed_data['media_ids'] = media_ids_str
                elif isinstance(media_ids_str, int):
                    processed_data['media_ids'] = [media_ids_str]
                else:
                    processed_data['media_ids'] = []
            except (json.JSONDecodeError, TypeError, ValueError):
                try:
                    if isinstance(media_ids_str, (str, int)) and str(media_ids_str).isdigit():
                        processed_data['media_ids'] = [int(media_ids_str)]
                    else:
                        processed_data['media_ids'] = []
                except (TypeError, ValueError):
                    processed_data['media_ids'] = []
        else:
            processed_data['media_ids'] = []
        
        validated_data = super().to_internal_value(processed_data)
        
        return validated_data
    
    def validate(self, attrs):
        return attrs
