from django.db.models import Q
from rest_framework.exceptions import NotFound, ValidationError, AuthenticationFailed
from src.user.messages import AUTH_ERRORS
from src.user.utils import validate_identifier, validate_register_password
from src.user.models import User
from src.user.services.base_profile_service import BaseProfileService

class BaseManagementService:
    @staticmethod
    def get_users_list(search=None, is_active=None, user_type='all', is_superuser=None, request=None):
        queryset = User.objects.select_related('user_profile', 'admin_profile').prefetch_related(
            'admin_profile__profile_picture'  # Prefetch profile picture for admin profiles
        )
        
        filters = {}
        
        if is_active is not None:
            filters['is_active'] = is_active
            
        if user_type == 'admin':
            filters['is_staff'] = True
        elif user_type == 'user':
            filters['is_staff'] = False
        
        if is_superuser is not None:
            filters['is_superuser'] = is_superuser
            
        queryset = queryset.filter(**filters)
        
        if search:
            queryset = queryset.filter(
                Q(mobile__icontains=search) |
                Q(email__icontains=search) |
                Q(user_profile__first_name__icontains=search) |
                Q(user_profile__last_name__icontains=search) |
                Q(admin_profile__first_name__icontains=search) |
                Q(admin_profile__last_name__icontains=search)
            ).distinct()

        return queryset.order_by('-created_at')

    @staticmethod
    def get_user_detail(user_id):
        """Get user with optimized profile prefetching"""
        try:
            return User.objects.select_related('user_profile', 'admin_profile').prefetch_related(
                'admin_profile__profile_picture',  # Prefetch profile picture for admin profiles
                'adminuserrole_set__role'
            ).get(id=user_id)
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def get_user_by_public_id(public_id):
        try:
            return User.objects.select_related('user_profile', 'admin_profile').prefetch_related(
                'admin_profile__profile_picture'  # Prefetch profile picture for admin profiles
            ).get(public_id=public_id)
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def update_user(user_id, validated_data, admin_user=None):
        """Updates user and profile based on validated data from the view/serializer."""
        # <<< --- START LOGGING --- >>>
        print(f"--- BaseManagementService.update_user --- User ID: {user_id}")
        print(f"--- BaseManagementService.update_user --- Received Validated Data:", validated_data)
        # <<< --- END LOGGING --- >>>
        try:
            if admin_user is not None:
                if not admin_user.is_staff:
                    raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
                # Permission checks for modifying sensitive fields
                modifying_sensitive = any(key in validated_data for key in ['is_staff', 'is_superuser'])
                if modifying_sensitive and not admin_user.is_superuser:
                    user_to_update = User.objects.get(id=user_id)
                    if user_to_update.id != admin_user.id or validated_data.get('is_staff', user_to_update.is_staff) or validated_data.get('is_superuser', user_to_update.is_superuser):
                        raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
            
            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                raise ValidationError({"user_id": "Invalid user ID format"})
            
            # Fetch user once with profile - reduces database queries
            user = User.objects.select_related('user_profile').get(id=user_id)
            
            # --- Separate User and Profile data from validated_data --- 
            user_fields_to_update = {}
            profile_fields_to_update = {}
            profile_picture = validated_data.pop('profile_picture', None)
            profile_picture_file = validated_data.pop('profile_picture_file', None)  # Direct file upload

            # ===== Identifier or Email/Mobile Processing =====
            # Handle identifier conversion to email/mobile
            if 'identifier' in validated_data:
                identifier = validated_data.pop('identifier')
                if identifier:
                    try:
                        email, mobile = validate_identifier(identifier)
                        # Check if email/mobile exists for other users
                        if email and User.objects.filter(~Q(id=user_id), email=email).exists():
                            raise ValidationError(AUTH_ERRORS["auth_email_exists"])
                        if mobile and User.objects.filter(~Q(id=user_id), mobile=mobile).exists():
                            raise ValidationError(AUTH_ERRORS["auth_mobile_exists"])
                            
                        user_fields_to_update['email'] = email
                        user_fields_to_update['mobile'] = mobile
                    except ValidationError as e:
                        raise ValidationError({"identifier": str(e)})
            
            # Handle direct email/mobile updates
            if 'email' in validated_data:
                email = validated_data.pop('email')
                # --- Modification Start --- 
                # Convert empty string to None to avoid unique constraint violation with ''
                final_email = None if email == '' else email 
                if final_email and User.objects.filter(~Q(id=user_id), email=final_email).exists():
                    raise ValidationError({"email": AUTH_ERRORS["auth_email_exists"]})
                user_fields_to_update['email'] = final_email
                # --- Modification End --- 
                
            if 'mobile' in validated_data:
                mobile = validated_data.pop('mobile')
                # --- Modification Start --- 
                # Convert empty string to None for mobile as well (optional but consistent)
                final_mobile = None if mobile == '' else mobile
                if final_mobile and User.objects.filter(~Q(id=user_id), mobile=final_mobile).exists():
                    raise ValidationError({"mobile": AUTH_ERRORS["auth_mobile_exists"]})
                user_fields_to_update['mobile'] = final_mobile
                # --- Modification End --- 

            # ===== User Fields Processing =====
            # Add password if provided (already removed email/mobile)
            user_model_fields = ['password', 'is_active', 'is_staff', 'is_superuser']
            for field in user_model_fields:
                if field in validated_data:
                    value = validated_data.pop(field)
                    if field == 'password' and not value:
                        continue  # Skip empty password
                    user_fields_to_update[field] = value

            # ===== Profile Fields Processing =====
            # 1. Direct profile fields
            profile_model_fields = ['first_name', 'last_name', 'birth_date', 'national_id', 'address', 'bio']
            for field in profile_model_fields:
                if field in validated_data:
                    profile_fields_to_update[field] = validated_data.pop(field)

            # 2. Prefixed profile fields (profile_*)
            profile_prefix = 'profile_'
            prefix_keys = [k for k in validated_data.keys() if k.startswith(profile_prefix)]
            for key in prefix_keys:
                field = key[len(profile_prefix):]  # Remove prefix
                if field in profile_model_fields:
                    profile_fields_to_update[field] = validated_data.pop(key)

            # 3. Nested profile object
            nested_profile = validated_data.pop('profile', {}) or {}
            if isinstance(nested_profile, dict):
                for field in profile_model_fields:
                    if field in nested_profile:
                        profile_fields_to_update[field] = nested_profile[field]
            
            # Handle explicit profile picture removal
            should_remove_picture = validated_data.pop('remove_profile_picture', 'false').lower() == 'true'
            
            # افزودن پشتیبانی از نام پارامتر جدید
            if not should_remove_picture:
                should_remove_picture = validated_data.pop('delete_profile_picture', 'false').lower() == 'true'
                
            # پشتیبانی از فیلد clear_profile_picture
            if not should_remove_picture:
                should_remove_picture = validated_data.pop('clear_profile_picture', 'false')
                if isinstance(should_remove_picture, bool):
                    should_remove_picture = should_remove_picture
                else:
                    should_remove_picture = should_remove_picture.lower() == 'true'

            # ===== Add profile picture back =====
            # Handle profile picture (either ID or direct file upload)
            if profile_picture_file:
                # Handle direct file upload using central media service
                try:
                    from src.media.services.media_service import MediaService
                    
                    media = MediaService.upload_file(
                        file=profile_picture_file,
                        title=f"Profile Picture - User {user.id}",
                        alt_text=f"Profile picture for user {user.id}",
                        folder="profile_pictures"
                    )
                    
                    if media:
                        profile_fields_to_update['profile_picture_id'] = media.id
                except Exception as e:
                    print(f"Profile picture upload failed: {e}")
                    # Don't fail user update if picture upload fails
                    pass
            elif profile_picture:
                profile_fields_to_update['profile_picture'] = profile_picture

            # ===== Update User =====
            # Update user fields (if any changed)
            if user_fields_to_update:
                if 'password' in user_fields_to_update:
                    password = user_fields_to_update.pop('password')
                    user.set_password(password)
                    
                for field, value in user_fields_to_update.items():
                    setattr(user, field, value)
                user.save()
            
            # ===== Update Role =====
            role_id_str = validated_data.pop('role_id', None)
            if role_id_str is not None:
                try:
                    if role_id_str == '' or role_id_str.lower() == 'none':
                        # Clear all AdminUserRole assignments for this user
                        from src.user.models import AdminUserRole
                        AdminUserRole.objects.filter(user=user, is_active=True).update(is_active=False)
                        print(f">>> Cleared all AdminUserRole assignments for user {user.id}")
                    else:
                        role_id = int(role_id_str)
                        from src.user.models import AdminRole, AdminUserRole
                        
                        # Check if AdminRole exists
                        try:
                            role = AdminRole.objects.get(id=role_id, is_active=True)
                            
                            # VALIDATION: super_admin role can only be assigned to superusers
                            if role.name == 'super_admin' and not user.is_superuser:
                                print(f"Warning: Cannot assign 'super_admin' role to non-superuser {user.id}. Skipping role assignment.")
                                return user
                            
                            # First, deactivate all existing role assignments
                            AdminUserRole.objects.filter(user=user, is_active=True).update(is_active=False)
                            
                            # Create or activate the new role assignment
                            user_role, created = AdminUserRole.objects.get_or_create(
                                user=user,
                                role=role,
                                defaults={
                                    'assigned_by': admin_user,
                                    'is_active': True
                                }
                            )
                            
                            if not created:
                                user_role.is_active = True
                                user_role.save()
                            
                            print(f">>> Set AdminRole {role.name} (ID: {role.id}) for user {user.id}")
                            
                            # Clear permission cache
                            from src.user.utils.permission_helper import PermissionHelper
                            PermissionHelper.clear_user_cache(user.id)
                            
                        except AdminRole.DoesNotExist:
                            print(f"Warning: AdminRole with ID {role_id_str} not found. Role not updated.")
                            
                except ValueError:
                     print(f"Warning: Invalid role ID format: {role_id_str}. Role not updated.")
                except Exception as e:
                     print(f"Error updating user AdminRole: {str(e)}")

            # <<< --- START LOGGING --- >>>
            print(f"--- BaseManagementService.update_user --- Profile Fields to Update:", profile_fields_to_update)
            # <<< --- END LOGGING --- >>>

            # Update profile if anything to update or need to remove picture
            if profile_fields_to_update or should_remove_picture:
                # Import here to avoid circular imports
                
                # Process profile picture removal if requested
                if should_remove_picture:
                    print("--- BaseManagementService.update_user --- Removing profile picture...")
                    BaseProfileService.update_profile_image(user, None)
                
                # Process other profile fields if there are any
                if profile_fields_to_update:
                    print("--- BaseManagementService.update_user --- Calling BaseProfileService.update_user_profile...")
                    BaseProfileService.update_user_profile(user, profile_fields_to_update)
                    print("--- BaseManagementService.update_user --- Finished calling BaseProfileService.update_user_profile.")
           
            # No need to refresh from DB - we already updated our user object
            return user
            
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])
        except Exception as e:
            # Keep a comprehensive error log
            print(f"Error during user update: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    # create_user method removed - use BaseRegisterService instead

    @staticmethod
    def delete_user(user_id, admin_user=None):

        if admin_user is not None and not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])
        
        try:
            user = User.objects.get(id=user_id)
            
            # Protection against deleting admin users by non-super admins
            if admin_user is not None and user.is_staff and not (admin_user.is_superuser or admin_user.is_admin_full):
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
            
            # Protection against deleting super admins
            if user.is_admin_full and admin_user and not admin_user.is_admin_full:
                raise AuthenticationFailed("Cannot delete super admin users.")
                
            user.delete()
            
            return True
            
        except User.DoesNotExist:
            raise NotFound(AUTH_ERRORS["not_found"])

    @staticmethod
    def bulk_delete_users(user_ids, admin_user=None):
        """Bulk delete users based on a list of IDs."""
        if not isinstance(user_ids, list) or not user_ids:
            raise ValidationError("List of user IDs is required.")

        if admin_user is not None and not admin_user.is_staff:
            raise AuthenticationFailed(AUTH_ERRORS["auth_not_authorized"])

        # Ensure all IDs are integers
        try:
            user_ids = [int(uid) for uid in user_ids]
        except (ValueError, TypeError):
            raise ValidationError("Invalid user ID format in the list.")

        # Prevent non-superusers from deleting staff/superusers or other admins
        if admin_user is not None and not (admin_user.is_superuser or admin_user.is_admin_full):
            # Check for staff users (admins) in the list
            if User.objects.filter(id__in=user_ids, is_staff=True).exists():
                raise AuthenticationFailed(AUTH_ERRORS["auth_not_superuser"])
        
        # Filter to only delete regular users (non-staff) if not super admin
        if admin_user is not None and not (admin_user.is_superuser or admin_user.is_admin_full):
            # Only allow deletion of regular users
            user_ids_to_delete = list(User.objects.filter(
                id__in=user_ids, 
                is_staff=False
            ).values_list('id', flat=True))
        else:
            # Super admins can delete all users (but not other super admins for safety)
            user_ids_to_delete = list(User.objects.filter(
                id__in=user_ids
            ).exclude(
                is_admin_full=True  # Protect super admins from deletion
            ).values_list('id', flat=True))

        # Perform the bulk delete
        deleted_count, _ = User.objects.filter(id__in=user_ids_to_delete).delete()

        if deleted_count == 0 and len(user_ids_to_delete) > 0:
            # Check if any IDs were actually invalid or just didn't exist
            existing_ids = set(User.objects.filter(id__in=user_ids_to_delete).values_list('id', flat=True))
            if not existing_ids and len(user_ids_to_delete) > 0:
                 raise NotFound(AUTH_ERRORS["not_found"] + " (No valid users found for the provided IDs)")
            # Else: some users might have been deleted already, or some IDs were invalid

        return deleted_count
