from typing import Dict
from src.payment.models.provider import PaymentProvider
from src.payment.providers.base import BasePaymentProvider
from src.payment.providers.zarinpal import ZarinpalProvider


class PaymentProviderFactory:
    """Factory for creating payment provider instances"""
    
    PROVIDER_CLASSES = {
        'zarinpal': ZarinpalProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_type: str = None) -> BasePaymentProvider:
        """
        Get payment provider instance
        
        Args:
            provider_type: Provider type (zarinpal, idpay, etc.)
                          If None, uses default provider
        
        Returns:
            BasePaymentProvider instance
        """
        if not provider_type:
            provider = PaymentProvider.objects.filter(
                is_active=True,
                is_default=True
            ).first()
            
            if not provider:
                raise ValueError("No default payment provider found")
            
            provider_type = provider.provider_type
            provider_config = cls._get_provider_config(provider)
        else:
            provider = PaymentProvider.objects.filter(
                provider_type=provider_type,
                is_active=True
            ).first()
            
            if not provider:
                raise ValueError(f"Payment provider '{provider_type}' not found or inactive")
            
            provider_config = cls._get_provider_config(provider)
        
        provider_class = cls.PROVIDER_CLASSES.get(provider_type)
        
        if not provider_class:
            raise ValueError(f"Provider class for '{provider_type}' not implemented")
        
        return provider_class(provider_config)
    
    @classmethod
    def _get_provider_config(cls, provider: PaymentProvider) -> Dict:
        """Get provider configuration dictionary"""
        return {
            'merchant_id': provider.merchant_id,
            'api_key': provider.api_key,
            'sandbox_mode': provider.sandbox_mode,
            'callback_url': provider.callback_url,
            'config': provider.config or {},
        }
    
    @classmethod
    def register_provider(cls, provider_type: str, provider_class):
        """Register a new payment provider class"""
        if not issubclass(provider_class, BasePaymentProvider):
            raise ValueError("Provider class must inherit from BasePaymentProvider")
        
        cls.PROVIDER_CLASSES[provider_type] = provider_class
