# معماری Order و Payment Apps

## ساختار پیشنهادی

### 1. Order App (`src/order/`)
مدیریت کامل سفارشات و سبد خرید

#### Models:
- **Cart**: سبد خرید کاربر (session-based یا user-based)
- **CartItem**: آیتم‌های سبد خرید
- **Order**: سفارش نهایی
- **OrderItem**: آیتم‌های سفارش
- **ShippingAddress**: آدرس ارسال
- **OrderStatusHistory**: تاریخچه تغییرات وضعیت سفارش

#### Features:
- سبد خرید (Cart) با session و user support
- مدیریت موجودی (Stock management)
- محاسبه قیمت (Price calculation)
- تخفیف‌ها (Discounts/Coupons)
- تاریخچه سفارشات
- آدرس‌های ارسال

---

### 2. Payment App (`src/payment/`)
مدیریت درگاه‌های پرداخت (مستقل و قابل توسعه)

#### Models:
- **Payment**: پرداخت اصلی
- **PaymentProvider**: تنظیمات درگاه‌ها (زرین‌پال، و غیره)
- **Transaction**: تراکنش‌های پرداخت
- **PaymentMethod**: روش‌های پرداخت (آنلاین، کارت به کارت، و غیره)

#### Providers (Strategy Pattern):
- **ZarinpalProvider**: درگاه زرین‌پال
- **BasePaymentProvider**: کلاس پایه برای درگاه‌های دیگر
- **PaymentProviderFactory**: Factory برای انتخاب درگاه

#### Features:
- پشتیبانی از چند درگاه
- Callback handling
- Verification
- Refund support
- Transaction logging

---

## ارتباط بین Apps

```
Order (Order App)
    ↓ (ForeignKey)
Payment (Payment App)
    ↓ (ForeignKey)
Transaction (Payment App)
```

---

## مزایای این معماری:

1. **Separation of Concerns**: Order و Payment کاملاً جدا
2. **Scalability**: اضافه کردن درگاه جدید آسان
3. **Testability**: هر app مستقل قابل تست
4. **Maintainability**: کد تمیز و قابل نگهداری
5. **Flexibility**: می‌توان درگاه‌های مختلف را فعال/غیرفعال کرد

---

## مثال استفاده:

```python
# Order App
order = Order.objects.create(user=user, ...)
order_items = [OrderItem(order=order, product=product, ...)]

# Payment App
payment = Payment.objects.create(order=order, amount=order.total)
provider = PaymentProviderFactory.get_provider('zarinpal')
transaction = provider.initiate_payment(payment)
```

---

## نکات مهم:

1. Order و Payment باید از طریق ForeignKey ارتباط داشته باشند
2. Payment Provider ها باید از یک Interface مشترک استفاده کنند
3. تمام تنظیمات درگاه‌ها در .env ذخیره شود
4. از Redis برای session-based cart استفاده شود
5. Transaction ها باید atomic باشند
