from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import httpx
from io import BytesIO


class BaseProvider(ABC):
    
    def __init__(self, api_key: str, config: Optional[Dict[str, Any]] = None):
        self.api_key = api_key
        self.config = config or {}
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(90.0, connect=10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    def get_timeout(self) -> httpx.Timeout:
        """Get timeout for requests - can be overridden by child classes"""
        return httpx.Timeout(90.0, connect=10.0)
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Get provider name"""
        pass
    
    @abstractmethod
    def validate_api_key(self) -> bool:
        """Validate API key"""
        pass
    
    # Image generation methods (optional - implement if provider supports it)
    async def generate_image(self, prompt: str, **kwargs) -> BytesIO:
        """Generate image - override if provider supports image generation"""
        raise NotImplementedError("Image generation not supported by this provider")
    
    # Content generation methods (optional - implement if provider supports it)
    async def generate_content(self, prompt: str, **kwargs) -> str:
        """Generate content - override if provider supports content generation"""
        raise NotImplementedError("Content generation not supported by this provider")
    
    async def generate_seo_content(self, topic: str, **kwargs) -> Dict[str, Any]:
        """Generate SEO-optimized content - override if provider supports content generation"""
        raise NotImplementedError("SEO content generation not supported by this provider")
    
    # Chat methods (optional - implement if provider supports chat)
    async def chat(self, message: str, conversation_history: Optional[list] = None, **kwargs) -> str:
        """Chat with AI - override if provider supports chat"""
        raise NotImplementedError("Chat not supported by this provider")
    
    # Audio generation methods (optional - implement if provider supports TTS)
    async def text_to_speech(self, text: str, **kwargs) -> BytesIO:
        """Convert text to speech - override if provider supports TTS"""
        raise NotImplementedError("Text-to-speech not supported by this provider")
    
    # Utility methods
    async def download_image(self, url: str) -> BytesIO:
        """Download image from URL"""
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            return BytesIO(response.content)
        except Exception as e:
            raise Exception(f"خطا در دانلود تصویر: {str(e)}")
    
    def get_default_config(self) -> Dict[str, Any]:
        """Get default settings"""
        return {
            'width': 1024,
            'height': 1024,
            'quality': 'standard',
        }
    
    async def close(self):
        """Close client"""
        await self.client.aclose()
    
    def __del__(self):
        """Close client when object is deleted"""
        try:
            if hasattr(self, 'client'):
                import asyncio
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(self.client.aclose())
                    else:
                        loop.run_until_complete(self.client.aclose())
                except:
                    pass
        except:
            pass

