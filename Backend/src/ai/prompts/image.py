
QUALITY_KEYWORDS = [
    "high quality",
    "detailed",
    "sharp focus",
    "professional",
    "8k",
    "uhd",
]

STYLE_PRESETS = {
    "realistic": "photorealistic, realistic, natural lighting",
    "artistic": "artistic, creative, beautiful composition",
    "professional": "professional photography, studio lighting, commercial",
    "illustration": "digital illustration, artistic drawing, creative art",
    "3d": "3d render, cgi, highly detailed 3d model",
}

IMAGE_PROMPT = "{prompt}, high quality, detailed, professional, 8k uhd"

NEGATIVE_PROMPT = (
    "low quality, blurry, distorted, ugly, bad anatomy, "
    "bad proportions, deformed, watermark, signature, text"
)

def get_image_prompt(provider: str = None, style: str = "realistic") -> str:

    return IMAGE_PROMPT

def enhance_image_prompt(prompt: str, style: str = "realistic", add_quality: bool = True) -> str:

    enhanced = prompt
    
    if style in STYLE_PRESETS:
        enhanced += f", {STYLE_PRESETS[style]}"
    
    if add_quality:
        enhanced += ", " + ", ".join(QUALITY_KEYWORDS[:3])
    
    return enhanced

def get_negative_prompt(provider: str = None) -> str:

    return NEGATIVE_PROMPT
