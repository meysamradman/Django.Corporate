from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import httpx
import asyncio
from io import BytesIO
from src.ai.messages.messages import IMAGE_ERRORS

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
        await self.client.aclose()
    
    def __del__(self):
        try:
            if hasattr(self, 'client') and self.client:
                try:
                    if asyncio.iscoroutinefunction(self.client.aclose):
                        try:
                            loop = asyncio.get_event_loop()
                            if loop.is_running():
                                asyncio.create_task(self.client.aclose())
                            else:
                                loop.run_until_complete(self.client.aclose())
                        except RuntimeError:
                            pass
                    else:
                        if hasattr(self.client, 'close'):
                            self.client.close()
                except Exception:
                    pass
        except Exception:
            pass

