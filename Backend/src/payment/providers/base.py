from abc import ABC, abstractmethod
from typing import Dict, Optional


class BasePaymentProvider(ABC):
    """Base class for payment providers"""
    
    def __init__(self, provider_config: Dict):
        self.provider_config = provider_config
        self.merchant_id = provider_config.get('merchant_id')
        self.api_key = provider_config.get('api_key')
        self.sandbox_mode = provider_config.get('sandbox_mode', False)
        self.callback_url = provider_config.get('callback_url')
    
    @abstractmethod
    def initiate_payment(self, payment) -> Dict:
        """
        Initiate payment with provider
        Returns: {
            'success': bool,
            'authority': str (or transaction_id),
            'redirect_url': str,
            'error': str (if failed)
        }
        """
        pass
    
    @abstractmethod
    def verify_payment(self, payment, authority: str) -> Dict:
        """
        Verify payment with provider
        Returns: {
            'success': bool,
            'ref_id': str,
            'error': str (if failed)
        }
        """
        pass
    
    @abstractmethod
    def refund_payment(self, payment, amount: Optional[int] = None) -> Dict:
        """
        Refund payment
        Returns: {
            'success': bool,
            'refund_id': str,
            'error': str (if failed)
        }
        """
        pass
    
    def get_callback_url(self) -> str:
        """Get callback URL for this provider"""
        return self.callback_url or ''
    
    def get_return_url(self) -> str:
        """Get return URL for this provider"""
        return self.provider_config.get('return_url', '')
