"""
Admin Roles Setup Script
Executes role creation/update using utility functions
Usage: python scripts/create_admin_roles.py [--force-update]
"""

import os
import sys
import django

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

# Import utility functions
from src.user.authorization.role_utils import (
    create_default_admin_roles,
    ensure_admin_roles_exist,
    get_role_summary
)


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Setup admin roles')
    parser.add_argument(
        '--force-update',
        action='store_true',
        help='Force update existing roles'
    )
    parser.add_argument(
        '--summary',
        action='store_true',
        help='Show roles summary only'
    )
    
    args = parser.parse_args()
    
    if args.summary:
        print('\n[Admin Roles Summary]:\n')
        summary = get_role_summary()
        print(f"Total Roles: {summary['total_roles']}")
        print(f"System Roles: {summary['system_roles']}")
        print(f"Custom Roles: {summary['custom_roles']}")
        print('\nRoles List:')
        for role in summary['roles_list']:
            print(f"  - {role['display_name']} (Level {role['level']}) - {role['users_count']} users")
    else:
        result = create_default_admin_roles(
            force_update=args.force_update,
            verbose=True
        )
        
        if result.get('results'):
            print('\n[Results]:')
            for res in result['results']:
                print(f'  {res}')
        
        print('\n' + '='*50)
        print('[Summary]:')
        print(f'  Created: {result.get("created", 0)}')
        print(f'  Updated: {result.get("updated", 0)}')
        print(f'  Skipped: {result.get("skipped", 0)}')
        print(f'  Total Processed: {result.get("total_processed", 0)}')
        print('='*50)
        print('[OK] Script completed successfully!')
        print('='*50)
