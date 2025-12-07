# 🔄 Sync تغییرات بین پروژه‌ها

## چیکار می‌کنه؟

وقتی تو در Corporate تغییر می‌دی و به من می‌گی "این تغییر رو به پروژه‌های دیگه هم اعمال کن" → من خودم می‌رم و همان تغییر را در RealEstate و Shop هم اعمال می‌کنم!

---

## چطوری؟

### 1. آدرس پروژه‌ها را بده

فایل `AI_SYNC_CONFIG.json` را باز کن و آدرس را وارد کن:

```json
{
  "target_projects": [
    {
      "name": "RealEstate",
      "path": "C:\\Users\\HP\\Desktop\\Programing\\Apps\\Monolingual\\Django\\RealEstate",
      "enabled": true
    },
    {
      "name": "Shop",
      "path": "C:\\Users\\HP\\Desktop\\Programing\\Apps\\Monolingual\\Django\\Store",
      "enabled": true
    }
  ]
}
```

### 2. استفاده

بعد از هر تغییر در Corporate، به من بگو:

**"این تغییر رو به RealEstate هم اعمال کن"**

یا

**"این تغییرات رو به همه پروژه‌ها sync کن"**

**من خودم می‌رم و اعمال می‌کنم!** 🚀

---

## مثال

تو: "این تغییر در `Backend/src/core/models/base.py` رو به RealEstate هم اعمال کن"

من:
1. Config را می‌خوانم
2. آدرس RealEstate را پیدا می‌کنم  
3. همان تغییر را در RealEstate اعمال می‌کنم

**تمام!**

---

**همین! فقط آدرس بده و بگو!**
