---
description: Describe when these instructions should be loaded
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
ببین فولدر المنت رو ببین ما از tailwind 4 به بعد استفاده میکنیم باید با ساختار tailwind 4 بع بغد استفاده بشه کدها.
css در گلوبال ما از رنگهای تعریف شده در css فقط استفاده میکنیم و با نام کلاسشون باید استفاده بشه. نه رنگی باید اضافه بشه بدون اجازه و باید از همونها که هست همهجا استفاده بشه.
br برای border.
bg برای بک گراند نام گذاری شده.
dark هم همونجاست در فایل css هست.
فایل theme.css هم داریم.
  /* --- Element Color --- */ برای رنگهای متفاوت استفاده میشه.
برای سیاه سفید هم از : 
  --wt: #ffffff;
  --bl: #000000;
استفاده کردیم برای دارک مشکل نداشته باشیم.
ولی برای اینکه سیاه سفید عوض نشه در دارک از :
  /* --- Absolute Colors --- */
  --static-w: #ffffff;
  --static-b: #000000;
استفاده کردیم.
پس ما در بین کدها از :dark استفاده نمیکنیم.
ما برای هدر فوتر و فونت ها باید رنگی که در css براشون نوشتیم استفاده کنیم که مشکل Dark نداشته باشیم.
بیشتر قسمتها برای استفاده رنگها نوشته شده و باید برای همون قسمت استفاده بشه.
برای فونت ها :
  /* Typography*/
  --font-p: #423f50;
  --font-s: #6b6876;
فقط از اینا استفاده میشه که در دارک مشکل نداشته باشند و p همان اصلی هست و s رنگ دوم

بدون اجزاه کلاس و رنگ اضافه نکن