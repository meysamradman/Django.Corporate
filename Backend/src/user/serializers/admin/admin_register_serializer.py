from rest_framework import serializers
from datetime import datetime
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.email_validator import validate_email_address
from src.user.models import User, AdminRole
from src.media.models import ImageMedia
from src.user.messages import AUTH_ERRORS
from src.user.utils.national_id_validator import validate_national_id_format


class AdminRegisterSerializer(serializers.Serializer):
    """
    سریالایزر مخصوص ثبت‌نام ادمین در پنل ادمین - بهینه شده
    توجه: is_staff=True به طور خودکار برای همه ادمین‌ها تنظیم می‌شود
    is_superuser فقط توسط سوپر ادمین‌ها قابل تنظیم است
    """
    mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(required=True, write_only=True, min_length=8)
    
    is_superuser = serializers.BooleanField(default=False, required=False)
    
    user_type = serializers.ChoiceField(
        choices=[('admin', 'ادمین'), ('user', 'کاربر معمولی')], 
        default='admin', 
        required=False
    )
    
    profile = serializers.DictField(required=False, allow_empty=True)
    
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    birth_date = serializers.DateField(required=False, allow_null=True)
    national_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=15)
    department = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    position = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # فیلدهای مکان‌یابی
    province_id = serializers.IntegerField(required=False, allow_null=True)
    city_id = serializers.IntegerField(required=False, allow_null=True)
    
    profile_picture_id = serializers.IntegerField(required=False, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    role_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_mobile(self, value):
        """اعتبارسنجی فرمت شماره موبایل و یکتا بودن"""
        if value == "" or value is None:
            return None
            
        try:
            validated_mobile = validate_mobile_number(value)
            
            if User.objects.filter(mobile=validated_mobile).exists():
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_mobile_exists"))
            
            return validated_mobile
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_email(self, value):
        """اعتبارسنجی فرمت ایمیل و یکتا بودن"""
        if value == "":
            return None
        if value:
            try:
                validated_email = validate_email_address(value)
                
                if User.objects.filter(email=validated_email).exists():
                    raise serializers.ValidationError(AUTH_ERRORS.get("auth_email_exists"))
                
                return validated_email
            except Exception as e:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        return value
    
    def validate_password(self, value):
        """اعتبارسنجی رمز عبور"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_password_required"))
        
        try:
            from src.user.utils.password_validator import validate_register_password
            validate_register_password(value)
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate_birth_date(self, value):
        """اعتبارسنجی تاریخ تولد"""
        if value and value > datetime.now().date():
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        return value
    
    def validate_national_id(self, value):
        """اعتبارسنجی کد ملی"""
        return validate_national_id_format(value)
    
    def validate_phone(self, value):
        """اعتبارسنجی شماره تلفن"""
        if not value or value.strip() == "":
            return None
        
        try:
            from src.user.utils.phone_validator import validate_phone_number_optional
            return validate_phone_number_optional(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate_profile_picture_id(self, value):
        """اعتبارسنجی وجود تصویر پروفایل"""
        if value is None:
            return value
        
        try:
            from src.media.models import ImageMedia
            media = ImageMedia.objects.get(id=value)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_profile_picture(self, value):
        """اعتبارسنجی فایل تصویر پروفایل آپلود شده با استفاده از سرویس مدیا"""
        if value is None:
            return value
        
        from src.media.utils.validators import validate_image_file
        
        try:
            validate_image_file(value)
            return value
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_role_id(self, value):
        """اعتبارسنجی ID نقش"""
        if value is None or value == "" or value == "none":
            return None
        
        try:
            role_id = int(value)
            AdminRole.objects.get(id=role_id, is_active=True)
            return role_id
        except (ValueError, TypeError):
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except AdminRole.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_province_id(self, value):
        """اعتبارسنجی ID استان"""
        if value is None or value == "" or value == "none":
            return None
        
        try:
            from src.user.models.location import Province
            province_id = int(value)
            Province.objects.get(id=province_id, is_active=True)
            return province_id
        except (ValueError, TypeError):
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Province.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_city_id(self, value):
        """اعتبارسنجی ID شهر"""
        if value is None or value == "" or value == "none":
            return None
        
        try:
            from src.user.models.location import City
            city_id = int(value)
            City.objects.get(id=city_id, is_active=True)
            return city_id
        except (ValueError, TypeError):
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except City.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate(self, data):
        """اعتبارسنجی بین فیلدی با بررسی دسترسی‌های سوپر ادمین"""
        admin_user = self.context.get('admin_user')
        
        if data.get('is_superuser') is True and not admin_user.is_superuser:
            raise serializers.ValidationError({
                'is_superuser': AUTH_ERRORS.get("auth_only_superuser_create")
            })
        
        if not data.get('mobile') and not data.get('email'):
            raise serializers.ValidationError({
                'non_field_errors': AUTH_ERRORS.get("auth_email_or_mobile_required")
            })
        
        profile_data = data.get('profile', {})
        if profile_data:
            for field in ['first_name', 'last_name', 'birth_date', 'national_id', 'address', 'phone', 'department', 'position', 'bio', 'notes', 'province_id', 'city_id']:
                if field in profile_data and field not in data:
                    data[field] = profile_data[field]
            
            if 'profile_picture' in profile_data and 'profile_picture_id' not in data:
                data['profile_picture_id'] = profile_data['profile_picture']
        
        if data.get('profile_picture_id') and data.get('profile_picture'):
            raise serializers.ValidationError({
                'profile_picture': AUTH_ERRORS.get("auth_validation_error")
            })
        
        return data


class AdminCreateRegularUserSerializer(serializers.Serializer):
    """
    سریالایزر مخصوص ثبت‌نام کاربر معمولی توسط ادمین در پنل ادمین - بهینه شده
    شامل تمام فیلدهای پروفایل برای کاربران معمولی
    """
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True, min_length=6)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    
    # فیلد profile برای استخراج داده‌های پروفایل
    profile = serializers.DictField(required=False, allow_empty=True)
    
    first_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    last_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)
    birth_date = serializers.DateField(required=False, allow_null=True)
    national_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=15)
    bio = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    province_id = serializers.IntegerField(required=False, allow_null=True)
    city_id = serializers.IntegerField(required=False, allow_null=True)
    
    profile_picture_id = serializers.IntegerField(required=False, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)

    def validate_profile_picture_id(self, value):
        """اعتبارسنجی وجود تصویر پروفایل"""
        if value is None:
            return value
        
        try:
            from src.media.models import ImageMedia
            media = ImageMedia.objects.get(id=value)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_password(self, value):
        """اعتبارسنجی رمز عبور"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_password_required"))
        
        if len(value) < 6:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_password_too_short"))
        
        return value

    def validate_province_id(self, value):
        """اعتبارسنجی وجود استان"""
        if value is None:
            return value
        
        try:
            from src.user.models.location import Province
            province = Province.objects.get(id=value, is_active=True)
            return value
        except Province.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_city_id(self, value):
        """اعتبارسنجی وجود شهر"""
        if value is None:
            return value
        
        try:
            from src.user.models.location import City
            city = City.objects.get(id=value, is_active=True)
            return value
        except City.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_profile_picture(self, value):
        """اعتبارسنجی فایل تصویر پروفایل آپلود شده"""
        if value is None:
            return value
        
        try:
            from src.media.utils.validators import validate_image_file
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_file_size_exceed"))
            
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_file_must_be_image"))
            
            return value
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_phone(self, value):
        """اعتبارسنجی شماره تلفن"""
        if not value or value.strip() == "":
            return None
        
        try:
            from src.user.utils.phone_validator import validate_phone_number_optional
            return validate_phone_number_optional(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate_identifier(self, value):
        """اعتبارسنجی شناسه (ایمیل یا موبایل)"""
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_cannot_empty"))
        
        try:
            from src.user.utils.validate_identifier import validate_identifier
            email, mobile = validate_identifier(value)
            if email:
                return email
            elif mobile:
                return mobile
            else:
                raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_error"))
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def validate(self, data):
        """اعتبارسنجی در زمینه ادمین"""
        admin_user = self.context.get('admin_user')
        if not admin_user or not admin_user.has_admin_access():
            raise serializers.ValidationError({
                'non_field_errors': AUTH_ERRORS.get("auth_not_authorized")
            })
        
        if data.get('profile_picture_id') and data.get('profile_picture'):
            raise serializers.ValidationError({
                'profile_picture': AUTH_ERRORS.get("auth_validation_error")
            })
        
        identifier = data.get('identifier')
        if identifier:
            try:
                from src.user.utils.validate_identifier import validate_identifier
                email, mobile = validate_identifier(identifier)
                if email:
                    data['email'] = email
                elif mobile:
                    data['mobile'] = mobile
            except Exception as e:
                raise serializers.ValidationError({
                    'identifier': AUTH_ERRORS.get("auth_validation_error")
                })
        
        # Handle explicit email field
        if 'email' in data and data['email']:
            try:
                from src.user.utils.validate_identifier import validate_identifier
                email, mobile = validate_identifier(data['email'])
                if email:
                    data['email'] = email
                else:
                    raise serializers.ValidationError({
                        'email': 'ایمیل معتبر نیست'
                    })
            except Exception as e:
                raise serializers.ValidationError({
                    'email': 'ایمیل معتبر نیست'
                })
        
        # Handle phone field for user profile
        if 'phone' in data and data['phone']:
            try:
                from src.user.utils.phone_validator import validate_phone_number_optional
                data['phone'] = validate_phone_number_optional(data['phone'])
            except Exception as e:
                raise serializers.ValidationError({
                    'phone': str(e)
                })
        
        # Handle profile data extraction
        profile_data = data.get('profile', {})
        if profile_data:
            for field in ['first_name', 'last_name', 'birth_date', 'national_id', 'address', 'phone', 'bio', 'province_id', 'city_id']:
                if field in profile_data and field not in data:
                    data[field] = profile_data[field]
        
        # Also check if province_id and city_id are in main data
        if 'province_id' in data and data['province_id']:
            try:
                from src.user.models.location import Province
                Province.objects.get(id=data['province_id'], is_active=True)
            except Province.DoesNotExist:
                raise serializers.ValidationError({
                    'province_id': 'استان انتخاب شده معتبر نیست'
                })
        
        if 'city_id' in data and data['city_id']:
            try:
                from src.user.models.location import City
                City.objects.get(id=data['city_id'], is_active=True)
            except City.DoesNotExist:
                raise serializers.ValidationError({
                    'city_id': 'شهر انتخاب شده معتبر نیست'
                })
            
            if 'profile_picture' in profile_data and 'profile_picture_id' not in data:
                data['profile_picture_id'] = profile_data['profile_picture']
        
        # Handle phone field validation after profile data extraction
        if 'phone' in data and data['phone']:
            try:
                from src.user.utils.phone_validator import validate_phone_number_optional
                data['phone'] = validate_phone_number_optional(data['phone'])
            except Exception as e:
                raise serializers.ValidationError({
                    'phone': str(e)
                })
        
        # Handle national_id field validation
        if 'national_id' in data and data['national_id']:
            try:
                from src.user.utils.national_id_validator import validate_national_id_format
                data['national_id'] = validate_national_id_format(data['national_id'])
            except Exception as e:
                raise serializers.ValidationError({
                    'national_id': str(e)
                })
        
        # Handle phone field validation for user profile
        if 'phone' in data and data['phone']:
            try:
                from src.user.utils.phone_validator import validate_phone_number_optional
                data['phone'] = validate_phone_number_optional(data['phone'])
            except Exception as e:
                raise serializers.ValidationError({
                    'phone': str(e)
                })
        
        # Handle national_id field validation for user profile
        if 'national_id' in data and data['national_id']:
            try:
                from src.user.utils.national_id_validator import validate_national_id_format
                data['national_id'] = validate_national_id_format(data['national_id'])
            except Exception as e:
                raise serializers.ValidationError({
                    'national_id': str(e)
                })
        
        return super().validate(data)