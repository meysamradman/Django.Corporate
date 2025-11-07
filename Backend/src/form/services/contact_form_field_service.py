from django.core.exceptions import ValidationError
from django.db import transaction

from src.form.models import ContactFormField


def get_contact_form_fields(is_active=None):
    """
    دریافت لیست فیلدهای فرم
    
    Args:
        is_active: فیلتر بر اساس وضعیت فعال (None = همه)
    
    Returns:
        QuerySet: لیست فیلدها
    """
    queryset = ContactFormField.objects.all()
    
    if is_active is not None:
        queryset = queryset.filter(is_active=is_active)
    
    # بهینه‌سازی: فقط فیلدهای لازم را select می‌کنیم
    return queryset.order_by('order', 'field_key')


def get_contact_form_field(field_id=None, public_id=None, field_key=None):
    """
    دریافت یک فیلد فرم
    
    Args:
        field_id: ID فیلد
        public_id: Public ID فیلد
        field_key: کلید فیلد
    
    Returns:
        ContactFormField: فیلد فرم
    
    Raises:
        ValidationError: در صورت عدم یافتن
    """
    try:
        if field_id:
            return ContactFormField.objects.get(id=field_id)
        elif public_id:
            return ContactFormField.objects.get(public_id=public_id)
        elif field_key:
            return ContactFormField.objects.get(field_key=field_key)
        else:
            raise ValidationError("یکی از field_id، public_id یا field_key باید ارائه شود")
    except ContactFormField.DoesNotExist:
        raise ContactFormField.DoesNotExist("فیلد فرم یافت نشد")


def get_active_fields_for_platform(platform):
    """
    دریافت فیلدهای فعال برای یک پلتفرم خاص
    
    Args:
        platform: 'website' یا 'mobile_app'
    
    Returns:
        QuerySet: لیست فیلدهای فعال برای پلتفرم
    """
    if platform not in ['website', 'mobile_app']:
        raise ValidationError("پلتفرم نامعتبر. باید 'website' یا 'mobile_app' باشد")
    
    return ContactFormField.objects.filter(
        is_active=True,
        platforms__contains=[platform]
    ).order_by('order', 'field_key')


@transaction.atomic
def create_contact_form_field(validated_data):
    """
    ایجاد فیلد جدید
    
    Args:
        validated_data: داده‌های معتبر شده
    
    Returns:
        ContactFormField: فیلد ایجاد شده
    
    Raises:
        ValidationError: در صورت خطا
    """
    try:
        field = ContactFormField.objects.create(**validated_data)
        return field
    except Exception as e:
        raise ValidationError(f"خطا در ایجاد فیلد: {str(e)}")


@transaction.atomic
def update_contact_form_field(field, validated_data):
    """
    به‌روزرسانی فیلد
    
    Args:
        field: فیلد برای به‌روزرسانی
        validated_data: داده‌های معتبر شده
    
    Returns:
        ContactFormField: فیلد به‌روزرسانی شده
    
    Raises:
        ValidationError: در صورت خطا
    """
    try:
        for key, value in validated_data.items():
            setattr(field, key, value)
        field.save()
        return field
    except Exception as e:
        raise ValidationError(f"خطا در به‌روزرسانی فیلد: {str(e)}")


@transaction.atomic
def delete_contact_form_field(field):
    """
    حذف فیلد
    
    Args:
        field: فیلد برای حذف
    
    Raises:
        ValidationError: در صورت خطا
    """
    try:
        field.delete()
    except Exception as e:
        raise ValidationError(f"خطا در حذف فیلد: {str(e)}")

