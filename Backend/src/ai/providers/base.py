from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import httpx
import asyncio
import json
import re
from io import BytesIO
from src.ai.messages.messages import IMAGE_ERRORS, AI_ERRORS

class BaseProvider(ABC):
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        self.api_key = api_key
        self.config = config or {}
        self.client = httpx.AsyncClient(
            timeout=90.0,  # timeout کلی (connect + read)
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    def get_timeout(self) -> float:
        return 90.0
    
    @abstractmethod
    def get_provider_name(self) -> str:
        pass
    
    @abstractmethod
    def validate_api_key(self) -> bool:
        pass
    
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        raise NotImplementedError("Image generation not supported by this provider")
    
    async def generate_content(self, prompt: str, **kwargs) -> str:
        raise NotImplementedError("Content generation not supported by this provider")
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        raise NotImplementedError("SEO content generation not supported by this provider")
    
    async def chat(self, message: str, conversation_history: Optional[list] = None, **kwargs) -> str:
        
        raise NotImplementedError("Chat not supported by this provider")
    
    async def text_to_speech(self, text: str, **kwargs) -> BytesIO:
        raise NotImplementedError("Text-to-speech not supported by this provider")

    @staticmethod
    def extract_json_payload(text: str) -> Optional[Dict[str, Any]]:
        if not text:
            return None

        cleaned = text.strip()
        cleaned = re.sub(r'<think>.*?</think>', '', cleaned, flags=re.DOTALL | re.IGNORECASE).strip()

        if cleaned.startswith('```'):
            cleaned = re.sub(r'^```json\s*', '', cleaned)
            cleaned = re.sub(r'^```\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)
            cleaned = cleaned.strip()

        if '</think>' in cleaned:
            cleaned = cleaned.split('</think>')[-1].strip()

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass

        start = cleaned.find('{')
        if start == -1:
            return None

        depth = 0
        end = -1
        in_string = False
        escape = False

        for index, char in enumerate(cleaned[start:], start=start):
            if in_string:
                if escape:
                    escape = False
                elif char == '\\':
                    escape = True
                elif char == '"':
                    in_string = False
                continue

            if char == '"':
                in_string = True
                continue

            if char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
                if depth == 0:
                    end = index
                    break

        if end == -1:
            return None

        candidate = cleaned[start:end + 1]
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return None

        return None

    def _extract_http_error_detail(self, error: httpx.HTTPStatusError) -> str:
        try:
            data = error.response.json()
            if isinstance(data, dict):
                error_obj = data.get('error')
                if isinstance(error_obj, dict):
                    return str(error_obj.get('message') or error_obj.get('detail') or '')
                if isinstance(error_obj, str):
                    return error_obj
                return str(data.get('detail') or data.get('message') or '')
        except Exception:
            pass

        try:
            return (error.response.text or '')[:500]
        except Exception:
            return ''

    def map_provider_http_error(self, status_code: int, detail_message: str, fallback_key: str) -> str:
        detail_lower = (detail_message or '').lower()

        if status_code == 401:
            return AI_ERRORS["generic_api_key_invalid"]

        if status_code == 403:
            if (
                'disabled' in detail_lower or
                'inactive' in detail_lower or
                'not active' in detail_lower or
                'service disabled' in detail_lower or
                'api disabled' in detail_lower
            ):
                return AI_ERRORS["provider_api_inactive"]
            return AI_ERRORS["provider_access_blocked"]

        if status_code == 402 or 'payment required' in detail_lower or 'paid' in detail_lower or 'pricing' in detail_lower:
            return AI_ERRORS["provider_model_paid_required"]

        if status_code == 429:
            if (
                'quota' in detail_lower or
                'billing' in detail_lower or
                'credit' in detail_lower or
                'limit' in detail_lower
            ):
                return AI_ERRORS["provider_limit_exceeded"]
            return AI_ERRORS["generic_rate_limit"]

        if status_code == 400 and (
            'not a valid model id' in detail_lower or
            ('model' in detail_lower and 'not found' in detail_lower) or
            ('model' in detail_lower and 'invalid' in detail_lower)
        ):
            return AI_ERRORS["generic_model_not_found"]

        if status_code == 404:
            if (
                'not a valid model id' in detail_lower or
                ('model' in detail_lower and 'not found' in detail_lower) or
                ('model' in detail_lower and 'invalid' in detail_lower)
            ):
                return AI_ERRORS["generic_model_not_found"]
            return AI_ERRORS["provider_not_available"]

        if status_code == 410:
            return AI_ERRORS["generic_model_not_found"]

        if (
            'api is disabled' in detail_lower or
            'api disabled' in detail_lower or
            'service disabled' in detail_lower or
            'not active' in detail_lower or
            'inactive' in detail_lower
        ):
            return AI_ERRORS["provider_api_inactive"]

        return AI_ERRORS.get(fallback_key, AI_ERRORS["generic_provider_error"])

    def raise_mapped_http_error(self, error: httpx.HTTPStatusError, fallback_key: str) -> None:
        detail = self._extract_http_error_detail(error)
        mapped_message = self.map_provider_http_error(error.response.status_code, detail, fallback_key)
        raise Exception(mapped_message)

    def raise_mapped_transport_error(self, error: Exception, fallback_key: str) -> None:
        if isinstance(error, httpx.TimeoutException):
            raise Exception(AI_ERRORS["generic_timeout"])

        if isinstance(error, httpx.RequestError):
            raise Exception(AI_ERRORS["provider_server_unreachable"])

        raise Exception(AI_ERRORS.get(fallback_key, AI_ERRORS["generic_provider_error"]))
    
    async def download_image(self, url: str) -> BytesIO:
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            return BytesIO(response.content)
        except Exception as e:
            raise Exception(IMAGE_ERRORS["image_download_failed"].format(error=str(e)))
    
    def get_default_config(self) -> Dict[str, Any]:
        return {
            'width': 1024,
            'height': 1024,
            'quality': 'standard',
        }
    
    async def close(self):

        try:
            if hasattr(self, 'client') and self.client and not self.client.is_closed:
                await self.client.aclose()
        except Exception:
            pass
    
    def __del__(self):

        pass

