"""
Celery Tasks برای AI App
"""

from celery import shared_task
from django.core.management import call_command
from io import StringIO
import logging

from src.ai.utils.cache import AICacheManager

logger = logging.getLogger(__name__)


@shared_task
def sync_ai_models_task(provider=None, capability=None):
    """
    Sync مدل‌های AI از providerهای دینامیک (OpenRouter, Groq, HuggingFace)
    
    این task می‌تواند به صورت خودکار (scheduled) یا دستی اجرا شود.
    
    Args:
        provider: (optional) نام provider (openrouter, groq, huggingface)
        capability: (optional) نام capability (chat, content, image, audio)
    
    Returns:
        dict: نتیجه sync شامل تعداد مدل‌های sync شده
    """
    try:
        out = StringIO()
        err = StringIO()
        
        # Prepare command arguments
        cmd_args = []
        if provider:
            cmd_args.extend(['--provider', provider])
        if capability:
            cmd_args.extend(['--capability', capability])
        
        # Execute sync command
        call_command('sync_ai_models', *cmd_args, stdout=out, stderr=err)
        
        output = out.getvalue()
        error_output = err.getvalue()
        
        # Invalidate cache after sync
        AICacheManager.invalidate_models()
        
        result = {
            'success': True,
            'output': output,
            'errors': error_output if error_output else None,
            'provider': provider,
            'capability': capability,
        }
        
        logger.info(f"AI models synced successfully. Provider: {provider}, Capability: {capability}")
        return result
        
    except Exception as e:
        logger.error(f"Error syncing AI models: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'provider': provider,
            'capability': capability,
        }

