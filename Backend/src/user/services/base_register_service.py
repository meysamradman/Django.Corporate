from src.user.messages import AUTH_ERRORS
from src.user.utils.validate_identifier import validate_identifier
from src.user.utils.jwt_tokens import generate_jwt_tokens
from src.user.utils.password_validator import validate_register_password
from src.user.models import User
from django.core.exceptions import ValidationError
from rest_framework.exceptions import AuthenticationFailed


class BaseRegisterService:
    @classmethod
    def register_user(cls, identifier, password, admin_user=None, role=None):
        """
        Register a new user - optimized for both regular users and admin-created users
        """
        # Determine user type based on role parameter
        if role == "admin":
            if not admin_user:
                raise ValidationError("Admin user is required to create admin users")
                
            if not admin_user.is_staff:
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
                
            if not admin_user.is_superuser:
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
            
            user_type = 'admin'
            is_staff = True
            is_superuser = False  # Will be set separately based on admin role
            is_admin_active = True
        else:
            # Default: User for website
            user_type = 'user'
            is_staff = False
            is_superuser = False
            is_admin_active = False

        email, mobile = validate_identifier(identifier)

        if not email and not mobile:
            raise ValidationError(AUTH_ERRORS["auth_email_or_mobile_required"])

        if email and User.objects.filter(email=email).exists():
            raise ValidationError(AUTH_ERRORS["auth_email_exists"])

        if mobile and User.objects.filter(mobile=mobile).exists():
            raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])

        user = User.objects.create(
            email=email,
            mobile=mobile,
            user_type=user_type,
            is_staff=is_staff,
            is_superuser=is_superuser,
            is_admin_active=is_admin_active,
            is_active=True
        )

        validate_register_password(password)
        user.set_password(password)
        user.save()

        return user

    @classmethod
    def register_user_from_serializer(cls, validated_data, admin_user=None):
        """
        Register user from serializer data - handles both identifier and mobile + profile data
        """
        # Extract identifier or mobile
        identifier = validated_data.get('identifier')
        mobile = validated_data.get('mobile')
        email = validated_data.get('email')
        password = validated_data.get('password')
        
        # ✅ Get user_type from validated_data (important for mixed endpoints)
        user_type = validated_data.get('user_type', 'user')  # Default to 'user'
        
        # Extract profile fields
        profile_fields = {
            'first_name': validated_data.get('first_name'),
            'last_name': validated_data.get('last_name'),
            'birth_date': validated_data.get('birth_date'),
            'national_id': validated_data.get('national_id'),
            'address': validated_data.get('address'),
            'department': validated_data.get('department'),
            'position': validated_data.get('position'),
            'bio': validated_data.get('bio'),
            'notes': validated_data.get('notes'),
        }
        
        # Extract profile picture and role
        profile_picture_id = validated_data.get('profile_picture_id')
        profile_picture_file = validated_data.get('profile_picture')  # Direct file upload
        role_id = validated_data.get('role_id')
        
        # Determine creation logic based on user_type and data
        if mobile and user_type == 'admin':
            # Admin registration with mobile
            if not admin_user or not admin_user.is_staff:
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
            
            # ✅ Use is_superuser from validated_data (already validated in serializer)
            is_superuser = validated_data.get('is_superuser', False)
            
            # Check if mobile exists
            if User.objects.filter(mobile=mobile).exists():
                raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])
            
            # Check if email exists (if provided)
            if email and User.objects.filter(email=email).exists():
                raise ValidationError(AUTH_ERRORS["auth_email_exists"])
            
            user = User.objects.create(
                mobile=mobile,
                email=email,
                user_type='admin',
                is_staff=True,  # ✅ Always True for admins
                is_superuser=is_superuser,  # ✅ From validated serializer data
                is_admin_active=True,
                is_active=validated_data.get('is_active', True)
            )
            
            # Create admin profile
            from src.user.models import AdminProfile
            profile_data = {k: v for k, v in profile_fields.items() if v is not None}
            
            # Handle profile picture (either ID or file upload)
            profile_picture_media_id = None
            if profile_picture_file:
                # Upload file and get media ID
                profile_picture_media_id = cls._handle_profile_picture_upload(profile_picture_file, user.id)
            elif profile_picture_id:
                profile_picture_media_id = profile_picture_id
            
            if profile_picture_media_id:
                profile_data['profile_picture_id'] = profile_picture_media_id
            
            admin_profile = AdminProfile.objects.create(
                admin_user=user,
                **profile_data
            )
            
        elif (mobile or email) and user_type == 'user':
            # Regular user registration (admin creating regular user)
            if admin_user and not admin_user.is_staff:
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
            
            # Check if mobile exists
            if mobile and User.objects.filter(mobile=mobile).exists():
                raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])
            
            # Check if email exists
            if email and User.objects.filter(email=email).exists():
                raise ValidationError(AUTH_ERRORS["auth_email_exists"])
            
            user = User.objects.create(
                mobile=mobile,
                email=email,
                user_type='user',
                is_staff=False,      # ✅ Always False for regular users
                is_superuser=False,  # ✅ Always False for regular users
                is_admin_active=False,
                is_active=validated_data.get('is_active', True)
            )
            
            # ✅ Profile will be auto-created by signals for regular users
            # No need for manual creation here to avoid duplicates
            
        # ✅ REMOVED DUPLICATE LOGIC - unified profile creation above
            
        else:
            raise ValidationError("Either identifier or mobile is required")

        # Set password
        validate_register_password(password)
        user.set_password(password)
        user.save()
        
        # ✅ Handle profile data for regular users (after user creation)
        if user.user_type == 'user' and (validated_data.get('profile') or any(k in validated_data for k in ['first_name', 'last_name', 'birth_date', 'bio', 'address'])):
            from src.user.models import UserProfile
            
            # Get or create profile (signal should have created it, but ensure it exists)
            try:
                profile, created = UserProfile.objects.get_or_create(user=user)
                
                # Extract profile data from nested 'profile' structure
                nested_profile = validated_data.get('profile', {})
                
                # Update profile fields
                profile_field_mapping = {
                    'first_name': nested_profile.get('first_name') or validated_data.get('first_name'),
                    'last_name': nested_profile.get('last_name') or validated_data.get('last_name'),
                    'birth_date': nested_profile.get('birth_date') or validated_data.get('birth_date'),
                    'bio': nested_profile.get('bio') or validated_data.get('bio'),
                    'address': nested_profile.get('address') or validated_data.get('address'),
                }
                
                # Only update fields with values
                has_updates = False
                for field, value in profile_field_mapping.items():
                    if value is not None and value != '':
                        setattr(profile, field, value)
                        has_updates = True
                
                # Add profile picture if provided (either ID or file upload)
                profile_picture_media_id = None
                if profile_picture_file:
                    # Upload file and get media ID
                    profile_picture_media_id = cls._handle_profile_picture_upload(profile_picture_file, user.id)
                elif profile_picture_id:
                    profile_picture_media_id = profile_picture_id
                
                if profile_picture_media_id:
                    profile.profile_picture_id = profile_picture_media_id
                    has_updates = True
                
                # Save only if we have updates
                if has_updates:
                    profile.save()
                    print(f"Profile updated for user {user.id}: {profile_field_mapping}")
                
            except Exception as e:
                print(f"Profile creation/update failed: {e}")
                # Don't fail user creation if profile fails
                pass
        
        # Assign role if provided (for admin users)
        if role_id and user.user_type == 'admin':
            from src.user.models import AdminRole, AdminUserRole
            try:
                role = AdminRole.objects.get(id=role_id, is_active=True)
                AdminUserRole.objects.create(
                    user=user, 
                    role=role, 
                    assigned_by=admin_user,
                    is_active=True
                )
                print(f">>> Assigned role {role.name} to admin user {user.id}")
            except AdminRole.DoesNotExist:
                print(f"Warning: AdminRole with ID {role_id} not found")
                pass  # Ignore invalid role

        return user

    @classmethod
    def _handle_profile_picture_upload(cls, uploaded_file, user_id):
        """
        Handle profile picture file upload using central media service
        """
        try:
            from src.media.services.media_service import MediaService
            
            # Use central media service for upload
            media = MediaService.upload_file(
                file=uploaded_file,
                title=f"Profile Picture - User {user_id}",
                alt_text=f"Profile picture for user {user_id}",
                folder="profile_pictures"
            )
            
            return media.id
            
        except Exception as e:
            print(f"Profile picture upload failed: {e}")
            # Return None if upload fails - don't break user creation
            return None

    @staticmethod
    def get_tokens(user):
        return generate_jwt_tokens(user) 