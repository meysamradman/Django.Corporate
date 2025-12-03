from django.db import transaction, models
from src.user.models import AdminRole
from src.user.permissions.config import get_all_role_configs

LEGACY_ROLE_NAMES = {
    'taxonomy_editor',
    'analytics_viewer',
    'support_admin',
}


def _demote_removed_system_roles(valid_role_names: set[str], verbose: bool = True):
    demoted = []
    deleted = []
    legacy_roles = AdminRole.objects.filter(
        models.Q(is_system_role=True) | models.Q(name__in=LEGACY_ROLE_NAMES)
    ).exclude(name__in=valid_role_names)

    for role in legacy_roles:
        has_assignments = role.adminuserrole_set.filter(is_active=True).exists()

        if has_assignments:
            role.is_system_role = False
            role.save(update_fields=['is_system_role'])
            demoted.append(role.name)
        else:
            role.delete()
            deleted.append(role.name)
    return demoted, deleted


def create_default_admin_roles(force_update=False, verbose=True):
    role_configs = get_all_role_configs()
    
    created_count = 0
    updated_count = 0
    skipped_count = 0
    results = []
    
    with transaction.atomic():
        for role_name, role_data in role_configs.items():
            try:
                role = AdminRole.objects.get(name=role_name)
                
                if force_update:
                    role.display_name = role_data['display_name']
                    role.description = role_data['description']
                    role.level = role_data['level']
                    role.permissions = role_data['permissions']
                    role.is_system_role = role_data['is_system_role']
                    role.is_active = True
                    role.save()
                    
                    updated_count += 1
                    result = f'[Updated]: {role.display_name}'
                    results.append(result)
                else:
                    skipped_count += 1
                    result = f'[Skipped]: {role.display_name} (already exists)'
                    results.append(result)
                        
            except AdminRole.DoesNotExist:
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
                result = f'[Created]: {role.display_name}'
                results.append(result)
                    
            except Exception as e:
                error_msg = f'[Error] with role {role_name}: {str(e)}'
                results.append(error_msg)

        demoted_roles, deleted_roles = _demote_removed_system_roles(set(role_configs.keys()), verbose=verbose)

    summary = {
        'created': created_count,
        'updated': updated_count,
        'skipped': skipped_count,
        'demoted': len(demoted_roles),
        'demoted_roles': demoted_roles,
        'deleted': len(deleted_roles),
        'deleted_roles': deleted_roles,
        'total_processed': len(role_configs),
        'results': results
    }
    
                
    return summary


def ensure_admin_roles_exist():
    try:
        if AdminRole.objects.filter(is_system_role=True).count() == 0:
            result = create_default_admin_roles(force_update=False, verbose=False)
            return result
        return {'created': 0, 'updated': 0, 'skipped': 0, 'message': 'Roles already exist'}
    except Exception as e:
        return {'error': str(e)}


def get_role_summary():
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
        return {'error': str(e)}
