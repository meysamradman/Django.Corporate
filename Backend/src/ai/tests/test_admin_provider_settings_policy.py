from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from src.ai.models import AIProvider, AdminProviderSettings


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
