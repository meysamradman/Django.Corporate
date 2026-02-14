from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from src.ai.models import AIProvider, AdminProviderSettings
from src.ai.views.ai_provider_views import AIProviderViewSet, AdminProviderSettingsViewSet
from src.user.models.roles import AdminRole, AdminUserRole


class AdminProviderSettingsPolicyTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()

        cls.super_user = User.objects.create_user(
            mobile='09123000001',
            password='test1234',
            user_type='admin',
            is_staff=True,
            is_superuser=True,
            is_admin_active=True,
            is_admin_full=True,
        )

        cls.normal_user = User.objects.create_user(
            mobile='09123000002',
            password='test1234',
            user_type='admin',
            is_staff=True,
            is_superuser=False,
            is_admin_active=True,
            is_admin_full=False,
        )

        cls.provider_shared_allowed = AIProvider.objects.create(
            name='policy-shared-allowed',
            slug='policy-shared-allowed',
            display_name='Policy Shared Allowed',
            allow_personal_keys=True,
            allow_shared_for_normal_admins=True,
            shared_api_key='shared-key-allowed-123',
            is_active=True,
        )

        cls.provider_shared_denied = AIProvider.objects.create(
            name='policy-shared-denied',
            slug='policy-shared-denied',
            display_name='Policy Shared Denied',
            allow_personal_keys=True,
            allow_shared_for_normal_admins=False,
            shared_api_key='shared-key-denied-123',
            is_active=True,
        )

    def test_normal_admin_personal_mode_uses_personal_key(self):
        setting = AdminProviderSettings.objects.create(
            admin=self.normal_user,
            provider=self.provider_shared_allowed,
            use_shared_api=False,
            personal_api_key='personal-key-111',
            is_active=True,
        )

        key = setting.get_api_key()
        self.assertEqual(key, 'personal-key-111')

    def test_normal_admin_shared_mode_allowed_provider_uses_shared_key(self):
        setting = AdminProviderSettings.objects.create(
            admin=self.normal_user,
            provider=self.provider_shared_allowed,
            use_shared_api=True,
            personal_api_key='personal-key-222',
            is_active=True,
        )

        # Scenario: when shared is selected, source must be shared key.
        key = setting.get_api_key()
        self.assertEqual(key, 'shared-key-allowed-123')

    def test_normal_admin_shared_mode_denied_provider_raises(self):
        setting = AdminProviderSettings.objects.create(
            admin=self.normal_user,
            provider=self.provider_shared_denied,
            use_shared_api=True,
            personal_api_key='personal-key-333',
            is_active=True,
        )

        with self.assertRaises(ValidationError):
            setting.get_api_key()

    def test_normal_admin_personal_mode_without_personal_key_raises(self):
        setting = AdminProviderSettings.objects.create(
            admin=self.normal_user,
            provider=self.provider_shared_allowed,
            use_shared_api=False,
            personal_api_key='',
            is_active=True,
        )

        with self.assertRaises(ValidationError):
            setting.get_api_key()

    def test_super_admin_shared_mode_works_even_when_normal_shared_denied(self):
        setting = AdminProviderSettings.objects.create(
            admin=self.super_user,
            provider=self.provider_shared_denied,
            use_shared_api=True,
            personal_api_key='',
            is_active=True,
        )

        key = setting.get_api_key()
        self.assertEqual(key, 'shared-key-denied-123')


class AISettingsEndpointPermissionTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        User = get_user_model()

        cls.user_with_ai_settings_perm = User.objects.create_user(
            mobile='09123000101',
            password='test1234',
            user_type='admin',
            is_staff=True,
            is_superuser=False,
            is_admin_active=True,
            is_admin_full=False,
        )

        cls.user_without_ai_perm = User.objects.create_user(
            mobile='09123000102',
            password='test1234',
            user_type='admin',
            is_staff=True,
            is_superuser=False,
            is_admin_active=True,
            is_admin_full=False,
        )

        cls.ai_settings_role = AdminRole.objects.create(
            name='ai_settings_personal_test_role',
            display_name='AI Settings Personal Test Role',
            description='Role for testing ai.settings.personal.manage access',
            is_system_role=False,
            permissions={
                'specific_permissions': [
                    {'permission_key': 'ai.settings.personal.manage'}
                ]
            },
            level=5,
        )

        AdminUserRole.objects.create(
            user=cls.user_with_ai_settings_perm,
            role=cls.ai_settings_role,
            is_active=True,
        )

        cls.provider = AIProvider.objects.create(
            name='permission-test-provider',
            slug='permission-test-provider',
            display_name='Permission Test Provider',
            allow_personal_keys=True,
            allow_shared_for_normal_admins=False,
            shared_api_key='shared-key-permission-123',
            is_active=True,
        )

    def setUp(self):
        self.factory = APIRequestFactory()

    def test_ai_provider_list_allowed_with_personal_settings_permission(self):
        request = self.factory.get('/admin/ai-providers/')
        force_authenticate(request, user=self.user_with_ai_settings_perm)

        view = AIProviderViewSet.as_view({'get': 'list'})
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ai_provider_list_denied_without_ai_permission(self):
        request = self.factory.get('/admin/ai-providers/')
        force_authenticate(request, user=self.user_without_ai_perm)

        view = AIProviderViewSet.as_view({'get': 'list'})
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_personal_settings_list_allowed_with_personal_settings_permission(self):
        request = self.factory.get('/admin/ai-settings/')
        force_authenticate(request, user=self.user_with_ai_settings_perm)

        view = AdminProviderSettingsViewSet.as_view({'get': 'list'})
        response = view(request)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
