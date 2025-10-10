"""
Admin Roles Creator Utility
Centralized utility for creating and managing default admin roles
Based on Permission_System.md specifications
Updated to use centralized roles_config.py
"""

from django.db import transaction
from src.user.models import AdminRole
from .roles_config import get_all_role_configs
import logging

logger = logging.getLogger(__name__)


def create_default_admin_roles(force_update=False, verbose=True):
    """
    Create or update default admin roles with their permissions
    Uses centralized configuration from roles_config.py
    
    Args:
        force_update (bool): Force update existing roles
        verbose (bool): Print detailed output
        
    Returns:
        dict: Summary of created/updated roles
    """
    
    if verbose:
        print('🚀 Starting admin roles creation...')
    
    # Get roles from centralized configuration
    role_configs = get_all_role_configs()
    
    created_count = 0
    updated_count = 0
    skipped_count = 0
    results = []
    
    with transaction.atomic():
        for role_name, role_data in role_configs.items():
            try:
                # Check if role exists
                role = AdminRole.objects.get(name=role_name)
                
                if force_update:
                    # Update existing role
                    role.display_name = role_data['display_name']
                    role.description = role_data['description']
                    role.level = role_data['level']
                    role.permissions = role_data['permissions']
                    role.is_system_role = role_data['is_system_role']
                    role.is_active = True
                    role.save()
                    
                    updated_count += 1
                    result = f'🔄 Updated: {role.display_name}'
                    results.append(result)
                    if verbose:
                        print(result)
                else:
                    skipped_count += 1
                    result = f'⚠️  Skipped: {role.display_name} (already exists)'
                    results.append(result)
                    if verbose:
                        print(result)
                        
            except AdminRole.DoesNotExist:
                # Create new role
                role = AdminRole.objects.create(
                    name=role_name,
                    display_name=role_data['display_name'],
                    description=role_data['description'],
                    level=role_data['level'],
                    permissions=role_data['permissions'],
                    is_system_role=role_data['is_system_role'],
                    is_active=True
                )
                
                created_count += 1
                result = f'✅ Created: {role.display_name}'
                results.append(result)
                if verbose:
                    print(result)
                    
            except Exception as e:
                error_msg = f'❌ Error with role {role_name}: {str(e)}'
                results.append(error_msg)
                logger.error(error_msg)
                if verbose:
                    print(error_msg)

    # Summary
    summary = {
        'created': created_count,
        'updated': updated_count,
        'skipped': skipped_count,
        'total_processed': len(role_configs),
        'results': results
    }
    
    if verbose:
        print('\n' + '='*50)
        print('✅ Admin roles setup completed!')
        print(f'📝 Created: {created_count} roles')
        print(f'🔄 Updated: {updated_count} roles')
        print(f'⏭️  Skipped: {skipped_count} roles')
        
        if created_count > 0 or updated_count > 0:
            print('\n⚠️  Available roles:')
            roles = AdminRole.objects.filter(is_active=True).order_by('level')
            for role in roles:
                print(f'  • {role.display_name} (Level {role.level})')
                
    return summary


def ensure_admin_roles_exist():
    """
    Ensure default admin roles exist (create if missing)
    Used for automatic setup during app initialization
    """
    try:
        # Check if any roles exist
        if AdminRole.objects.filter(is_system_role=True).count() == 0:
            logger.info('No system roles found, creating default roles...')
            result = create_default_admin_roles(force_update=False, verbose=False)
            logger.info(f'Created {result["created"]} default admin roles')
            return result
        else:
            logger.debug('System roles already exist, skipping auto-creation')
            return {'created': 0, 'updated': 0, 'skipped': 0, 'message': 'Roles already exist'}
    except Exception as e:
        logger.error(f'Error ensuring admin roles exist: {e}')
        return {'error': str(e)}


def get_role_summary():
    """
    Get summary of current admin roles
    
    Returns:
        dict: Role statistics and list
    """
    try:
        roles = AdminRole.objects.filter(is_active=True).order_by('level')
        system_roles = roles.filter(is_system_role=True)
        custom_roles = roles.filter(is_system_role=False)
        
        return {
            'total_roles': roles.count(),
            'system_roles': system_roles.count(),
            'custom_roles': custom_roles.count(),
            'roles_list': [
                {
                    'id': role.id,
                    'name': role.name,
                    'display_name': role.display_name,
                    'level': role.level,
                    'is_system_role': role.is_system_role,
                    'users_count': role.adminuserrole_set.filter(is_active=True).count()
                }
                for role in roles
            ]
        }
    except Exception as e:
        logger.error(f'Error getting role summary: {e}')
        return {'error': str(e)}
