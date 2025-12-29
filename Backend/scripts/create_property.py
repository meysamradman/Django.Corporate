#!/usr/bin/env python

import os
import sys
import django
from django.core.files.base import ContentFile
from decimal import Decimal
import uuid

project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(project_dir)
sys.path.insert(0, project_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
django.setup()

from django.contrib.auth import get_user_model
from django.db.models.signals import pre_save
from src.real_estate.models.property import Property
from src.real_estate.models.media import PropertyImage, PropertyVideo, PropertyAudio, PropertyDocument
from src.real_estate.models.type import PropertyType
from src.real_estate.models.state import PropertyState
from src.real_estate.models.label import PropertyLabel
from src.real_estate.models.feature import PropertyFeature
from src.real_estate.models.tag import PropertyTag
from src.real_estate.models.agent import PropertyAgent
from src.real_estate.models.agency import RealEstateAgency
from src.core.models import Country, Province, City
from src.real_estate.models.location import CityRegion
from src.media.models.media import ImageMedia, VideoMedia, AudioMedia, DocumentMedia
from src.real_estate.signals import update_property_search_vector

def create_sample_media_files():
    sample_dir = os.path.join(project_dir, 'media', 'samples')
    os.makedirs(sample_dir, exist_ok=True)
    
    image_path = os.path.join(sample_dir, 'sample_image.jpg')
    if not os.path.exists(image_path):
        jpeg_content = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x08\t\x09\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xdb\x00C\x01\t\t\t\x0c\x0b\x0c\x18\r\r\x182!\x1c!2222222222222222222222222222222222222222222222222\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xc4\x00\x1f\x01\x00\x03\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x11\x00\x02\x01\x02\x04\x04\x03\x04\x07\x05\x04\x04\x00\x00\x01\x02w\x00\x01\x02\x03\x11\x04\x05!1\x06\x12AQ\x07aq\x13"2\x81\x08\x14B\x91\xa1\xb1\xc1\t#3R\xf0\x15br\xd1\n\x16$4\xe1%\xf1\x17\x18\x19\x1a&\'()*56789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00?\x00\xff\xd9'
        with open(image_path, 'wb') as f:
            f.write(jpeg_content)
    
    video_path = os.path.join(sample_dir, 'sample_video.mp4')
    if not os.path.exists(video_path):
        mp4_content = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom\x00\x00\x00\x08free'
        with open(video_path, 'wb') as f:
            f.write(mp4_content)
    
    audio_path = os.path.join(sample_dir, 'sample_audio.mp3')
    if not os.path.exists(audio_path):
        mp3_content = b'\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom\x00\x00\x00\x08free'
        with open(audio_path, 'wb') as f:
            f.write(mp3_content)
    
    pdf_path = os.path.join(sample_dir, 'sample_document.pdf')
    if not os.path.exists(pdf_path):
        pdf_content = b'%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF'
        with open(pdf_path, 'wb') as f:
            f.write(pdf_content)
    
    return {
        'image': image_path,
        'video': video_path,
        'audio': audio_path,
        'pdf': pdf_path
    }

def get_or_create_defaults():
    User = get_user_model()

    # ✅ جستجوی کاربر ادمین با فیلدهای درست
    admin_user = User.objects.filter(
        user_type='admin',
        is_admin_active=True,
        is_active=True
    ).first()

    if not admin_user:
        raise Exception(
            "No admin user found. Please run: python scripts/create_admin_super.py"
        )

    # Create country first
    country, _ = Country.objects.get_or_create(
        code="IRN",
        defaults={'name': 'Iran', 'is_active': True}
    )

    province, _ = Province.objects.get_or_create(
        name="تهران",
        defaults={'code': '08', 'country': country, 'is_active': True}
    )

    city, _ = City.objects.get_or_create(
        name="تهران",
        province=province,
        defaults={'code': '0801', 'is_active': True}
    )

    # جستجوی CityRegion به صورت ایمن‌تر
    region = CityRegion.objects.filter(
        city=city,
        code=1
    ).first()
    
    if not region:
        # اگر وجود ندارد، ایجاد کن
        region = CityRegion.objects.create(
            name="منطقه ۱",
            city=city,
            code=1,
            is_active=True
        )
    
    # ✅ PropertyType استفاده از MP_Node برای ساخت درخت
    property_type = PropertyType.objects.filter(title="Apartment").first()
    if not property_type:
        property_type = PropertyType.add_root(
            title="Apartment",
            slug='apartment',
            is_active=True,
            display_order=1
        )
    
    property_state, _ = PropertyState.objects.get_or_create(
        title="For Sale",
        defaults={
            'slug': 'for-sale',
            'is_active': True
        }
    )
    
    agent_user = User.objects.filter(user_type='admin').first()
    if not agent_user:
        agent_user = admin_user
    
    # ✅ تعریف license_num و slug قبل از استفاده
    license_num = f'SAMPLE-LIC-{uuid.uuid4().hex[:8]}'
    agent_slug = f'sample-agent-{uuid.uuid4().hex[:8]}'
    
    # ✅ ساخت PropertyAgent با فیلدهای درست
    # نکته: first_name, last_name, phone فیلدهای مستقیم نیستند - از User.admin_profile میخوانند
    agent, _ = PropertyAgent.objects.get_or_create(
        user=agent_user,
        defaults={
            'license_number': license_num,
            'slug': agent_slug,
            'specialization': 'Residential Properties',
            'bio': 'Sample real estate agent for testing purposes',
            'is_active': True,
            'is_verified': True,
            'rating': 4.5,
            'total_sales': 10,
            'total_reviews': 8
        }
    )
    
    return {
        'admin_user': admin_user,
        'province': province,
        'city': city,
        'region': region,
        'property_type': property_type,
        'property_state': property_state,
        'agent': agent
    }

def create_sample_property():
    print("Creating sample property with all media types...")
    
    defaults = get_or_create_defaults()
    sample_files = create_sample_media_files()
    
    unique_slug = f"sample-property-all-media-{uuid.uuid4().hex[:8]}"
    
    pre_save.disconnect(update_property_search_vector, sender=Property)
    
    try:
        property_obj = Property.objects.create(
            title="Sample Property with All Media Types",
            slug=unique_slug,
            short_description="This is a sample property to test all media types",
            description="<p>This property contains images, videos, audio files, and PDF documents to test the complete media system.</p>",
            agent=defaults['agent'],
            property_type=defaults['property_type'],
            state=defaults['property_state'],
            province=defaults['province'],
            city=defaults['city'],
            region=defaults['region'],  # City region field
            address="123 Sample Street, Tehran, Iran",
            postal_code="1234567890",
            latitude=Decimal('35.6892'),
            longitude=Decimal('51.3890'),
            price=50000000000,
            currency="IRR",
            is_negotiable=True,
            land_area=Decimal('200.00'),
            built_area=Decimal('150.00'),
            bedrooms=3,
            bathrooms=2,
            kitchens=1,
            living_rooms=1,
            year_built=1398,  # ✅ سال شمسی (معادل 2020 میلادی)
            build_years=4,
            floors_in_building=10,
            floor_number=5,
            parking_spaces=1,
            storage_rooms=1,
            # usage_type حذف شد - از property_type استفاده می‌شود
            document_type='official',  # نوع سند
            is_published=True,
            is_featured=True,
            is_public=True,
            is_verified=True,
            meta_title="Sample Property",
            meta_description="A sample property with all media types for testing",
            og_title="Sample Property",
            og_description="A sample property with all media types for testing",
            robots_meta="index,follow"
        )
        property_obj.save()
        print(f"Created property: {property_obj.title}")
    finally:
        pre_save.connect(update_property_search_vector, sender=Property)
    
    with open(sample_files['image'], 'rb') as f:
        image_media = ImageMedia()
        image_media.title = "Sample Property Image"
        image_media.alt_text = "Sample image for property"
        image_media.file.save('sample_property_image.jpg', ContentFile(f.read()), save=True)
    
    property_image = PropertyImage.objects.create(
        property=property_obj,
        image=image_media,
        is_main=True,
        order=0
    )
    print(f"Created main image: {image_media.title}")
    
    for i in range(3):
        with open(sample_files['image'], 'rb') as f:
            gallery_image_media = ImageMedia()
            gallery_image_media.title = f"Property Gallery Image {i+1}"
            gallery_image_media.alt_text = f"Gallery image {i+1} for property"
            gallery_image_media.file.save(f'property_gallery_image_{i+1}.jpg', ContentFile(f.read()), save=True)
        
        PropertyImage.objects.create(
            property=property_obj,
            image=gallery_image_media,
            is_main=False,
            order=i+1
        )
        print(f"Created gallery image: {gallery_image_media.title}")
    
    with open(sample_files['video'], 'rb') as f:
        video_media = VideoMedia()
        video_media.title = "Sample Property Video"
        video_media.file.save('sample_property_video.mp4', ContentFile(f.read()), save=True)
    
    with open(sample_files['image'], 'rb') as f:
        video_cover_media = ImageMedia()
        video_cover_media.title = "Property Video Cover Image"
        video_cover_media.alt_text = "Cover image for property video"
        video_cover_media.file.save('property_video_cover.jpg', ContentFile(f.read()), save=True)
        video_media.cover_image = video_cover_media
        video_media.save()
    
    property_video = PropertyVideo.objects.create(
        property=property_obj,
        video=video_media,
        order=4,
        autoplay=False,
        mute=True,
        show_cover=True
    )
    print(f"Created video: {video_media.title}")
    
    with open(sample_files['audio'], 'rb') as f:
        audio_media = AudioMedia()
        audio_media.title = "Sample Property Audio"
        audio_media.file.save('sample_property_audio.mp3', ContentFile(f.read()), save=True)
    
    with open(sample_files['image'], 'rb') as f:
        audio_cover_media = ImageMedia()
        audio_cover_media.title = "Property Audio Cover Image"
        audio_cover_media.alt_text = "Cover image for property audio"
        audio_cover_media.file.save('property_audio_cover.jpg', ContentFile(f.read()), save=True)
        audio_media.cover_image = audio_cover_media
        audio_media.save()
    
    property_audio = PropertyAudio.objects.create(
        property=property_obj,
        audio=audio_media,
        order=5,
        autoplay=False,
        loop=False
    )
    print(f"Created audio: {audio_media.title}")
    
    with open(sample_files['pdf'], 'rb') as f:
        pdf_media = DocumentMedia()
        pdf_media.title = "Sample Property Document"
        pdf_media.file.save('sample_property_document.pdf', ContentFile(f.read()), save=True)
    
    with open(sample_files['image'], 'rb') as f:
        pdf_cover_media = ImageMedia()
        pdf_cover_media.title = "Property Document Cover Image"
        pdf_cover_media.alt_text = "Cover image for property document"
        pdf_cover_media.file.save('property_document_cover.jpg', ContentFile(f.read()), save=True)
        pdf_media.cover_image = pdf_cover_media
        pdf_media.save()
    
    property_document = PropertyDocument.objects.create(
        property=property_obj,
        document=pdf_media,
        order=6,
        title="Sample Property Document"
    )
    print(f"Created PDF document: {pdf_media.title}")
    
    print(f"\nSuccessfully created property '{property_obj.title}' with:")
    print(f"- 1 main image")
    print(f"- 3 gallery images")
    print(f"- 1 video with cover image")
    print(f"- 1 audio file with cover image")
    print(f"- 1 PDF document with cover image")
    print(f"\nProperty ID: {property_obj.id}")
    print(f"Property Slug: {property_obj.slug}")
    
    return property_obj

if __name__ == "__main__":
    try:
        create_sample_property()
    except Exception as e:
        print(f"Error creating sample property: {e}")
        import traceback
        traceback.print_exc()

