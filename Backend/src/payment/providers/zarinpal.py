import requests
from typing import Dict, Optional
from django.conf import settings
from .base import BasePaymentProvider


class ZarinpalProvider(BasePaymentProvider):
    """Zarinpal payment gateway provider"""
    
    SANDBOX_URL = "https://sandbox.zarinpal.com/pg/v4/payment"
    PRODUCTION_URL = "https://api.zarinpal.com/pg/v4/payment"
    
    def __init__(self, provider_config: Dict):
        super().__init__(provider_config)
        self.base_url = self.SANDBOX_URL if self.sandbox_mode else self.PRODUCTION_URL
    
    def initiate_payment(self, payment) -> Dict:
        """Initiate payment with Zarinpal"""
        try:
            url = f"{self.base_url}/request.json"
            
            payload = {
                "merchant_id": self.merchant_id,
                "amount": payment.amount,
                "description": f"Payment for Order #{payment.order.order_number}",
                "callback_url": self.get_callback_url(),
                "metadata": {
                    "mobile": payment.order.user.mobile or "",
                    "email": payment.order.user.email or "",
                }
            }
            
            response = requests.post(url, json=payload, timeout=10)
            data = response.json()
            
            if data.get('data', {}).get('code') == 100:
                authority = data['data']['authority']
                redirect_url = f"https://{'sandbox.' if self.sandbox_mode else ''}zarinpal.com/pg/StartPay/{authority}"
                
                return {
                    'success': True,
                    'authority': authority,
                    'redirect_url': redirect_url,
                    'error': None
                }
            else:
                error_code = data.get('errors', {}).get('code', 'Unknown')
                error_message = data.get('errors', {}).get('message', 'Payment initiation failed')
                
                return {
                    'success': False,
                    'authority': None,
                    'redirect_url': None,
                    'error': f"Error {error_code}: {error_message}"
                }
        
        except Exception as e:
            return {
                'success': False,
                'authority': None,
                'redirect_url': None,
                'error': str(e)
            }
    
    def verify_payment(self, payment, authority: str) -> Dict:
        """Verify payment with Zarinpal"""
        try:
            url = f"{self.base_url}/verify.json"
            
            payload = {
                "merchant_id": self.merchant_id,
                "amount": payment.amount,
                "authority": authority
            }
            
            response = requests.post(url, json=payload, timeout=10)
            data = response.json()
            
            if data.get('data', {}).get('code') in [100, 101]:
                ref_id = data['data'].get('ref_id')
                
                return {
                    'success': True,
                    'ref_id': str(ref_id) if ref_id else None,
                    'error': None
                }
            else:
                error_code = data.get('errors', {}).get('code', 'Unknown')
                error_message = data.get('errors', {}).get('message', 'Payment verification failed')
                
                return {
                    'success': False,
                    'ref_id': None,
                    'error': f"Error {error_code}: {error_message}"
                }
        
        except Exception as e:
            return {
                'success': False,
                'ref_id': None,
                'error': str(e)
            }
    
    def refund_payment(self, payment, amount: Optional[int] = None) -> Dict:
        """Refund payment (Zarinpal requires special API access)"""
        refund_amount = amount or payment.amount
        
        try:
            url = f"{self.base_url}/refund.json"
            
            payload = {
                "merchant_id": self.merchant_id,
                "authority": payment.provider_transaction_id or payment.metadata.get('authority'),
                "amount": refund_amount
            }
            
            response = requests.post(url, json=payload, timeout=10)
            data = response.json()
            
            if data.get('data', {}).get('code') == 100:
                refund_id = data['data'].get('refund_id')
                
                return {
                    'success': True,
                    'refund_id': str(refund_id) if refund_id else None,
                    'error': None
                }
            else:
                error_code = data.get('errors', {}).get('code', 'Unknown')
                error_message = data.get('errors', {}).get('message', 'Refund failed')
                
                return {
                    'success': False,
                    'refund_id': None,
                    'error': f"Error {error_code}: {error_message}"
                }
        
        except Exception as e:
            return {
                'success': False,
                'refund_id': None,
                'error': str(e)
            }
