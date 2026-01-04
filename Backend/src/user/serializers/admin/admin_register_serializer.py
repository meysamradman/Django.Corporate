from rest_framework import serializers
from datetime import datetime
from django.core.exceptions import ValidationError as DjangoValidationError
from src.user.utils.mobile_validator import validate_mobile_number
from src.user.utils.email_validator import validate_email_address
from src.user.utils.password_validator import validate_register_password
from src.user.utils.phone_validator import validate_phone_number_optional
from src.user.utils.validate_identifier import validate_identifier
from src.user.models import User, AdminRole
from src.core.models import Province, City
from src.media.models import ImageMedia
from src.media.utils.validators import validate_image_file
from src.user.messages import AUTH_ERRORS
from src.user.utils.national_id_validator import validate_national_id_format


class AdminRegisterSerializer(serializers.Serializer):
    mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(required=True, write_only=True, min_length=8)
    
    is_superuser = serializers.BooleanField(default=False, required=False)
    
    user_type = serializers.ChoiceField(
        choices=[('admin', 'Admin'), ('user', 'Regular User')],
        default='admin',
        required=False
    )
    
    # نوع ادمین: ادمین معمولی یا مشاور املاک
    admin_role_type = serializers.ChoiceField(
        choices=[('admin', 'Admin'), ('consultant', 'Real Estate Consultant')],
        default='admin',
        required=False
    )
    
    profile = serializers.DictField(required=False, allow_empty=True)
    
    # فیلدهای AdminProfile (برای همه admin users)
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
    province_id = serializers.IntegerField(required=False, allow_null=True)
    city_id = serializers.IntegerField(required=False, allow_null=True)
    
    profile_picture_id = serializers.IntegerField(required=False, allow_null=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True, write_only=True)
    
    role_id = serializers.IntegerField(required=False, allow_null=True)
    
    # فیلدهای PropertyAgent (فقط برای مشاورین املاک)
    license_number = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=100)
    license_expire_date = serializers.DateField(required=False, allow_null=True)
    specialization = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=200)
    agency_id = serializers.IntegerField(required=False, allow_null=True)
    is_verified = serializers.BooleanField(required=False, default=False)
    
    # فیلدهای SEO برای PropertyAgent (اختیاری) - فقط فیلدهای SEOMixin
    meta_title = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=70)
    meta_description = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=300)
    og_title = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=70)
    og_description = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=300)
    og_image_id = serializers.IntegerField(required=False, allow_null=True)
    canonical_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    robots_meta = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=50)

    def validate_mobile(self, value):
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
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS["auth_password_required"])
        
        try:
            validate_register_password(value)
            return value
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate_birth_date(self, value):
        if value and value > datetime.now().date():
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        return value
    
    def validate_national_id(self, value):
        return validate_national_id_format(value)
    
    def validate_phone(self, value):
        if not value or value.strip() == "":
            return None
        
        try:
            return validate_phone_number_optional(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate_profile_picture_id(self, value):
        if value is None:
            return value
        
        try:
            media = ImageMedia.objects.get(id=value)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_profile_picture(self, value):
        if value is None:
            return value
        
        try:
            validate_image_file(value)
            return value
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_role_id(self, value):
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
        if value is None or value == "" or value == "none":
            return None
        
        try:
            province_id = int(value)
            Province.objects.get(id=province_id, is_active=True)
            return province_id
        except (ValueError, TypeError):
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Province.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_city_id(self, value):
        if value is None or value == "" or value == "none":
            return None
        
        try:
            city_id = int(value)
            City.objects.get(id=city_id, is_active=True)
            return city_id
        except (ValueError, TypeError):
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except City.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
    
    def validate_license_number(self, value):
        """اعتبارسنجی شماره پروانه مشاور"""
        if not value or value.strip() == "":
            return None
        # چک یکتا بودن
        from src.real_estate.models import PropertyAgent
        if PropertyAgent.objects.filter(license_number=value).exists():
            raise serializers.ValidationError("شماره پروانه تکراری است")
        return value.strip()
    
    def validate_license_expire_date(self, value):
        """اعتبارسنجی تاریخ انقضای پروانه"""
        if value and value < datetime.now().date():
            raise serializers.ValidationError("تاریخ انقضای پروانه نمی‌تواند در گذشته باشد")
        return value
    
    def validate_agency_id(self, value):
        """اعتبارسنجی آژانس املاک"""
        if value is None:
            return value
        try:
            from src.real_estate.models import RealEstateAgency
            RealEstateAgency.objects.get(id=value, is_active=True)
            return value
        except Exception:
            raise serializers.ValidationError("آژانس یافت نشد")
    
    def validate_og_image_id(self, value):
        """اعتبارسنجی تصویر OG"""
        if value is None:
            return value
        try:
            ImageMedia.objects.get(id=value)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError("تصویر یافت نشد")

    def validate(self, data):
        admin_user = self.context.get('admin_user')
        
        if data.get('is_superuser') is True and not admin_user.is_superuser:
            raise serializers.ValidationError({
                'is_superuser': AUTH_ERRORS.get("auth_only_superuser_create")
            })
        
        if not data.get('mobile') and not data.get('email'):
            raise serializers.ValidationError({
                'non_field_errors': AUTH_ERRORS.get("auth_email_or_mobile_required")
            })
        
        # پردازش profile data
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
        
        # اعتبارسنجی فیلدهای PropertyAgent برای مشاورین املاک
        admin_role_type = data.get('admin_role_type', 'admin')
        
        if admin_role_type == 'consultant':
            # مشاور املاک نمی‌تواند سوپرادمین باشد
            if data.get('is_superuser') is True:
                raise serializers.ValidationError({
                    'is_superuser': "مشاورین املاک نمی‌توانند دسترسی سوپرادمین داشته باشند"
                })
            
            # مشاور املاک نمی‌تواند نقش سوپرادمین داشته باشد
            role_id = data.get('role_id')
            if role_id:
                try:
                    role = AdminRole.objects.get(id=role_id)
                    if role.name == 'super_admin':
                        raise serializers.ValidationError({
                            'role_id': "مشاورین املاک نمی‌توانند نقش سوپرادمین داشته باشند"
                        })
                except AdminRole.DoesNotExist:
                    pass

            # برای مشاورین، license_number اجباری است
            if not data.get('license_number'):
                raise serializers.ValidationError({
                    'license_number': 'شماره پروانه برای مشاورین املاک الزامی است'
                })
            # چک کنیم first_name و last_name برای PropertyAgent داشته باشیم
            if not data.get('first_name') or not data.get('last_name'):
                raise serializers.ValidationError({
                    'non_field_errors': 'نام و نام خانوادگی برای مشاورین املاک الزامی است'
                })
        
        return data


class AdminCreateRegularUserSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True, min_length=6)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
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
        if value is None:
            return value
        
        try:
            media = ImageMedia.objects.get(id=value)
            return value
        except ImageMedia.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS["auth_password_required"])
        
        if len(value) < 6:
            raise serializers.ValidationError(AUTH_ERRORS["auth_password_too_short"])
        
        return value

    def validate_province_id(self, value):
        if value is None:
            return value
        
        try:
            province = Province.objects.get(id=value, is_active=True)
            return value
        except Province.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_city_id(self, value):
        if value is None:
            return value
        
        try:
            city = City.objects.get(id=value, is_active=True)
            return value
        except City.DoesNotExist:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_profile_picture(self, value):
        if value is None:
            return value
        
        try:
            validate_image_file(value)
            return value
        except DjangoValidationError as e:
            raise serializers.ValidationError(str(e))
        except Exception as e:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_validation_error"))

    def validate_phone(self, value):
        if not value or value.strip() == "":
            return None
        
        try:
            return validate_phone_number_optional(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))
    
    def validate_identifier(self, value):
        if not value:
            raise serializers.ValidationError(AUTH_ERRORS.get("auth_identifier_cannot_empty"))
        
        try:
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
                email, mobile = validate_identifier(identifier)
                if email:
                    data['email'] = email
                elif mobile:
                    data['mobile'] = mobile
            except Exception as e:
                raise serializers.ValidationError({
                    'identifier': AUTH_ERRORS.get("auth_validation_error")
                })
        
        if 'email' in data and data['email']:
            try:
                email, mobile = validate_identifier(data['email'])
                if email:
                    data['email'] = email
                else:
                    raise serializers.ValidationError({
                        'email': AUTH_ERRORS["auth_invalid_email"]
                    })
            except Exception as e:
                raise serializers.ValidationError({
                    'email': AUTH_ERRORS["auth_invalid_email"]
                    })
        
        if 'phone' in data and data['phone']:
            try:
                data['phone'] = validate_phone_number_optional(data['phone'])
            except Exception as e:
                raise serializers.ValidationError({
                    'phone': str(e)
                })
        
        profile_data = data.get('profile', {})
        if profile_data:
            for field in ['first_name', 'last_name', 'birth_date', 'national_id', 'address', 'phone', 'bio', 'province_id', 'city_id']:
                if field in profile_data and field not in data:
                    data[field] = profile_data[field]
        
        if 'province_id' in data and data['province_id']:
            try:
                Province.objects.get(id=data['province_id'], is_active=True)
            except Province.DoesNotExist:
                raise serializers.ValidationError({
                    'province_id': AUTH_ERRORS["location_province_not_found"]
                })
        
        if 'city_id' in data and data['city_id']:
            try:
                City.objects.get(id=data['city_id'], is_active=True)
            except City.DoesNotExist:
                raise serializers.ValidationError({
                    'city_id': AUTH_ERRORS["location_city_not_found"]
                })
            
            if 'profile_picture' in profile_data and 'profile_picture_id' not in data:
                data['profile_picture_id'] = profile_data['profile_picture']
        
        if 'phone' in data and data['phone']:
            try:
                data['phone'] = validate_phone_number_optional(data['phone'])
            except Exception as e:
                raise serializers.ValidationError({
                    'phone': str(e)
                })
        
        if 'national_id' in data and data['national_id']:
            try:
                data['national_id'] = validate_national_id_format(data['national_id'])
            except Exception as e:
                raise serializers.ValidationError({
                    'national_id': str(e)
                })
        
        if 'phone' in data and data['phone']:
            try:
                data['phone'] = validate_phone_number_optional(data['phone'])
            except Exception as e:
                raise serializers.ValidationError({
                    'phone': str(e)
                })
        
        if 'national_id' in data and data['national_id']:
            try:
                data['national_id'] = validate_national_id_format(data['national_id'])
            except Exception as e:
                raise serializers.ValidationError({
                    'national_id': str(e)
                })
        
        return super().validate(data)