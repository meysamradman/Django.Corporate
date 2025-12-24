#!/usr/bin/env python
"""
Create Sample Blog Script
🚀 Creates a sample blog post with all types of media for testing purposes.
This helps verify that the blog system works correctly with:
- Featured image
- Image gallery
- Video with cover image
- Audio with cover image
- PDF document with cover image

Usage: python scripts/create_blog.py
"""

import os
import sys
import django
from django.core.files.base import ContentFile
import uuid

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_dir)

# Set up Django (before adding src_dir to avoid email module conflict)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

# Now we can safely add src_dir after Django setup
src_dir = os.path.join(project_dir, 'src')
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from django.contrib.auth import get_user_model
from src.blog.models.blog import Blog
from src.blog.models.media import BlogImage, BlogVideo, BlogAudio, BlogDocument
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia

def create_sample_media_files():
    """Create sample media files in the media directory"""
    # Create a directory for sample files if it doesn't exist
    sample_dir = os.path.join(project_dir, 'media', 'samples')
    os.makedirs(sample_dir, exist_ok=True)
    
    # Create sample image file
    image_path = os.path.join(sample_dir, 'sample_image.jpg')
    if not os.path.exists(image_path):
        # Create a simple JPEG file content (this is a minimal valid JPEG header)
        jpeg_content = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x08\t\x09\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xdb\x00C\x01\t\t\t\x0c\x0b\x0c\x18\r\r\x182!\x1c!2222222222222222222222222222222222222222222222222\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xc4\x00\x1f\x01\x00\x03\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x11\x00\x02\x01\x02\x04\x04\x03\x04\x07\x05\x04\x04\x00\x00\x01\x02w\x00\x01\x02\x03\x11\x04\x05!1\x06\x12AQ\x07aq\x13"2\x81\x08\x14B\x91\xa1\xb1\xc1\t#3R\xf0\x15br\xd1\n\x16$4\xe1%\xf1\x17\x18\x19\x1a&\'()*56789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00?\x00\xff\xd9'
        with open(image_path, 'wb') as f:
            f.write(jpeg_content)
    
    # Create sample video file
    video_path = os.path.join(sample_dir, 'sample_video.mp4')
    if not os.path.exists(video_path):
        # Create a minimal MP4 file content
        mp4_content = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom\x00\x00\x00\x08free'
        with open(video_path, 'wb') as f:
            f.write(mp4_content)
    
    # Create sample audio file
    audio_path = os.path.join(sample_dir, 'sample_audio.mp3')
    if not os.path.exists(audio_path):
        # Create a minimal MP3 file content
        mp3_content = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom\x00\x00\x00\x08free'
        with open(audio_path, 'wb') as f:
            f.write(mp3_content)
    
    # Create sample PDF file
    pdf_path = os.path.join(sample_dir, 'sample_document.pdf')
    if not os.path.exists(pdf_path):
        # Create a minimal PDF file content
        pdf_content = b'%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF'
        with open(pdf_path, 'wb') as f:
            f.write(pdf_content)
    
    return {
        'image': image_path,
        'video': video_path,
        'audio': audio_path,
        'pdf': pdf_path
    }

def create_sample_blog():
    """Create a sample blog post with all types of media"""
    print("Creating sample blog post with all media types...")
    
    # Get or create a super admin user
    User = get_user_model()
    try:
        admin_user = User.objects.filter(is_admin_full=True).first()
        if not admin_user:
            # Try to get any admin user
            admin_user = User.objects.filter(is_admin_active=True, user_type='admin').first()
            
        if not admin_user:
            print("No admin user found. Please create one first.")
            return
    except User.DoesNotExist:
        print("No admin user found. Please create one first.")
        return
    
    # Create sample media files
    sample_files = create_sample_media_files()
    
    # Create the blog post
    unique_slug = f"sample-blog-all-media-{uuid.uuid4().hex[:8]}"
    
    blog = Blog.objects.create(
        title="Sample Blog Post with All Media Types",
        slug=unique_slug,
        short_description="This is a sample blog post to test all media types",
        description="<p>This blog post contains images, videos, audio files, and PDF documents to test the complete media system.</p>",
        status="published",
        is_featured=True,
        is_public=True,
        meta_title="Sample Blog Post",
        meta_description="A sample blog post with all media types for testing",
        og_title="Sample Blog Post",
        og_description="A sample blog post with all media types for testing",
        robots_meta="index,follow"
    )
    print(f"Created blog post: {blog.title}")
    
    # Create sample image media
    with open(sample_files['image'], 'rb') as f:
        image_media = ImageMedia()
        image_media.title = "Sample Image"
        image_media.alt_text = "Sample image for blog post"
        image_media.file.save('sample_image.jpg', ContentFile(f.read()), save=True)
    
    # Create blog image (featured)
    blog_image = BlogImage.objects.create(
        blog=blog,
        image=image_media,
        is_main=True,
        order=0
    )
    print(f"Created featured image: {image_media.title}")
    
    # Create additional gallery images
    for i in range(3):
        with open(sample_files['image'], 'rb') as f:
            gallery_image_media = ImageMedia()
            gallery_image_media.title = f"Gallery Image {i+1}"
            gallery_image_media.alt_text = f"Gallery image {i+1} for blog post"
            gallery_image_media.file.save(f'gallery_image_{i+1}.jpg', ContentFile(f.read()), save=True)
        
        BlogImage.objects.create(
            blog=blog,
            image=gallery_image_media,
            is_main=False,
            order=i+1
        )
        print(f"Created gallery image: {gallery_image_media.title}")
    
    # Create sample video media with cover
    with open(sample_files['video'], 'rb') as f:
        video_media = VideoMedia()
        video_media.title = "Sample Video"
        video_media.file.save('sample_video.mp4', ContentFile(f.read()), save=True)
    
    # Create video cover image
    with open(sample_files['image'], 'rb') as f:
        video_cover_media = ImageMedia()
        video_cover_media.title = "Video Cover Image"
        video_cover_media.alt_text = "Cover image for sample video"
        video_cover_media.file.save('video_cover.jpg', ContentFile(f.read()), save=True)
        video_media.cover_image = video_cover_media
        video_media.save()
    
    # Create blog video
    blog_video = BlogVideo.objects.create(
        blog=blog,
        video=video_media,
        order=4,
        autoplay=False,
        mute=True,
        show_cover=True
    )
    print(f"Created video: {video_media.title}")
    
    # Create sample audio media with cover
    with open(sample_files['audio'], 'rb') as f:
        audio_media = AudioMedia()
        audio_media.title = "Sample Audio"
        audio_media.file.save('sample_audio.mp3', ContentFile(f.read()), save=True)
    
    # Create audio cover image
    with open(sample_files['image'], 'rb') as f:
        audio_cover_media = ImageMedia()
        audio_cover_media.title = "Audio Cover Image"
        audio_cover_media.alt_text = "Cover image for sample audio"
        audio_cover_media.file.save('audio_cover.jpg', ContentFile(f.read()), save=True)
        audio_media.cover_image = audio_cover_media
        audio_media.save()
    
    # Create blog audio
    blog_audio = BlogAudio.objects.create(
        blog=blog,
        audio=audio_media,
        order=5,
        autoplay=False,
        loop=False
    )
    print(f"Created audio: {audio_media.title}")
    
    # Create sample PDF document with cover
    with open(sample_files['pdf'], 'rb') as f:
        pdf_media = DocumentMedia()
        pdf_media.title = "Sample PDF Document"
        pdf_media.file.save('sample_document.pdf', ContentFile(f.read()), save=True)
    
    # Create PDF cover image
    with open(sample_files['image'], 'rb') as f:
        pdf_cover_media = ImageMedia()
        pdf_cover_media.title = "PDF Cover Image"
        pdf_cover_media.alt_text = "Cover image for sample PDF"
        pdf_cover_media.file.save('pdf_cover.jpg', ContentFile(f.read()), save=True)
        pdf_media.cover_image = pdf_cover_media
        pdf_media.save()
    
    # Create blog document
    blog_document = BlogDocument.objects.create(
        blog=blog,
        document=pdf_media,
        order=6,
        title="Sample PDF Document"
    )
    print(f"Created PDF document: {pdf_media.title}")
    
    print(f"\nSuccessfully created blog post '{blog.title}' with:")
    print(f"  - 1 featured image")
    print(f"  - 3 gallery images")
    print(f"  - 1 video with cover image")
    print(f"  - 1 audio file with cover image")
    print(f"  - 1 PDF document with cover image")
    print(f"\nBlog URL: /blog/{blog.slug}/")
    
    return blog

if __name__ == "__main__":
    try:
        create_sample_blog()
    except Exception as e:
        print(f"Error creating sample blog: {e}")
        import traceback
        traceback.print_exc()
