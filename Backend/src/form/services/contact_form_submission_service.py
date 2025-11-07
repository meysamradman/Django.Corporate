import re

from django.core.exceptions import ValidationError
from django.db import transaction

from src.form.models import ContactFormField


def validate_form_submission(form_data, platform):
    """
    اعتبارسنجی داده‌های ارسال شده بر اساس فیلدهای تعریف شده
    
    Args:
        form_data: داده‌های ارسال شده
        platform: پلتفرم ('website' یا 'mobile_app')
    
    Returns:
        dict: {'valid': bool, 'errors': dict}
    
    Raises:
        ValidationError: در صورت خطا
    """
    if not isinstance(form_data, dict):
        raise ValidationError("form_data باید یک دیکشنری باشد")
    
    if platform not in ['website', 'mobile_app']:
        raise ValidationError("پلتفرم نامعتبر")
    
    # دریافت فیلدهای فعال برای پلتفرم
    fields = ContactFormField.objects.filter(
        is_active=True,
        platforms__contains=[platform]
    ).order_by('order')
    
    errors = {}
    
    # بررسی فیلدهای الزامی
    for field in fields:
        field_key = field.field_key
        value = form_data.get(field_key)
        
        if field.required:
            if not value or (isinstance(value, str) and not value.strip()):
                errors[field_key] = f"فیلد '{field.label}' الزامی است"
        
        # اعتبارسنجی بر اساس نوع فیلد
        if value:
            if field.field_type == 'email':
                if '@' not in str(value):
                    errors[field_key] = f"ایمیل نامعتبر است"
            
            elif field.field_type == 'phone':
                if not str(value).replace(' ', '').replace('-', '').isdigit():
                    errors[field_key] = f"شماره تلفن نامعتبر است"
            
            elif field.field_type == 'number':
                try:
                    float(value)
                except (ValueError, TypeError):
                    errors[field_key] = f"عدد نامعتبر است"
            
            elif field.field_type in ['select', 'radio']:
                valid_options = [opt['value'] for opt in (field.options or [])]
                if value not in valid_options:
                    errors[field_key] = f"گزینه انتخاب شده نامعتبر است"
            
            # اعتبارسنجی بر اساس validation_rules
            if field.validation_rules:
                rules = field.validation_rules
                value_str = str(value)
                
                if 'min_length' in rules and len(value_str) < rules['min_length']:
                    errors[field_key] = f"حداقل {rules['min_length']} کاراکتر لازم است"
                
                if 'max_length' in rules and len(value_str) > rules['max_length']:
                    errors[field_key] = f"حداکثر {rules['max_length']} کاراکتر مجاز است"
                
                if 'pattern' in rules:
                    if not re.match(rules['pattern'], value_str):
                        errors[field_key] = "فرمت نامعتبر است"
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


@transaction.atomic
def create_contact_form_submission(validated_data):
    """
    اعتبارسنجی فرم و تبدیل مستقیم به EmailMessage
    
    Args:
        validated_data: داده‌های معتبر شده
    
    Returns:
        EmailMessage: پیام ایمیل ایجاد شده
    
    Raises:
        ValidationError: در صورت خطا
    """
    try:
        # اعتبارسنجی داده‌ها بر اساس فیلدهای تعریف شده
        validation_result = validate_form_submission(
            validated_data.get('form_data', {}),
            validated_data.get('platform', 'website')
        )
        
        if not validation_result['valid']:
            raise ValidationError(validation_result['errors'])
        
        # تبدیل مستقیم به EmailMessage
        form_data = validated_data.get('form_data', {})
        platform = validated_data.get('platform', 'website')
        
        # استخراج اطلاعات از form_data با استفاده از field_key های تعریف شده
        name = 'بدون نام'
        email = ''
        phone = ''
        
        # جستجو در فیلدهای تعریف شده برای پیدا کردن name, email, phone
        fields = ContactFormField.objects.filter(
            is_active=True,
            platforms__contains=[platform]
        )
        
        for field in fields:
            field_key = field.field_key
            value = form_data.get(field_key, '')
            
            if field.field_type == 'email' and not email:
                email = str(value) if value else ''
            elif field.field_type == 'phone' and not phone:
                phone = str(value) if value else ''
            elif field.field_key in ['name', 'نام'] and name == 'بدون نام':
                name = str(value) if value else 'بدون نام'
        
        # اگر پیدا نکردیم، از کلیدهای رایج استفاده کن
        if name == 'بدون نام':
            name = form_data.get('name', form_data.get('نام', 'بدون نام'))
        if not email:
            email = form_data.get('email', form_data.get('ایمیل', ''))
        if not phone:
            phone = form_data.get('phone', form_data.get('تلفن', form_data.get('موبایل', '')))
        
        # ساخت subject و message از form_data
        subject_parts = []
        message_lines = []
        
        for field in fields:
            field_key = field.field_key
            value = form_data.get(field_key, '')
            
            if value and field_key not in ['name', 'نام', 'email', 'ایمیل', 'phone', 'تلفن', 'موبایل']:
                if len(subject_parts) < 3:
                    subject_parts.append(f"{field.label}: {str(value)[:50]}")
                message_lines.append(f"{field.label}: {str(value)}")
        
        subject = ' | '.join(subject_parts) if subject_parts else 'فرم تماس جدید'
        if len(subject) > 300:
            subject = subject[:297] + '...'
        
        message = '\n'.join(message_lines) if message_lines else str(form_data)
        
        # اگر email خالی است، از یک ایمیل پیش‌فرض استفاده کن
        if not email:
            email = 'no-email@example.com'
        
        # ایجاد EmailMessage
        from src.email.models.email_message import EmailMessage
        
        email_message = EmailMessage.objects.create(
            name=name,
            email=email,
            phone=phone if phone else None,
            subject=subject,
            message=message,
            source=platform,  # 'website' یا 'mobile_app'
            status='new',
            ip_address=validated_data.get('ip_address'),
            user_agent=validated_data.get('user_agent'),
        )
        
        return email_message
    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(f"خطا در ایجاد ارسال: {str(e)}")
