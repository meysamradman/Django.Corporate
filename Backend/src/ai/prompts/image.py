"""
Image Generation Prompts
=========================
Prompts for AI image generation

Note: Image generation typically needs simpler prompts,
but we can automatically add quality and style enhancements.

IMPORTANT: Prompts are in ENGLISH (standard for image generation models).
"""


# =============================================================================
# Image Enhancement Keywords
# =============================================================================

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


# =============================================================================
# Image Generation Prompts
# =============================================================================

IMAGE_PROMPT = "{prompt}, high quality, detailed, professional, 8k uhd"


# =============================================================================
# Image Quality Enhancement
# =============================================================================

NEGATIVE_PROMPT = (
    "low quality, blurry, distorted, ugly, bad anatomy, "
    "bad proportions, deformed, watermark, signature, text"
)


# =============================================================================
# Helper Functions
# =============================================================================

def get_image_prompt(provider: str = None, style: str = "realistic") -> str:
    """
    Get image generation prompt
    
    Args:
        provider: Provider name (not used - for compatibility)
        style: Image style (realistic, artistic, professional, ...)
    
    Returns:
        prompt template string
    """
    return IMAGE_PROMPT


def enhance_image_prompt(prompt: str, style: str = "realistic", add_quality: bool = True) -> str:
    """
    Enhance image prompt by adding quality keywords and style
    
    Args:
        prompt: User's original prompt
        style: Style (realistic, artistic, professional, ...)
        add_quality: Should quality keywords be added?
    
    Returns:
        Enhanced prompt
    """
    enhanced = prompt
    
    # Add style
    if style in STYLE_PRESETS:
        enhanced += f", {STYLE_PRESETS[style]}"
    
    # Add quality keywords
    if add_quality:
        enhanced += ", " + ", ".join(QUALITY_KEYWORDS[:3])
    
    return enhanced


def get_negative_prompt(provider: str = None) -> str:
    """
    Get negative prompt (things that should NOT be in the image)
    
    Args:
        provider: Provider name (not used - for compatibility)
    
    Returns:
        negative prompt string
    """
    return NEGATIVE_PROMPT
