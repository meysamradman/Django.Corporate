import re

from rest_framework import serializers

from src.form.models import ContactFormField


class ContactFormFieldSerializer(serializers.ModelSerializer):
    """Serializer برای نمایش کامل فیلد فرم"""
    
    class Meta:
        model = ContactFormField
        fields = [
            'id',
            'public_id',
            'field_key',
            'field_type',
            'label',
            'placeholder',
            'required',
            'platforms',
            'options',
            'validation_rules',
            'order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'public_id',
            'created_at',
            'updated_at',
        ]
    
    def validate_field_key(self, value):
        """اعتبارسنجی field_key"""
        if value and len(value.strip()) < 2:
            raise serializers.ValidationError("کلید فیلد باید حداقل 2 کاراکتر باشد")
        
        # بررسی فرمت (فقط حروف انگلیسی، اعداد و underscore)
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', value):
            raise serializers.ValidationError("کلید فیلد باید با حرف یا underscore شروع شود و فقط شامل حروف، اعداد و underscore باشد")
        
        return value.strip()
    
    def validate_platforms(self, value):
        """اعتبارسنجی platforms"""
        if not isinstance(value, list):
            raise serializers.ValidationError("platforms باید یک لیست باشد")
        
        valid_platforms = ['website', 'mobile_app']
        for platform in value:
            if platform not in valid_platforms:
                raise serializers.ValidationError(f"پلتفرم نامعتبر: {platform}. باید یکی از {valid_platforms} باشد")
        
        if not value:
            raise serializers.ValidationError("حداقل یک پلتفرم باید انتخاب شود")
        
        return value
    
    def validate_options(self, value):
        """اعتبارسنجی options برای فیلدهای انتخابی"""
        if not value:
            return value
        
        if not isinstance(value, list):
            raise serializers.ValidationError("options باید یک لیست باشد")
        
        field_type = self.initial_data.get('field_type') or (self.instance.field_type if self.instance else None)
        if field_type in ['select', 'radio']:
            if not value:
                raise serializers.ValidationError(f"فیلدهای {field_type} باید حداقل یک گزینه داشته باشند")
            
            for option in value:
                if not isinstance(option, dict):
                    raise serializers.ValidationError("هر گزینه باید یک دیکشنری باشد")
                if 'value' not in option or 'label' not in option:
                    raise serializers.ValidationError("هر گزینه باید دارای 'value' و 'label' باشد")
                if not option.get('value') or not option.get('label'):
                    raise serializers.ValidationError("'value' و 'label' نمی‌توانند خالی باشند")
        
        return value


class ContactFormFieldCreateSerializer(ContactFormFieldSerializer):
    """Serializer برای ایجاد فیلد جدید"""
    
    class Meta(ContactFormFieldSerializer.Meta):
        pass


class ContactFormFieldUpdateSerializer(ContactFormFieldSerializer):
    """Serializer برای به‌روزرسانی فیلد"""
    
    field_key = serializers.CharField(read_only=True)  # نمی‌توان کلید را تغییر داد
    
    class Meta(ContactFormFieldSerializer.Meta):
        pass

