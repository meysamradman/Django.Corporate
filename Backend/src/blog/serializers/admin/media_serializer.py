from rest_framework import serializers
import json


class BlogMediaSerializer(serializers.Serializer):
    """
    Serializer for adding media to a blog
    Supports multiple formats for media_ids:
    - Comma-separated string: "1,2,3"
    - JSON array: [1,2,3]
    - Single integer: 1
    """
    media_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        help_text="List of media IDs to associate with the blog"
    )
    media_files = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True,
        help_text="List of media files to upload and associate with the blog"
    )

    def validate_media_ids(self, value):
        """Validate and normalize media_ids"""
        if value is None:
            return []
        return value

    def to_internal_value(self, data):
        """
        Handle different input formats for media_ids:
        - Comma-separated string: "1,2,3"
        - JSON array: [1,2,3]
        - Single integer: 1
        """
        # Make a copy of data to avoid modifying the original
        processed_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # Handle media_ids in different formats
        media_ids_str = processed_data.get('media_ids')
        if media_ids_str:
            try:
                # Try to parse as JSON array first
                if isinstance(media_ids_str, str) and media_ids_str.startswith('['):
                    processed_data['media_ids'] = json.loads(media_ids_str)
                # If it's a comma-separated string, split it
                elif isinstance(media_ids_str, str):
                    # Handle empty string case
                    if not media_ids_str.strip():
                        processed_data['media_ids'] = []
                    else:
                        processed_data['media_ids'] = [
                            int(id.strip()) for id in media_ids_str.split(',') 
                            if id.strip().isdigit()
                        ]
                # If it's already a list, keep it as is
                elif isinstance(media_ids_str, list):
                    processed_data['media_ids'] = media_ids_str
                # If it's a single integer
                elif isinstance(media_ids_str, int):
                    processed_data['media_ids'] = [media_ids_str]
                else:
                    processed_data['media_ids'] = []
            except (json.JSONDecodeError, TypeError, ValueError):
                # If parsing fails, try to treat it as a single ID
                try:
                    if isinstance(media_ids_str, (str, int)) and str(media_ids_str).isdigit():
                        processed_data['media_ids'] = [int(media_ids_str)]
                    else:
                        processed_data['media_ids'] = []
                except (TypeError, ValueError):
                    processed_data['media_ids'] = []
        else:
            processed_data['media_ids'] = []
        
        # Call parent to_internal_value to get validated data
        validated_data = super().to_internal_value(processed_data)
        
        # Validate that at least one of media_ids or media_files is provided
        media_ids = validated_data.get('media_ids', [])
        media_files = validated_data.get('media_files', [])
        
        # Note: media_files might not be in validated_data yet if it's in request.FILES
        # We'll check this in validate() method instead
        
        return validated_data
    
    def validate(self, attrs):
        """
        Validate that at least one of media_ids or media_files is provided.
        Note: media_files might be in request.FILES, not in attrs, so we don't
        validate here. The view will handle this check.
        """
        return attrs