import os
import sys
def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.django.base')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    print("\n" + "="*80)
    print("🚀 DJANGO SERVER STARTING...")
    print("🔍 Print statements are ENABLED")
    print("📝 You should see logs with emojis: 🏠 for Real Estate, 📁 for Media")
    print("="*80 + "\n")
    main()
