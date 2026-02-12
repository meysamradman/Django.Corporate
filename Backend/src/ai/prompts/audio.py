"""
Audio/Podcast Generation Prompts
==================================
Prompts for audio and podcast content generation

IMPORTANT: Prompts are in ENGLISH, but instruct AI to generate content in PERSIAN/FARSI.

Key points:
- Podcasts need a script that should be conversational and natural
- Should include intro, main content, outro
- Speaking style should be friendly and engaging
"""


# =============================================================================
# Podcast Script Generation Prompts
# =============================================================================

# Full podcast with intro and outro
PODCAST_PROMPT = (
    "Please write a complete podcast script in Persian (Farsi) language for the following topic:\n\n"
    "Topic: {topic}\n"
    "Approximate duration: {duration} minutes\n"
    "Style/Tone: {tone}\n\n"
    "Required structure:\n"
    "1. INTRO (brief introduction - 30 seconds)\n"
    "2. MAIN CONTENT (main content)\n"
    "3. OUTRO (conclusion and goodbye - 30 seconds)\n\n"
    "Important notes:\n"
    "- Text should be conversational and natural (not formal)\n"
    "- Use short and simple sentences\n"
    "- Friendly and intimate tone\n"
    "- Use practical examples\n"
    "- Ask questions to engage the listener\n"
    "- Content should be {word_count} words (for {duration} minutes)\n"
    "- IMPORTANT: All content must be in PERSIAN (FARSI) LANGUAGE\n\n"
    "Return output in JSON format:\n"
    "{{\n"
    "    \"title\": \"podcast title in Persian\",\n"
    "    \"intro\": \"intro text in Persian\",\n"
    "    \"main_content\": \"main content in Persian\",\n"
    "    \"outro\": \"outro text in Persian\",\n"
    "    \"full_script\": \"complete script (including intro + main + outro) in Persian\",\n"
    "    \"word_count\": {word_count},\n"
    "    \"estimated_duration\": \"{duration} minutes\"\n"
    "}}"
)

# Simple audio content (without intro/outro)
AUDIO_SIMPLE_PROMPT = (
    "Please write an audio text in Persian (Farsi) language for the following topic:\n\n"
    "Topic: {topic}\n"
    "Length: {word_count} words\n"
    "Style/Tone: {tone}\n\n"
    "Notes:\n"
    "- Text should be suitable for reading aloud\n"
    "- Short and flowing sentences\n"
    "- Simple punctuation\n"
    "- Clear and understandable\n"
    "- IMPORTANT: All content must be in PERSIAN (FARSI) LANGUAGE\n\n"
    "Return only the text, without JSON format."
)

# Interview script
INTERVIEW_PROMPT = (
    "Please write an interview script (conversation) in Persian (Farsi) language about the following topic:\n\n"
    "Topic: {topic}\n"
    "Duration: {duration} minutes\n\n"
    "Structure:\n"
    "- Question and answer format\n"
    "- Host: short and targeted questions\n"
    "- Guest: accurate and practical answers\n"
    "- IMPORTANT: All dialogue must be in PERSIAN (FARSI) LANGUAGE\n\n"
    "JSON output:\n"
    "{{\n"
    "    \"title\": \"interview title in Persian\",\n"
    "    \"host_name\": \"host name in Persian\",\n"
    "    \"guest_name\": \"guest name in Persian\",\n"
    "    \"conversation\": [\n"
    "        {{\"speaker\": \"host\", \"text\": \"question in Persian\"}},\n"
    "        {{\"speaker\": \"guest\", \"text\": \"answer in Persian\"}}\n"
    "    ]\n"
    "}}"
)


# =============================================================================
# Audio Generation Settings
# =============================================================================

# Word count estimation based on time
# Average: 150 words = 1 minute (in Persian)
WORDS_PER_MINUTE = 150

# Voice settings (for TTS - Text to Speech)
VOICE_SETTINGS = {
    "default": {
        "language": "fa-IR",  # Persian (Iran)
        "speed": 1.0,  # Normal speed
        "pitch": 1.0,  # Normal pitch
    },
    "fast": {
        "language": "fa-IR",
        "speed": 1.2,
        "pitch": 1.0,
    },
    "slow": {
        "language": "fa-IR",
        "speed": 0.8,
        "pitch": 1.0,
    },
}


# =============================================================================
# Helper Functions
# =============================================================================

def get_audio_prompt(prompt_type: str = "podcast", provider: str = None) -> str:
    """
    Get audio content generation prompt
    
    Args:
        prompt_type: Prompt type (podcast, audio_simple, interview)
        provider: Provider name (not used - for compatibility)
    
    Returns:
        prompt string
    """
    if prompt_type == "audio_simple":
        return AUDIO_SIMPLE_PROMPT
    elif prompt_type == "interview":
        return INTERVIEW_PROMPT
    else:
        return PODCAST_PROMPT  # default


def calculate_word_count(duration_minutes: int) -> int:
    """
    Calculate required word count for specified duration
    
    Args:
        duration_minutes: Duration in minutes
    
    Returns:
        Approximate word count
    """
    return duration_minutes * WORDS_PER_MINUTE


def estimate_duration(word_count: int) -> float:
    """
    تخمین مدت زمان بر اساس تعداد کلمه
    
    Args:
        word_count: تعداد کلمه
    
    Returns:
        مدت زمان به دقیقه
    """
    return round(word_count / WORDS_PER_MINUTE, 1)
