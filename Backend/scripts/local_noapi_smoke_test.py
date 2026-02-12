import os
import sys
from io import BytesIO
from pathlib import Path
import struct
import wave

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.django.base")

import django
django.setup()

from src.ai.services.image_generation_service import AIImageGenerationService
from src.ai.services.audio_generation_service import AIAudioGenerationService
from src.ai.providers.registry import AIProviderRegistry

PNG_1X1 = bytes.fromhex(
    "89504E470D0A1A0A"
    "0000000D49484452000000010000000108060000001F15C489"
    "0000000A49444154789C6360000000020001E221BC330000000049454E44AE426082"
)

def make_wav_beep(duration_sec=0.2, sample_rate=16000, freq=440):
    import math
    n_samples = int(duration_sec * sample_rate)
    buf = BytesIO()
    with wave.open(buf, 'wb') as wavf:
        wavf.setnchannels(1)
        wavf.setsampwidth(2)
        wavf.setframerate(sample_rate)
        frames = bytearray()
        for i in range(n_samples):
            s = int(32767 * 0.2 * math.sin(2 * math.pi * freq * i / sample_rate))
            frames += struct.pack('<h', s)
        wavf.writeframes(bytes(frames))
    buf.seek(0)
    return buf.getvalue()

class LocalMockProvider:
    def __init__(self, api_key, config=None):
        self.api_key = api_key
        self.config = config or {}

    async def generate_image(self, prompt: str, **kwargs):
        return BytesIO(PNG_1X1)

    async def text_to_speech(self, text: str, **kwargs):
        return BytesIO(make_wav_beep())

    async def close(self):
        return None

orig_get = AIProviderRegistry.get
AIProviderRegistry.get = classmethod(lambda cls, provider_name: LocalMockProvider)

orig_audio_key_getter = AIAudioGenerationService._get_api_key_and_config
AIAudioGenerationService._get_api_key_and_config = classmethod(lambda cls, provider_name, admin=None: ("no-api-required", {}))

try:
    img = AIImageGenerationService.generate_image(
        provider_name='mock-provider',
        prompt='test prompt for image',
        api_key='no-api-required',
        config={'model': 'local-mock-image'}
    )
    img_bytes = img.getvalue()
    is_png = img_bytes[:8] == b'\x89PNG\r\n\x1a\n'

    audio_bytes, audio_meta = AIAudioGenerationService.generate_audio_only(
        provider_name='openai',
        text='این یک تست محلی بدون API واقعی است.'
    )
    wav = audio_bytes.getvalue()
    is_wav = wav[:4] == b'RIFF' and wav[8:12] == b'WAVE'

    out_dir = BASE_DIR / 'media' / 'samples'
    out_dir.mkdir(parents=True, exist_ok=True)
    img_path = out_dir / 'local_noapi_image_smoke.png'
    wav_path = out_dir / 'local_noapi_audio_smoke.wav'
    img_path.write_bytes(img_bytes)
    wav_path.write_bytes(wav)

    print('IMAGE_OK=', is_png, 'BYTES=', len(img_bytes), 'FILE=', str(img_path))
    print('AUDIO_OK=', is_wav, 'BYTES=', len(wav), 'FILE=', str(wav_path))
    print('AUDIO_META=', audio_meta)
finally:
    AIProviderRegistry.get = orig_get
    AIAudioGenerationService._get_api_key_and_config = orig_audio_key_getter
