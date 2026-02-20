#!/usr/bin/env python
import os
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
    print("🚀 شروع ورود کامل لوکیشن املاک (استان، شهر، منطقه، مختصات)")

    steps = [
        ("ورود استان و شهر", "import_iranian_locations.py", ["--app", "real_estate"]),
        ("ورود مناطق شهرها (تهران و سایر شهرهای بزرگ)", "populate_city_regions.py", []),
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
