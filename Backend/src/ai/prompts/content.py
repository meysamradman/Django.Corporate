
CONTENT_PROMPT = (
    "Please write a professional and SEO-optimized content in Persian (Farsi) language.\n"
    "Topic: {topic}\n\n"
    "Requirements:\n"
    "- Length: approximately {word_count} words\n"
    "- Style/Tone: {tone}\n"
    "- Must be SEO-optimized\n"
    "- Use keywords naturally\n"
    "- Clear and readable structure\n\n"
    "IMPORTANT: Write the entire content in Persian (Farsi) language.\n"
    "Output as plain text without special formatting."
)

SEO_PROMPT = (
    "Please write a professional and fully SEO-optimized blog content in Persian (Farsi) language for the following topic:\n\n"
    "Topic: {topic}{keywords_str}\n\n"
    "I need the output in the following exact JSON format:\n"
    "{{\n"
    "    \"title\": \"Main title (H1) - max 60 characters, engaging and includes keyword\",\n"
    "    \"meta_title\": \"Meta SEO title - exactly 50-60 characters with main keyword\",\n"
    "    \"meta_description\": \"Meta SEO description - exactly 150-160 characters, engaging with keyword\",\n"
    "    \"slug\": \"url-friendly-slug\",\n"
    "    \"h1\": \"Main heading (H1) - must be exactly the same as title\",\n"
    "    \"h2_list\": [\"First H2 heading used in content\", \"Second H2 heading\", \"At least 2-3 H2 headings\"],\n"
    "    \"h3_list\": [\"First H3 heading used in content\", \"Second H3 heading\", \"At least 2-3 H3 headings\"],\n"
    "    \"content\": \"<p>Full content with HTML tags...</p>\\n\\n<h2>First H2</h2>\\n<p>Content...</p>\",\n"
    "    \"keywords\": [\"keyword 1\", \"keyword 2\", \"keyword 3\"],\n"
    "    \"word_count\": {word_count}\n"
    "}}\n\n"
    "Critical requirements:\n"
    "1. Content must be approximately {word_count} words (text only, excluding HTML tags)\n"
    "2. In the content field, properly use HTML tags <h2> and <h3>\n"
    "3. Headings in h2_list and h3_list must exactly match those used in content\n"
    "4. Use keywords naturally (no keyword stuffing)\n"
    "5. Content must be professional, readable, and useful for readers\n"
    "6. h1 must be exactly the same as title\n"
    "7. Return only valid JSON, without additional explanations\n"
    "8. ALL VALUES MUST BE IN PERSIAN (FARSI) LANGUAGE\n"
    "9. In content, use tags like <h2>heading</h2> and <h3>heading</h3>\n\n"
    "IMPORTANT RULES (MUST FOLLOW):\n"
    "- Output MUST start with '{{' and end with '}}'\n"
    "- Do NOT use markdown code fences مثل ```json\n"
    "- Do NOT include any reasoning or tags like <think>...</think>\n"
    "- Do NOT include any text before or after JSON\n"
    "- Write all content in Persian (Farsi) language."
)

def get_content_prompt(provider: str = None) -> str:

    return CONTENT_PROMPT

def get_seo_prompt(provider: str = None) -> str:

    return SEO_PROMPT
