#!/usr/bin/env python
"""
اسکریپت کامل برای import کردن شهرها و استان‌های ایران
اجرا: python scripts/import_iranian_locations.py
"""

import os
import sys

# اضافه کردن مسیر پروژه به sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# تنظیم Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')

try:
    import django
    from django.db import transaction
    django.setup()
    from src.user.models.location import Province, City
except ImportError as e:
    print(f"❌ خطا در import Django: {e}")
    print("مطمئن شوید که Django نصب شده و مسیر درست است")
    sys.exit(1)

def main():
    """تابع اصلی برای import داده‌های مکانی ایران"""
    
    print("🚀 شروع import داده‌های استان‌ها و شهرهای ایران...")
    
    # داده‌های استان‌ها با کدها و شهرها
    provinces_data = [
        {"name": "آذربایجان شرقی", "code": "01", "cities": ["تبریز", "مراغه", "میانه", "شبستر", "مرند"]},
        {"name": "آذربایجان غربی", "code": "02", "cities": ["ارومیه", "خوی", "مهاباد", "بوکان", "میاندوآب"]},
        {"name": "اردبیل", "code": "03", "cities": ["اردبیل", "پارس‌آباد", "خلخال", "مشگین‌شهر", "کوثر"]},
        {"name": "اصفهان", "code": "04", "cities": ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌شهر"]},
        {"name": "البرز", "code": "05", "cities": ["کرج", "فردیس", "نظرآباد", "هشتگرد", "ساوجبلاغ"]},
        {"name": "ایلام", "code": "06", "cities": ["ایلام", "دهلران", "آبدانان", "دره‌شهر", "ایوان"]},
        {"name": "بوشهر", "code": "07", "cities": ["بوشهر", "برازجان", "گناوه", "خورموج", "جم"]},
        {"name": "تهران", "code": "08", "cities": ["تهران", "ورامین", "رباط‌کریم", "شهریار", "اسلام‌شهر"]},
        {"name": "چهارمحال و بختیاری", "code": "09", "cities": ["شهرکرد", "بروجن", "فارسان", "لردگان", "اردل"]},
        {"name": "خراسان جنوبی", "code": "10", "cities": ["بیرجند", "قائن", "فردوس", "طبس", "نهبندان"]},
        {"name": "خراسان رضوی", "code": "11", "cities": ["مشهد", "نیشابور", "سبزوار", "کاشمر", "تربت حیدریه"]},
        {"name": "خراسان شمالی", "code": "12", "cities": ["بجنورد", "آشخانه", "اسفراین", "شیروان", "فاروج"]},
        {"name": "خوزستان", "code": "13", "cities": ["اهواز", "آبادان", "خرمشهر", "دزفول", "بهبهان"]},
        {"name": "زنجان", "code": "14", "cities": ["زنجان", "ابهر", "خرمدره", "طارم", "ماهنشان"]},
        {"name": "سمنان", "code": "15", "cities": ["سمنان", "شاهرود", "دامغان", "گرمسار", "آرادان"]},
        {"name": "سیستان و بلوچستان", "code": "16", "cities": ["زاهدان", "چابهار", "زابل", "ایرانشهر", "سراوان"]},
        {"name": "فارس", "code": "17", "cities": ["شیراز", "کازرون", "مرودشت", "جهرم", "لارستان"]},
        {"name": "قزوین", "code": "18", "cities": ["قزوین", "تاکستان", "آبیک", "الوند", "بویین‌زهرا"]},
        {"name": "قم", "code": "19", "cities": ["قم"]},
        {"name": "کردستان", "code": "20", "cities": ["سنندج", "بانه", "سقز", "مریوان", "دیواندره"]},
        {"name": "کرمان", "code": "21", "cities": ["کرمان", "جیرفت", "رفسنجان", "زرند", "سیرجان"]},
        {"name": "کرمانشاه", "code": "22", "cities": ["کرمانشاه", "اسلام‌آباد غرب", "کنگاور", "هرسین", "سنقر"]},
        {"name": "کهگیلویه و بویراحمد", "code": "23", "cities": ["یاسوج", "گچساران", "دوگنبدان", "دنا", "باشت"]},
        {"name": "گلستان", "code": "24", "cities": ["گرگان", "گنبد کاووس", "علی‌آباد کتول", "مینودشت", "آق‌قلا"]},
        {"name": "گیلان", "code": "25", "cities": ["رشت", "انزلی", "لاهیجان", "لنگرود", "رودسر"]},
        {"name": "لرستان", "code": "26", "cities": ["خرم‌آباد", "بروجرد", "دورود", "الیگودرز", "کوهدشت"]},
        {"name": "مازندران", "code": "27", "cities": ["ساری", "بابل", "آمل", "قائم‌شهر", "بابلسر"]},
        {"name": "مرکزی", "code": "28", "cities": ["اراک", "ساوه", "خمین", "محلات", "دلیجان"]},
        {"name": "هرمزگان", "code": "29", "cities": ["بندرعباس", "قشم", "کیش", "میناب", "بندر لنگه"]},
        {"name": "همدان", "code": "30", "cities": ["همدان", "ملایر", "نهاوند", "کبودرآهنگ", "تویسرکان"]},
        {"name": "یزد", "code": "31", "cities": ["یزد", "میبد", "اردکان", "بافق", "ابرکوه"]}
    ]
    
    try:
        with transaction.atomic():
            print("🗑️  پاک کردن داده‌های قبلی...")
            City.objects.all().delete()
            Province.objects.all().delete()
            
            total_provinces = len(provinces_data)
            total_cities = sum(len(prov["cities"]) for prov in provinces_data)
            
            print(f"📊 آماده import {total_provinces} استان و {total_cities} شهر...")
            
            province_count = 0
            city_count = 0
            
            for province_data in provinces_data:
                # ایجاد استان
                province = Province.objects.create(
                    name=province_data["name"],
                    code=province_data["code"],
                    is_active=True
                )
                province_count += 1
                print(f"✅ استان '{province_data['name']}' با کد {province_data['code']} ایجاد شد")
                
                # ایجاد شهرهای استان
                cities = province_data["cities"]
                for index, city_name in enumerate(cities, 1):
                    # کد شهر: کد استان + شماره شهر (2 رقم)
                    city_code = f"{province_data['code']}{index:02d}"
                    City.objects.create(
                        name=city_name,
                        code=city_code,
                        province=province,
                        is_active=True
                    )
                    city_count += 1
                
                print(f"   📍 {len(cities)} شهر برای استان {province_data['name']} اضافه شد")
            
            print(f"\n🎉 import با موفقیت انجام شد!")
            print(f"📊 نتایج نهایی:")
            print(f"   • {province_count} استان ایجاد شد")
            print(f"   • {city_count} شهر ایجاد شد")
            
            # تایید داده‌ها
            db_provinces = Province.objects.count()
            db_cities = City.objects.count()
            
            print(f"\n✅ بررسی دیتابیس:")
            print(f"   • استان‌ها در دیتابیس: {db_provinces}")
            print(f"   • شهرها در دیتابیس: {db_cities}")
            
            if db_provinces == province_count and db_cities == city_count:
                print("\n🎯 همه داده‌ها با موفقیت در دیتابیس ذخیره شدند!")
            else:
                print("\n⚠️  تعداد داده‌ها در دیتابیس مطابقت ندارد!")
            
    except Exception as e:
        print(f"\n❌ خطا در import داده‌ها: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🚀 اسکریپت با موفقیت اجرا شد!")
        exit(0)
    else:
        print("\n💥 اسکریپت با خطا مواجه شد!")
        exit(1)