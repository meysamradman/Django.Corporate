#!/usr/bin/env python
import os
import argparse
import subprocess
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def run_step(step_name: str, script_name: str, args: list[str] | None = None) -> bool:
    args = args or []
    script_path = os.path.join(BASE_DIR, script_name)
    command = [sys.executable, script_path, *args]

    print(f"\n{'=' * 68}")
    print(f"▶ {step_name}")
    print(f"{'=' * 68}")

    try:
        completed = subprocess.run(command, check=False)
        if completed.returncode != 0:
            print(f"❌ خطا در اجرای {script_name} (کد: {completed.returncode})")
            return False
        print(f"✅ {step_name} با موفقیت انجام شد")
        return True
    except Exception as exc:
        print(f"❌ اجرای {script_name} ناموفق بود: {exc}")
        return False


def main() -> int:
    parser = argparse.ArgumentParser(description='Populate real-estate location data')
    parser.add_argument('--slug-language', choices=['en', 'fa'], default='en')
    parser.add_argument('--include-major-cities', action='store_true')
    parser.add_argument('--cleanup-stale', action='store_true', help='قبل از import رکوردهای قدیمی/خراب را حذف یا غیرفعال می‌کند')
    args = parser.parse_args()

    print("🚀 شروع ورود کامل لوکیشن املاک (استان، شهر، منطقه، مختصات)")
    print(f"🔤 حالت اسلاگ انتخابی: {'English' if args.slug_language == 'en' else 'Persian'}")

    steps = [
        (
            "ورود استان و شهر",
            "import_iranian_locations.py",
            ["--app", "real_estate", "--slug-language", args.slug_language] + (["--cleanup-stale"] if args.cleanup_stale else []),
        ),
        (
            "ورود مناطق شهرها",
            "populate_city_regions.py",
            (["--include-major-cities"] if args.include_major_cities else []) + ["--slug-language", args.slug_language],
        ),
        ("تکمیل مختصات استان/شهر", "populate_location_coordinates.py", []),
    ]

    for title, script, args in steps:
        if not run_step(title, script, args):
            print("\n💥 فرآیند به دلیل خطا متوقف شد")
            return 1

    print("\n🎉 ورود کامل لوکیشن املاک با موفقیت انجام شد")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
