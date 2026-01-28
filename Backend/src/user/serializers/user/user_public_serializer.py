from rest_framework import serializers
from src.user.models import User

class UserPublicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'public_id',
            'mobile',
            'email',
            'full_name',
        ]
        read_only_fields = ['id', 'public_id', 'mobile', 'email', 'full_name']
    
    def get_full_name(self, obj):
        if obj.user_type == 'user' and hasattr(obj, 'user_profile') and obj.user_profile:
            profile = obj.user_profile
            if profile.first_name and profile.last_name:
                return f"{profile.first_name} {profile.last_name}"
        
        return obj.mobile or obj.email or str(obj.id)

