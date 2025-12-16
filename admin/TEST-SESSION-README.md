# 🔥 Session Test Script - راهنمای استفاده

## 📋 پیش‌نیازها

```bash
# نصب Puppeteer
npm install --save-dev puppeteer
```

## 🚀 اجرای تست

```bash
# از پوشه admin
npm run test:session

# یا مستقیم
node test-session.js
```

## ⚙️ تنظیمات

در فایل `test-session.js` می‌توانید تنظیمات را تغییر دهید:

```javascript
const CONFIG = {
  baseUrl: 'http://localhost:3000',      // آدرس frontend
  apiUrl: 'http://localhost:8000',        // آدرس backend
  loginUrl: 'http://localhost:3000/login',
  mobile: '09124707989',                  // شماره موبایل
  password: 'admin123',                   // رمز عبور
  waitTime: 120000,                       // زمان انتظار (2 دقیقه)
  logFile: 'session-test-log.txt',        // فایل لاگ
};
```

## 📊 خروجی تست

اسکریپت:
1. ✅ Login می‌کند
2. ✅ Session و کوکی‌ها را log می‌کند
3. ✅ 2 دقیقه صبر می‌کند
4. ✅ هر 10 ثانیه session را چک می‌کند
5. ✅ Screenshot می‌گیرد
6. ✅ لاگ کامل می‌نویسد

## 📁 فایل‌های تولید شده

- `session-test-log.txt` - لاگ کامل تست
- `screenshot-*.png` - Screenshot های مختلف

## 🔍 بررسی نتایج

بعد از اجرا، فایل `session-test-log.txt` را بررسی کنید:

```
✅ TEST PASSED: Session expired and redirected to login!
```

یا

```
❌ TEST FAILED: Session still exists!
```

## ⚠️ نکات مهم

1. **Captcha**: اسکریپت سعی می‌کند captcha را خودکار حل کند، اما ممکن است نیاز به ورود دستی داشته باشید (10 ثانیه فرصت دارید)

2. **Browser**: مرورگر به صورت visible باز می‌شود (headless: false) تا بتوانید روند را ببینید

3. **Redis**: برای چک کردن Redis، باید دستی از redis-cli استفاده کنید:
   ```bash
   redis-cli KEYS "admin:session:*"
   ```

## 🐛 Troubleshooting

اگر تست fail شد:
1. لاگ را بررسی کنید
2. Screenshot ها را ببینید
3. DevTools مرورگر را باز کنید و Console را چک کنید
4. Network tab را بررسی کنید

