#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Backend'))
django.setup()

from real_estate.models import CityRegion

def main():
    print('🔍 بررسی مناطق در دیتابیس...')
    print(f'تعداد کل مناطق: {CityRegion.objects.count()}')

    tehran_regions = CityRegion.objects.filter(city__name='تهران')
    print(f'تعداد مناطق تهران: {tehran_regions.count()}')

    print('\n📋 مناطق تهران:')
    for region in tehran_regions.order_by('code'):
        print(f'  {region.code}: {region.name}')

    # بررسی چند شهر دیگر
    cities = ['مشهد', 'اصفهان', 'شیراز']
    for city in cities:
        count = CityRegion.objects.filter(city__name=city).count()
        print(f'تعداد مناطق {city}: {count}')

if __name__ == '__main__':
    main()
