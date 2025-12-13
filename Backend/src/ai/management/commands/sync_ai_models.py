"""
Management Command برای Sync کردن مدل‌های دینامیک از API

این command مدل‌های دینامیک را از providerهای مختلف (OpenRouter, Groq, HuggingFace)
دریافت کرده و در دیتابیس ذخیره می‌کند.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from typing import Optional, List, Dict, Any
import logging

from src.ai.models import AIProvider, AIModel
from src.ai.providers.registry import AIProviderRegistry
from src.ai.providers.openrouter import OpenRouterProvider
from src.ai.providers.groq import GroqProvider
from src.ai.providers.huggingface import HuggingFaceProvider

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Sync AI models from dynamic providers (OpenRouter, Groq, HuggingFace)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--provider',
            type=str,
            help='Sync only specific provider (openrouter, groq, huggingface)',
        )
        parser.add_argument(
            '--capability',
            type=str,
            help='Sync only specific capability (chat, content, image, audio)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be synced without making changes',
        )
    
    def handle(self, *args, **options):
        provider_filter = options.get('provider')
        capability_filter = options.get('capability')
        dry_run = options.get('dry_run', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # لیست providerهای دینامیک
        dynamic_providers = {
            'openrouter': OpenRouterProvider,
            'groq': GroqProvider,
            'huggingface': HuggingFaceProvider,
        }
        
        if provider_filter:
            if provider_filter not in dynamic_providers:
                self.stdout.write(
                    self.style.ERROR(f'Provider "{provider_filter}" is not a dynamic provider')
                )
                return
            providers_to_sync = {provider_filter: dynamic_providers[provider_filter]}
        else:
            providers_to_sync = dynamic_providers
        
        total_synced = 0
        
        for provider_slug, provider_class in providers_to_sync.items():
            try:
                count = self.sync_provider_models(
                    provider_slug,
                    provider_class,
                    capability_filter,
                    dry_run
                )
                total_synced += count
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {provider_slug}: {count} models synced'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ {provider_slug}: Error - {str(e)}')
                )
                logger.exception(f'Error syncing {provider_slug}')
        
        self.stdout.write(
            self.style.SUCCESS(f'\nTotal: {total_synced} models synced')
        )
    
    def sync_provider_models(
        self,
        provider_slug: str,
        provider_class: type,
        capability_filter: Optional[str],
        dry_run: bool
    ) -> int:
        """
        Sync مدل‌های یک provider
        
        Returns:
            تعداد مدل‌های sync شده
        """
        try:
            provider = AIProvider.objects.get(slug=provider_slug, is_active=True)
        except AIProvider.DoesNotExist:
            self.stdout.write(
                self.style.WARNING(f'Provider "{provider_slug}" not found or inactive')
            )
            return 0
        
        # دریافت API key
        api_key = provider.get_shared_api_key()
        if not api_key or not api_key.strip():
            self.stdout.write(
                self.style.WARNING(f'No API key for provider "{provider_slug}"')
            )
            return 0
        
        # دریافت مدل‌ها از API
        try:
            if provider_slug == 'openrouter':
                models_data = OpenRouterProvider.get_available_models(api_key, use_cache=False)
            elif provider_slug == 'groq':
                models_data = GroqProvider.get_available_models(api_key, use_cache=False)
            elif provider_slug == 'huggingface':
                models_data = HuggingFaceProvider.get_available_models(api_key, use_cache=False)
            else:
                return 0
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error fetching models from {provider_slug}: {str(e)}')
            )
            return 0
        
        if not models_data:
            return 0
        
        synced_count = 0
        
        with transaction.atomic():
            for model_data in models_data:
                try:
                    # تشخیص capability
                    capabilities = self._detect_capabilities(model_data, provider_slug)
                    
                    # فیلتر بر اساس capability
                    if capability_filter and capability_filter not in capabilities:
                        continue
                    
                    # ایجاد یا به‌روزرسانی مدل
                    model_id = model_data.get('id') or model_data.get('model_id', '')
                    display_name = model_data.get('name') or model_data.get('display_name', model_id)
                    
                    if not model_id:
                        continue
                    
                    if dry_run:
                        self.stdout.write(
                            f'  Would sync: {display_name} ({model_id}) - {capabilities}'
                        )
                        synced_count += 1
                        continue
                    
                    model, created = AIModel.objects.update_or_create(
                        provider=provider,
                        model_id=model_id,
                        defaults={
                            'name': display_name,
                            'display_name': display_name,
                            'description': model_data.get('description', ''),
                            'capabilities': capabilities,
                            'pricing_input': self._parse_pricing(model_data.get('pricing', {}), 'input'),
                            'pricing_output': self._parse_pricing(model_data.get('pricing', {}), 'output'),
                            'max_tokens': model_data.get('context_length') or model_data.get('max_tokens'),
                            'context_window': model_data.get('context_length') or model_data.get('context_window'),
                            'config': model_data.get('config', {}),
                        }
                    )
                    
                    if created:
                        self.stdout.write(f'  + Created: {display_name}')
                    else:
                        self.stdout.write(f'  ~ Updated: {display_name}')
                    
                    synced_count += 1
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'  Error processing model: {str(e)}')
                    )
                    logger.exception(f'Error processing model in {provider_slug}')
        
        return synced_count
    
    def _detect_capabilities(self, model_data: Dict[str, Any], provider_slug: str) -> List[str]:
        """
        تشخیص capabilityهای یک مدل بر اساس نام و توضیحات
        
        Args:
            model_data: داده‌های مدل از API
            provider_slug: نام provider
            
        Returns:
            لیست capabilityها
        """
        capabilities = []
        
        model_id = model_data.get('id') or model_data.get('model_id', '').lower()
        name = model_data.get('name', '').lower()
        description = model_data.get('description', '').lower()
        
        # تشخیص بر اساس نام
        text_indicators = ['chat', 'text', 'language', 'llm', 'gpt', 'claude', 'gemini', 'llama']
        image_indicators = ['image', 'dall', 'imagen', 'stable-diffusion', 'diffusion']
        audio_indicators = ['tts', 'text-to-speech', 'speech', 'audio', 'voice']
        
        # Chat و Content
        if any(indicator in model_id or indicator in name for indicator in text_indicators):
            capabilities.append('chat')
            capabilities.append('content')
        
        # Image
        if any(indicator in model_id or indicator in name for indicator in image_indicators):
            capabilities.append('image')
        
        # Audio
        if any(indicator in model_id or indicator in name for indicator in audio_indicators):
            capabilities.append('text_to_speech')
        
        # اگر هیچ capability تشخیص داده نشد، به صورت پیش‌فرض chat و content
        if not capabilities:
            capabilities = ['chat', 'content']
        
        return list(set(capabilities))  # حذف تکراری‌ها
    
    def _parse_pricing(self, pricing_data: Dict[str, Any], type: str) -> Optional[float]:
        """
        Parse قیمت از داده‌های API
        
        Args:
            pricing_data: داده‌های pricing
            type: 'input' یا 'output'
            
        Returns:
            قیمت به صورت float یا None
        """
        if not pricing_data:
            return None
        
        price = pricing_data.get(type)
        if price is None:
            return None
        
        try:
            return float(price)
        except (ValueError, TypeError):
            return None

