# مستندات کامل API برای Postman

## 📋 فهرست مطالب

1. [اطلاعات کلی](#اطلاعات-کلی)
2. [احراز هویت](#احراز-هویت)
3. [User & Admin Management](#user--admin-management)
4. [Blog APIs](#blog-apis)
5. [Portfolio APIs](#portfolio-apis)
6. [Media APIs](#media-apis)
7. [AI APIs](#ai-apis)
8. [Chatbot APIs](#chatbot-apis)
9. [Ticket APIs](#ticket-apis)
10. [Email APIs](#email-apis)
11. [Settings APIs](#settings-apis)
12. [Page APIs](#page-apis)
13. [Form APIs](#form-apis)
14. [Statistics APIs](#statistics-apis)
15. [Panel APIs](#panel-apis)
16. [Core APIs](#core-apis)

---

## اطلاعات کلی

### Base URL
```
http://localhost:8000
```

### Headers عمومی

#### برای Admin APIs:
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

#### برای User APIs:
```
Authorization: Bearer {user_access_token}
Content-Type: application/json
```

### Pagination
تمام لیست‌ها از pagination استفاده می‌کنند:
- `limit`: تعداد آیتم در هر صفحه (پیش‌فرض: 20)
- `offset`: تعداد آیتم‌های رد شده (پیش‌فرض: 0)

### Query Parameters عمومی
- `search`: جستجو در فیلدهای مشخص شده
- `ordering`: مرتب‌سازی (مثال: `-created_at` برای نزولی)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

---

## احراز هویت

### 1. Admin Login
**POST** `http://localhost:8000/api/admin/login/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "is_superuser": true
  }
}
```

---

### 2. Admin Register
**POST** `http://localhost:8000/api/admin/register/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "newadmin@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "mobile": "09123456789",
  "profile": {
    "first_name": "نام",
    "last_name": "نام خانوادگی"
  }
}
```

---

### 3. Admin Logout
**POST** `http://localhost:8000/api/admin/logout/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### 4. User Login
**POST** `http://localhost:8000/api/user/login/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### 5. User Register
**POST** `http://localhost:8000/api/user/register/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "mobile": "09123456789"
}
```

---

### 6. User Logout
**POST** `http://localhost:8000/api/user/logout/`

**Headers:**
```
Authorization: Bearer {user_access_token}
```

---

### 7. Token Refresh (User)
**POST** `http://localhost:8000/api/token/refresh/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### 8. Send OTP
**POST** `http://localhost:8000/api/mobile/send-otp/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "mobile": "09123456789"
}
```

---

### 9. Verify OTP
**POST** `http://localhost:8000/api/mobile/verify-otp/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "mobile": "09123456789",
  "otp": "123456"
}
```

---

### 10. Get CSRF Token
**GET** `http://localhost:8000/api/core/csrf-token/`

---

### 11. Generate Captcha
**GET** `http://localhost:8000/api/core/captcha/generate/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

**Response:**
```json
{
  "captcha_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "digits": "1234"
}
```

**توضیحات:**
- `captcha_id`: شناسه یکتای CAPTCHA (32 کاراکتر hex)
- `digits`: اعداد CAPTCHA که باید نمایش داده شود (4 رقم)

---

### 12. Verify Captcha
**POST** `http://localhost:8000/api/core/captcha/verify/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "captcha_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "user_answer": "1234"
}
```

**Response (موفق):**
```json
{
  "verified": true
}
```

**Response (ناموفق):**
```json
{
  "detail": "CAPTCHA نامعتبر است",
  "verified": false
}
```

**توضیحات:**
- `captcha_id`: شناسه CAPTCHA که از endpoint generate دریافت شده
- `user_answer`: پاسخ کاربر (4 رقم)

---

## User & Admin Management

### Admin Management

#### 1. List Admins
**GET** `http://localhost:8000/api/admin/management/`

**Query Parameters:**
- `search`: جستجو در email, mobile
- `is_active`: فیلتر بر اساس وضعیت فعال (true/false)
- `is_superuser`: فیلتر بر اساس superuser (true/false)
- `ordering`: مرتب‌سازی (مثال: `-created_at`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Admin by ID
**GET** `http://localhost:8000/api/admin/management/{admin_id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Get Current Admin (Me)
**GET** `http://localhost:8000/api/admin/management/me/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 4. Get Admin by Public ID
**GET** `http://localhost:8000/api/admin/management/by-public-id/{public_id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 5. Create Admin
**POST** `http://localhost:8000/api/admin/management/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "newadmin@example.com",
  "mobile": "09123456789",
  "password": "password123",
  "is_active": true,
  "is_staff": true,
  "is_superuser": false,
  "role_id": "role-uuid",
  "profile": {
    "first_name": "نام",
    "last_name": "نام خانوادگی",
    "phone": "02112345678"
  }
}
```

---

#### 6. Update Admin
**PUT/PATCH** `http://localhost:8000/api/admin/management/{admin_id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "updated@example.com",
  "mobile": "09123456789",
  "is_active": true,
  "role_id": "role-uuid",
  "profile": {
    "first_name": "نام جدید",
    "last_name": "نام خانوادگی جدید"
  }
}
```

---

#### 7. Delete Admin
**DELETE** `http://localhost:8000/api/admin/management/{admin_id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 8. Bulk Delete Admins
**POST** `http://localhost:8000/api/admin/management/bulk-delete/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "ids": [1, 2, 3]
}
```

---

### Admin Profile

#### 1. Get Admin Profile
**GET** `http://localhost:8000/api/admin/profile/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Update Admin Profile
**PUT/PATCH** `http://localhost:8000/api/admin/profile/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "first_name": "نام",
  "last_name": "نام خانوادگی",
  "birth_date": "1990-01-01",
  "national_id": "1234567890",
  "address": "آدرس",
  "phone": "02112345678",
  "province": 1,
  "city": 1,
  "bio": "بیوگرافی",
  "profile_picture": 123,
  "profile_picture_file": null
}
```

---

### User Management (Admin)

#### 1. List Users
**GET** `http://localhost:8000/api/admin/users-management/`

**Query Parameters:**
- `search`: جستجو در email, mobile
- `is_active`: فیلتر بر اساس وضعیت فعال (true/false)
- `ordering`: مرتب‌سازی (مثال: `-created_at`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get User by ID
**GET** `http://localhost:8000/api/admin/users-management/{user_id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create User
**POST** `http://localhost:8000/api/admin/users-management/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "mobile": "09123456789",
  "password": "password123",
  "is_active": true
}
```

---

#### 4. Update User
**PUT/PATCH** `http://localhost:8000/api/admin/users-management/{user_id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "updated@example.com",
  "mobile": "09123456789",
  "is_active": true
}
```

---

#### 5. Delete User
**DELETE** `http://localhost:8000/api/admin/users-management/{user_id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 6. Bulk Delete Users
**POST** `http://localhost:8000/api/admin/users-management/bulk-delete/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "ids": [1, 2, 3]
}
```

---

### User Profile

#### 1. Get User Profile
**GET** `http://localhost:8000/api/user/profile/`

**Headers:**
```
Authorization: Bearer {user_access_token}
```

---

#### 2. Update User Profile
**PUT/PATCH** `http://localhost:8000/api/user/profile/`

**Headers:**
```
Authorization: Bearer {user_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "first_name": "نام",
  "last_name": "نام خانوادگی",
  "birth_date": "1990-01-01",
  "national_id": "1234567890",
  "address": "آدرس",
  "phone": "02112345678",
  "province": 1,
  "city": 1,
  "bio": "بیوگرافی",
  "profile_picture": 123
}
```

---

### Admin Roles

#### 1. List Roles
**GET** `http://localhost:8000/api/admin/roles/`

**Query Parameters:**
- `search`: جستجو در name, display_name, description
- `ordering`: مرتب‌سازی (مثال: `name`, `-created_at`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Role by ID
**GET** `http://localhost:8000/api/admin/roles/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Role
**POST** `http://localhost:8000/api/admin/roles/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "role_name",
  "display_name": "نام نمایشی",
  "description": "توضیحات"
}
```

---

#### 4. Update Role
**PUT/PATCH** `http://localhost:8000/api/admin/roles/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "updated_role_name",
  "display_name": "نام نمایشی جدید",
  "description": "توضیحات جدید"
}
```

---

#### 5. Delete Role
**DELETE** `http://localhost:8000/api/admin/roles/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 6. Bulk Delete Roles
**POST** `http://localhost:8000/api/admin/roles/bulk-delete/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "ids": [1, 2, 3]
}
```

---

### Admin Permissions

#### 1. List Permissions
**GET** `http://localhost:8000/api/admin/permissions/`

**Query Parameters:**
- `search`: جستجو در name, display_name, description
- `ordering`: مرتب‌سازی (مثال: `name`, `-created_at`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Permission by ID
**GET** `http://localhost:8000/api/admin/permissions/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Get Permission Map
**GET** `http://localhost:8000/api/admin/permissions/map/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 4. Check Permission
**POST** `http://localhost:8000/api/admin/permissions/check/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "permission": "blog.create"
}
```

---

### Location APIs

#### 1. List Provinces
**GET** `http://localhost:8000/api/provinces/`

**Query Parameters:**
- `search`: جستجو در name
- `ordering`: مرتب‌سازی

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

---

#### 2. Get Province by ID
**GET** `http://localhost:8000/api/provinces/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

---

#### 3. List Cities
**GET** `http://localhost:8000/api/cities/`

**Query Parameters:**
- `search`: جستجو در name
- `province`: فیلتر بر اساس استان (province ID)
- `ordering`: مرتب‌سازی

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

---

#### 4. Get City by ID
**GET** `http://localhost:8000/api/cities/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
```

---

## Blog APIs

### Admin Blog APIs

#### 1. List Blogs (Admin)
**GET** `http://localhost:8000/api/admin/blog/`

**Query Parameters:**
- `search`: جستجو در title, short_description, meta_title, meta_description
- `status`: فیلتر بر اساس وضعیت (draft, published, archived)
- `is_featured`: فیلتر بر اساس featured (true/false)
- `is_public`: فیلتر بر اساس public (true/false)
- `is_active`: فیلتر بر اساس active (true/false)
- `created_after`: تاریخ شروع (YYYY-MM-DD)
- `created_before`: تاریخ پایان (YYYY-MM-DD)
- `category`: فیلتر بر اساس category ID
- `category_slug`: فیلتر بر اساس category slug
- `tag`: فیلتر بر اساس tag ID
- `tag_slug`: فیلتر بر اساس tag slug
- `categories__in`: فیلتر بر اساس چند category (comma-separated IDs)
- `seo_status`: فیلتر SEO (complete, incomplete, missing)
- `has_meta_title`: فیلتر بر اساس داشتن meta_title (true/false)
- `has_meta_description`: فیلتر بر اساس داشتن meta_description (true/false)
- `has_og_image`: فیلتر بر اساس داشتن og_image (true/false)
- `has_canonical_url`: فیلتر بر اساس داشتن canonical_url (true/false)
- `has_main_image`: فیلتر بر اساس داشتن main image (true/false)
- `media_count`: تعداد دقیق media files
- `media_count_gte`: حداقل تعداد media files
- `ordering`: مرتب‌سازی (created_at, updated_at, title, status)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Blog by ID (Admin)
**GET** `http://localhost:8000/api/admin/blog/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Blog
**POST** `http://localhost:8000/api/admin/blog/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: multipart/form-data
```

**Body (Form Data در Postman):**

در Postman:
1. تب **Body** را انتخاب کنید
2. **form-data** را انتخاب کنید
3. فیلدها را به صورت زیر اضافه کنید:

| Key | Type | Value |
|-----|------|-------|
| title | Text | عنوان بلاگ |
| slug | Text | blog-slug |
| short_description | Text | توضیحات کوتاه |
| description | Text | توضیحات کامل (HTML مجاز) |
| status | Text | `draft` یا `published` یا `archived` |
| is_featured | Text | `true` یا `false` |
| is_public | Text | `true` یا `false` |
| meta_title | Text | عنوان SEO (اختیاری) |
| meta_description | Text | توضیحات SEO (اختیاری) |
| og_title | Text | عنوان OG (اختیاری) |
| og_description | Text | توضیحات OG (اختیاری) |
| canonical_url | Text | لینک canonical (اختیاری) |
| robots_meta | Text | `index, follow` یا `noindex, nofollow` (اختیاری) |
| categories_ids | Text | `[1, 2]` یا `1,2` (JSON array یا comma-separated) |
| tags_ids | Text | `[1, 2]` یا `1,2` (JSON array یا comma-separated) |
| media_files | File | (انتخاب فایل - می‌توانید چند فایل انتخاب کنید) |

**مثال کامل در Postman:**

برای آپلود فایل:
- Key: `media_files` (نوع: File)
- Value: فایل را انتخاب کنید (می‌توانید چند فایل انتخاب کنید)

برای categories_ids:
- Key: `categories_ids` (نوع: Text)
- Value: `[1, 2, 3]` یا `1,2,3`

**نکات مهم:**
- می‌توانید همزمان `media_files` (آپلود فایل جدید) و `media_ids` (استفاده از فایل موجود) استفاده کنید
- حداکثر تعداد media: طبق تنظیمات سیستم (معمولاً 10)
- اگر `meta_title` و `meta_description` ندهید، به صورت خودکار از `title` و `short_description` ساخته می‌شود

---

#### 4. Update Blog
**PUT/PATCH** `http://localhost:8000/api/admin/blog/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "عنوان جدید",
  "slug": "new-slug",
  "short_description": "توضیحات کوتاه جدید",
  "description": "توضیحات کامل جدید",
  "status": "published",
  "is_featured": true,
  "is_public": true,
  "is_active": true,
  "meta_title": "عنوان SEO جدید",
  "meta_description": "توضیحات SEO جدید",
  "og_title": "عنوان OG جدید",
  "og_description": "توضیحات OG جدید",
  "og_image": 123,
  "canonical_url": "https://example.com/blog",
  "robots_meta": "index, follow",
  "categories_ids": [1, 2],
  "tags_ids": [1, 2],
  "media_ids": [10, 11, 12],
  "main_image_id": 10,
  "media_covers": {
    "10": 20,
    "11": null
  }
}
```

---

#### 5. Delete Blog
**DELETE** `http://localhost:8000/api/admin/blog/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 6. Export Blogs
**GET** `http://localhost:8000/api/admin/blog/export/`

**Query Parameters:**
- `format`: فرمت خروجی (xlsx, csv)
- (همه فیلترهای لیست قابل استفاده است)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Public Blog APIs

#### 1. List Blogs (Public)
**GET** `http://localhost:8000/api/blog/`

**Query Parameters:**
- `search`: جستجو در title, short_description, description, categories__name, tags__name
- `category`: فیلتر بر اساس category slug
- `tag`: فیلتر بر اساس tag slug
- `is_featured`: فیلتر بر اساس featured (true/false)
- `ordering`: مرتب‌سازی (title, created_at, is_featured)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Get Blog by Slug (Public)
**GET** `http://localhost:8000/api/blog/{slug}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

### Admin Blog Category APIs

#### 1. List Categories (Admin)
**GET** `http://localhost:8000/api/admin/blog-category/`

**Query Parameters:**
- `search`: جستجو در name, description
- `ordering`: مرتب‌سازی (path, created_at, name)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Category by ID (Admin)
**GET** `http://localhost:8000/api/admin/blog-category/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Category
**POST** `http://localhost:8000/api/admin/blog-category/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام دسته‌بندی",
  "slug": "category-slug",
  "description": "توضیحات",
  "parent": null,
  "sort_order": 1,
  "is_active": true
}
```

---

#### 4. Update Category
**PUT/PATCH** `http://localhost:8000/api/admin/blog-category/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام جدید",
  "slug": "new-slug",
  "description": "توضیحات جدید",
  "parent": 1,
  "sort_order": 2,
  "is_active": true
}
```

---

#### 5. Delete Category
**DELETE** `http://localhost:8000/api/admin/blog-category/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Public Blog Category APIs

#### 1. List Categories (Public)
**GET** `http://localhost:8000/api/blog-category/`

**Query Parameters:**
- `search`: جستجو در name, description
- `ordering`: مرتب‌سازی (name, sort_order, blog_count)

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Get Category by Slug (Public)
**GET** `http://localhost:8000/api/blog-category/{slug}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

### Admin Blog Tag APIs

#### 1. List Tags (Admin)
**GET** `http://localhost:8000/api/admin/blog-tag/`

**Query Parameters:**
- `search`: جستجو در name, description
- `ordering`: مرتب‌سازی (created_at, updated_at, name)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Tag by ID (Admin)
**GET** `http://localhost:8000/api/admin/blog-tag/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Tag
**POST** `http://localhost:8000/api/admin/blog-tag/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام تگ",
  "slug": "tag-slug",
  "description": "توضیحات",
  "is_active": true
}
```

---

#### 4. Update Tag
**PUT/PATCH** `http://localhost:8000/api/admin/blog-tag/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام جدید",
  "slug": "new-slug",
  "description": "توضیحات جدید",
  "is_active": true
}
```

---

#### 5. Delete Tag
**DELETE** `http://localhost:8000/api/admin/blog-tag/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Public Blog Tag APIs

#### 1. List Tags (Public)
**GET** `http://localhost:8000/api/blog-tag/`

**Query Parameters:**
- `search`: جستجو در name, description
- `ordering`: مرتب‌سازی (name, blog_count)

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Get Tag by Slug (Public)
**GET** `http://localhost:8000/api/blog-tag/{slug}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

## Portfolio APIs

### Admin Portfolio APIs

#### 1. List Portfolios (Admin)
**GET** `http://localhost:8000/api/admin/portfolio/`

**Query Parameters:**
- `search`: جستجو در title, short_description, meta_title, meta_description
- `status`: فیلتر بر اساس وضعیت (draft, published, archived)
- `is_featured`: فیلتر بر اساس featured (true/false)
- `is_public`: فیلتر بر اساس public (true/false)
- `is_active`: فیلتر بر اساس active (true/false)
- `created_after`: تاریخ شروع (YYYY-MM-DD)
- `created_before`: تاریخ پایان (YYYY-MM-DD)
- `category`: فیلتر بر اساس category ID
- `category_slug`: فیلتر بر اساس category slug
- `tag`: فیلتر بر اساس tag ID
- `tag_slug`: فیلتر بر اساس tag slug
- `categories__in`: فیلتر بر اساس چند category (comma-separated IDs)
- `seo_status`: فیلتر SEO (complete, incomplete, missing)
- `has_meta_title`: فیلتر بر اساس داشتن meta_title (true/false)
- `has_meta_description`: فیلتر بر اساس داشتن meta_description (true/false)
- `has_og_image`: فیلتر بر اساس داشتن og_image (true/false)
- `has_canonical_url`: فیلتر بر اساس داشتن canonical_url (true/false)
- `has_main_image`: فیلتر بر اساس داشتن main image (true/false)
- `media_count`: تعداد دقیق media files
- `media_count_gte`: حداقل تعداد media files
- `ordering`: مرتب‌سازی (created_at, updated_at, title, status)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Portfolio by ID (Admin)
**GET** `http://localhost:8000/api/admin/portfolio/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Portfolio
**POST** `http://localhost:8000/api/admin/portfolio/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: multipart/form-data
```

**Body (Form Data در Postman):**

در Postman:
1. تب **Body** را انتخاب کنید
2. **form-data** را انتخاب کنید
3. فیلدها را به صورت زیر اضافه کنید:

| Key | Type | Value |
|-----|------|-------|
| title | Text | عنوان پورتفولیو |
| slug | Text | portfolio-slug |
| short_description | Text | توضیحات کوتاه |
| description | Text | توضیحات کامل (HTML مجاز) |
| status | Text | `draft` یا `published` یا `archived` |
| is_featured | Text | `true` یا `false` |
| is_public | Text | `true` یا `false` |
| meta_title | Text | عنوان SEO (اختیاری) |
| meta_description | Text | توضیحات SEO (اختیاری) |
| og_title | Text | عنوان OG (اختیاری) |
| og_description | Text | توضیحات OG (اختیاری) |
| canonical_url | Text | لینک canonical (اختیاری) |
| robots_meta | Text | `index, follow` یا `noindex, nofollow` (اختیاری) |
| categories_ids | Text | `[1, 2]` یا `1,2` (JSON array یا comma-separated) |
| tags_ids | Text | `[1, 2]` یا `1,2` (JSON array یا comma-separated) |
| options_ids | Text | `[1, 2]` یا `1,2` (JSON array یا comma-separated) - فقط برای Portfolio |
| media_files | File | (انتخاب فایل - می‌توانید چند فایل انتخاب کنید) |

**مثال کامل در Postman:**

برای آپلود فایل:
- Key: `media_files` (نوع: File)
- Value: فایل را انتخاب کنید (می‌توانید چند فایل انتخاب کنید)

برای categories_ids:
- Key: `categories_ids` (نوع: Text)
- Value: `[1, 2, 3]` یا `1,2,3`

**نکات مهم:**
- می‌توانید همزمان `media_files` (آپلود فایل جدید) و `media_ids` (استفاده از فایل موجود) استفاده کنید
- حداکثر تعداد media: طبق تنظیمات سیستم (معمولاً 10)
- اگر `meta_title` و `meta_description` ندهید، به صورت خودکار از `title` و `short_description` ساخته می‌شود
- `options_ids` فقط برای Portfolio است و در Blog وجود ندارد

---

#### 4. Update Portfolio
**PUT/PATCH** `http://localhost:8000/api/admin/portfolio/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "عنوان جدید",
  "slug": "new-slug",
  "short_description": "توضیحات کوتاه جدید",
  "description": "توضیحات کامل جدید",
  "status": "published",
  "is_featured": true,
  "is_public": true,
  "is_active": true,
  "meta_title": "عنوان SEO جدید",
  "meta_description": "توضیحات SEO جدید",
  "og_title": "عنوان OG جدید",
  "og_description": "توضیحات OG جدید",
  "og_image": 123,
  "canonical_url": "https://example.com/portfolio",
  "robots_meta": "index, follow",
  "categories_ids": [1, 2],
  "tags_ids": [1, 2],
  "options_ids": [1, 2],
  "media_ids": [10, 11, 12],
  "main_image_id": 10,
  "media_covers": {
    "10": 20,
    "11": null
  }
}
```

---

#### 5. Delete Portfolio
**DELETE** `http://localhost:8000/api/admin/portfolio/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 6. Export Portfolios
**GET** `http://localhost:8000/api/admin/portfolio/export/`

**Query Parameters:**
- `format`: فرمت خروجی (xlsx, csv)
- (همه فیلترهای لیست قابل استفاده است)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Public Portfolio APIs

#### 1. List Portfolios (Public)
**GET** `http://localhost:8000/api/portfolio/`

**Query Parameters:**
- `search`: جستجو در title, short_description, description, categories__name, tags__name
- `category`: فیلتر بر اساس category slug
- `tag`: فیلتر بر اساس tag slug
- `is_featured`: فیلتر بر اساس featured (true/false)
- `ordering`: مرتب‌سازی (title, created_at, is_featured)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Get Portfolio by Slug (Public)
**GET** `http://localhost:8000/api/portfolio/{slug}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

### Admin Portfolio Category APIs

#### 1. List Categories (Admin)
**GET** `http://localhost:8000/api/admin/portfolio-category/`

**Query Parameters:**
- `search`: جستجو در name, description
- `ordering`: مرتب‌سازی (path, created_at, name)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Category by ID (Admin)
**GET** `http://localhost:8000/api/admin/portfolio-category/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Category
**POST** `http://localhost:8000/api/admin/portfolio-category/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام دسته‌بندی",
  "slug": "category-slug",
  "description": "توضیحات",
  "parent": null,
  "sort_order": 1,
  "is_active": true
}
```

---

#### 4. Update Category
**PUT/PATCH** `http://localhost:8000/api/admin/portfolio-category/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام جدید",
  "slug": "new-slug",
  "description": "توضیحات جدید",
  "parent": 1,
  "sort_order": 2,
  "is_active": true
}
```

---

#### 5. Delete Category
**DELETE** `http://localhost:8000/api/admin/portfolio-category/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Public Portfolio Category APIs

#### 1. List Categories (Public)
**GET** `http://localhost:8000/api/portfolio-category/`

**Query Parameters:**
- `search`: جستجو در name, description
- `ordering`: مرتب‌سازی (name, sort_order, portfolio_count)

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Get Category by Slug (Public)
**GET** `http://localhost:8000/api/portfolio-category/{slug}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

### Admin Portfolio Tag APIs

#### 1. List Tags (Admin)
**GET** `http://localhost:8000/api/admin/portfolio-tag/`

**Query Parameters:**
- `search`: جستجو در name, description
- `ordering`: مرتب‌سازی (created_at, updated_at, name)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Tag by ID (Admin)
**GET** `http://localhost:8000/api/admin/portfolio-tag/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Tag
**POST** `http://localhost:8000/api/admin/portfolio-tag/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام تگ",
  "slug": "tag-slug",
  "description": "توضیحات",
  "is_active": true
}
```

---

#### 4. Update Tag
**PUT/PATCH** `http://localhost:8000/api/admin/portfolio-tag/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام جدید",
  "slug": "new-slug",
  "description": "توضیحات جدید",
  "is_active": true
}
```

---

#### 5. Delete Tag
**DELETE** `http://localhost:8000/api/admin/portfolio-tag/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Public Portfolio Tag APIs

#### 1. List Tags (Public)
**GET** `http://localhost:8000/api/portfolio-tag/`

**Query Parameters:**
- `search`: جستجو در name, description
- `ordering`: مرتب‌سازی (name, portfolio_count)

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Get Tag by Slug (Public)
**GET** `http://localhost:8000/api/portfolio-tag/{slug}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

### Admin Portfolio Option APIs

#### 1. List Options (Admin)
**GET** `http://localhost:8000/api/admin/portfolio-option/`

**Query Parameters:**
- `search`: جستجو در name, slug, description
- `ordering`: مرتب‌سازی (created_at, updated_at, name)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Option by ID (Admin)
**GET** `http://localhost:8000/api/admin/portfolio-option/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Option
**POST** `http://localhost:8000/api/admin/portfolio-option/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام آپشن",
  "slug": "option-slug",
  "description": "توضیحات",
  "is_active": true
}
```

---

#### 4. Update Option
**PUT/PATCH** `http://localhost:8000/api/admin/portfolio-option/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام جدید",
  "slug": "new-slug",
  "description": "توضیحات جدید",
  "is_active": true
}
```

---

#### 5. Delete Option
**DELETE** `http://localhost:8000/api/admin/portfolio-option/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Public Portfolio Option APIs

#### 1. List Options (Public)
**GET** `http://localhost:8000/api/portfolio-option/`

**Query Parameters:**
- `search`: جستجو در name, slug, description
- `ordering`: مرتب‌سازی (name, slug, portfolio_count)

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Get Option by Slug (Public)
**GET** `http://localhost:8000/api/portfolio-option/{slug}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

## Media APIs

### Admin Media APIs

#### 1. List Media (Admin)
**GET** `http://localhost:8000/api/admin/media/`

**Query Parameters:**
- `search`: جستجو در title
- `title`: جستجو در title (مشابه search)
- `file_type`: فیلتر بر اساس نوع فایل (`all`, `image`, `video`, `audio`, `document`, `pdf`)
- `is_active`: فیلتر بر اساس active (`true`/`false`)
- `date_from`: فیلتر از تاریخ (YYYY-MM-DD)
- `date_to`: فیلتر تا تاریخ (YYYY-MM-DD)
- `ordering`: مرتب‌سازی (`created_at`, `-created_at`)
- `limit`: تعداد نتایج (پیش‌فرض: 20)
- `offset`: شروع از آیتم چندم (پیش‌فرض: 0)

**مثال:**
```
GET http://localhost:8000/api/admin/media/?file_type=image&is_active=true&search=logo&ordering=-created_at&limit=10&offset=0
```

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Media by ID (Admin)
**GET** `http://localhost:8000/api/admin/media/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Upload Media
**POST** `http://localhost:8000/api/admin/media/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: multipart/form-data
```

**Body (Form Data در Postman):**

در Postman:
1. تب **Body** را انتخاب کنید
2. **form-data** را انتخاب کنید
3. فیلدها را به صورت زیر اضافه کنید:

| Key | Type | Value | توضیحات |
|-----|------|-------|---------|
| file | File | (انتخاب فایل) | **الزامی** - فایل برای آپلود |
| title | Text | عنوان فایل | **الزامی** |
| alt_text | Text | متن جایگزین | برای تصاویر (اختیاری) |
| description | Text | توضیحات | (اختیاری) |
| is_active | Text | `true` یا `false` | پیش‌فرض: `true` |
| context_type | Text | `portfolio` یا `blog` یا `media_library` | (اختیاری) |
| context_action | Text | `create` یا `update` | (اختیاری) |

**مثال کامل:**
- Key: `file` → Type: **File** → Value: انتخاب فایل تصویر
- Key: `title` → Type: **Text** → Value: `لوگوی شرکت`
- Key: `alt_text` → Type: **Text** → Value: `لوگوی اصلی شرکت`
- Key: `description` → Type: **Text** → Value: `لوگوی استفاده شده در هدر سایت`
- Key: `is_active` → Type: **Text** → Value: `true`

**نکات مهم:**
- فرمت‌های مجاز تصویر: jpg, jpeg, png, gif, webp
- فرمت‌های مجاز ویدیو: mp4, avi, mov, webm
- فرمت‌های مجاز صدا: mp3, wav, ogg
- فرمت‌های مجاز سند: pdf, doc, docx, xls, xlsx
- حداکثر حجم فایل: طبق تنظیمات سیستم

---

#### 4. Update Media
**PUT/PATCH** `http://localhost:8000/api/admin/media/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "عنوان جدید",
  "alt_text": "متن جایگزین جدید",
  "description": "توضیحات جدید",
  "is_active": true
}
```

---

#### 5. Delete Media
**DELETE** `http://localhost:8000/api/admin/media/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 6. Bulk Delete Media
**POST** `http://localhost:8000/api/admin/media/bulk-delete`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "ids": [1, 2, 3]
}
```

---

### Public Media APIs

#### 1. List Media (Public)
**GET** `http://localhost:8000/api/media/`

**Query Parameters:**
- `search`: جستجو در title
- `is_active`: فیلتر بر اساس active (true/false)
- `ordering`: مرتب‌سازی (created_at)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Get Media by ID (Public)
**GET** `http://localhost:8000/api/media/{id}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

## AI APIs

### AI Provider APIs (SuperAdmin Only)

#### 1. List AI Providers
**GET** `http://localhost:8000/api/admin/ai-providers/`

**Query Parameters:**
- `search`: جستجو در name, display_name, description
- `ordering`: مرتب‌سازی (name, sort_order, total_requests, created_at)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get AI Provider by ID
**GET** `http://localhost:8000/api/admin/ai-providers/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create AI Provider
**POST** `http://localhost:8000/api/admin/ai-providers/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "openai",
  "display_name": "OpenAI",
  "description": "OpenAI Provider",
  "is_active": true,
  "sort_order": 1
}
```

---

#### 4. Update AI Provider
**PUT/PATCH** `http://localhost:8000/api/admin/ai-providers/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

---

#### 5. Delete AI Provider
**DELETE** `http://localhost:8000/api/admin/ai-providers/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### AI Model APIs

#### 1. List AI Models
**GET** `http://localhost:8000/api/admin/ai-models/`

**Query Parameters:**
- `search`: جستجو در name, display_name, description, model_id
- `provider`: فیلتر بر اساس provider ID
- `ordering`: مرتب‌سازی (name, sort_order, total_requests, created_at)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get AI Model by ID
**GET** `http://localhost:8000/api/admin/ai-models/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create AI Model
**POST** `http://localhost:8000/api/admin/ai-models/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "provider": 1,
  "name": "gpt-4",
  "display_name": "GPT-4",
  "model_id": "gpt-4",
  "description": "GPT-4 Model",
  "is_active": true,
  "sort_order": 1
}
```

---

#### 4. Update AI Model
**PUT/PATCH** `http://localhost:8000/api/admin/ai-models/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

---

#### 5. Delete AI Model
**DELETE** `http://localhost:8000/api/admin/ai-models/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### AI Settings APIs

#### 1. List AI Settings
**GET** `http://localhost:8000/api/admin/ai-settings/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get AI Setting by ID
**GET** `http://localhost:8000/api/admin/ai-settings/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create AI Setting
**POST** `http://localhost:8000/api/admin/ai-settings/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "provider": 1,
  "api_key": "your-api-key",
  "is_active": true
}
```

---

#### 4. Update AI Setting
**PUT/PATCH** `http://localhost:8000/api/admin/ai-settings/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "api_key": "new-api-key",
  "is_active": true
}
```

---

#### 5. Delete AI Setting
**DELETE** `http://localhost:8000/api/admin/ai-settings/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### AI Generation APIs (Unified)

#### 1. Generate Text
**POST** `http://localhost:8000/api/admin/ai-generate/text/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "model_id": 1,
  "prompt": "Write a blog post about...",
  "max_tokens": 1000,
  "temperature": 0.7,
  "tone": "professional"
}
```

---

#### 2. Generate Image
**POST** `http://localhost:8000/api/admin/ai-generate/image/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "model_id": 5,
  "prompt": "A beautiful landscape",
  "size": "1024x1024",
  "quality": "hd",
  "save_to_media": true,
  "title": "Generated Image",
  "alt_text": "A beautiful landscape"
}
```

---

#### 3. Generate Audio
**POST** `http://localhost:8000/api/admin/ai-generate/audio/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**نکته:** این endpoint هنوز پیاده‌سازی نشده است.

---

#### 4. Get Available Models
**GET** `http://localhost:8000/api/admin/ai-generate/models/`

**Query Parameters:**
- `capability`: فیلتر بر اساس قابلیت (`chat`, `image`, `audio`, `code`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 5. Get Available Providers
**GET** `http://localhost:8000/api/admin/ai-generate/providers/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### AI Content Generation APIs

#### 1. Generate Content
**POST** `http://localhost:8000/api/admin/ai-content/generate/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "topic": "موضوع محتوا",
  "provider_name": "gemini",
  "word_count": 500,
  "tone": "professional",
  "keywords": ["کلمه1", "کلمه2"],
  "destination": "direct",
  "destination_data": {}
}
```

**فیلدها:**
- `topic`: **الزامی** - موضوع یا عنوان محتوا (حداکثر 500 کاراکتر)
- `provider_name`: **اختیاری** - نام provider (`gemini`, `openai`, `deepseek`, `openrouter`, `groq`, `huggingface`، پیش‌فرض: `gemini`)
- `word_count`: **اختیاری** - تعداد کلمات (100 تا 2000، پیش‌فرض: 500)
- `tone`: **اختیاری** - سبک نوشتاری (`professional`, `casual`, `formal`, `friendly`, `technical`، پیش‌فرض: `professional`)
- `keywords`: **اختیاری** - لیست کلمات کلیدی برای SEO
- `destination`: **اختیاری** - مقصد ذخیره‌سازی (`direct`, `blog`, `portfolio`، پیش‌فرض: `direct`)
- `destination_data`: **اختیاری** - داده‌های اضافی برای مقصد (مثل دسته‌بندی، تگ، وضعیت)

---

#### 2. Get Capabilities
**GET** `http://localhost:8000/api/admin/ai-content/capabilities/`

**Query Parameters:**
- `provider_name`: فیلتر بر اساس provider (اختیاری)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Get Available Providers
**GET** `http://localhost:8000/api/admin/ai-content/available-providers/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 4. Get OpenRouter Models
**GET** `http://localhost:8000/api/admin/ai-content/openrouter-models/`

**Query Parameters:**
- `use_cache`: استفاده از کش (`true`/`false`، پیش‌فرض: `true`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 5. Get Groq Models
**GET** `http://localhost:8000/api/admin/ai-content/groq-models/`

**Query Parameters:**
- `use_cache`: استفاده از کش (`true`/`false`، پیش‌فرض: `true`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 6. Clear OpenRouter Cache
**POST** `http://localhost:8000/api/admin/ai-content/clear-openrouter-cache/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

---

### AI Image Provider APIs (SuperAdmin Only)

#### 1. List Image Providers
**GET** `http://localhost:8000/api/admin/ai-image-providers/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Image Provider by ID
**GET** `http://localhost:8000/api/admin/ai-image-providers/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Image Provider
**POST** `http://localhost:8000/api/admin/ai-image-providers/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

---

#### 4. Update Image Provider
**PUT/PATCH** `http://localhost:8000/api/admin/ai-image-providers/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

---

#### 5. Delete Image Provider
**DELETE** `http://localhost:8000/api/admin/ai-image-providers/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### AI Image Generation APIs

#### 1. Generate Image
**POST** `http://localhost:8000/api/admin/ai-images/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "provider_name": "openai",
  "prompt": "A beautiful landscape with mountains",
  "size": "1024x1024",
  "quality": "standard",
  "n": 1,
  "save_to_media": true,
  "title": "Generated Landscape",
  "alt_text": "A beautiful landscape with mountains"
}
```

**فیلدها:**
- `provider_name`: **الزامی** - نام provider (مثل `openai`, `dalle`, `flux`)
- `prompt`: **الزامی** - توضیحات تصویر
- `size`: **اختیاری** - اندازه تصویر (`1024x1024`, `512x512`, `256x256`، پیش‌فرض: `1024x1024`)
- `quality`: **اختیاری** - کیفیت تصویر (`standard`, `hd`)
- `n`: **اختیاری** - تعداد تصاویر (پیش‌فرض: 1)
- `save_to_media`: **اختیاری** - ذخیره در media library (پیش‌فرض: true)
- `title`: **اختیاری** - عنوان برای media
- `alt_text`: **اختیاری** - متن جایگزین برای media

---

#### 2. Get Capabilities
**GET** `http://localhost:8000/api/admin/ai-image-providers/capabilities/`

**Query Parameters:**
- `provider_slug`: فیلتر بر اساس provider slug (اختیاری)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Get Available Providers
**GET** `http://localhost:8000/api/admin/ai-image-providers/available/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 4. Get OpenRouter Models
**GET** `http://localhost:8000/api/admin/ai-image-providers/openrouter-models/`

**Query Parameters:**
- `use_cache`: استفاده از کش (`true`/`false`، پیش‌فرض: `true`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 5. Get HuggingFace Models
**GET** `http://localhost:8000/api/admin/ai-image-providers/huggingface-models/`

**Query Parameters:**
- `use_cache`: استفاده از کش (`true`/`false`، پیش‌فرض: `true`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### AI Chat APIs

#### 1. Send Message
**POST** `http://localhost:8000/api/admin/ai-chat/send-message/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "message": "سلام، چطور می‌تونم کمکتون کنم؟",
  "provider_name": "deepseek",
  "conversation_history": [
    {
      "role": "user",
      "content": "پیام قبلی کاربر"
    },
    {
      "role": "assistant",
      "content": "پاسخ قبلی AI"
    }
  ],
  "system_message": "شما یک دستیار مفید هستید",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**فیلدها:**
- `message`: **الزامی** - پیام کاربر (حداکثر 5000 کاراکتر)
- `provider_name`: **اختیاری** - نام provider (`gemini`, `openai`, `deepseek`, `openrouter`, `groq`, `huggingface`، پیش‌فرض: `deepseek`)
- `conversation_history`: **اختیاری** - تاریخچه مکالمه قبلی برای ادامه مکالمه
- `system_message`: **اختیاری** - پیام سیستم برای تنظیم شخصیت AI (حداکثر 1000 کاراکتر)
- `temperature`: **اختیاری** - دما برای تولید پاسخ (0.0 تا 2.0، پیش‌فرض: 0.7)
- `max_tokens`: **اختیاری** - حداکثر تعداد توکن در پاسخ (100 تا 4096، پیش‌فرض: 2048)

---

#### 2. Get Capabilities
**GET** `http://localhost:8000/api/admin/ai-chat/capabilities/`

**Query Parameters:**
- `provider_name`: فیلتر بر اساس provider (اختیاری)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Get Available Providers
**GET** `http://localhost:8000/api/admin/ai-chat/available-providers/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 4. Get OpenRouter Models
**GET** `http://localhost:8000/api/admin/ai-chat/openrouter-models/`

**Query Parameters:**
- `provider`: فیلتر بر اساس provider (مثل `google`, `openai`)
- `use_cache`: استفاده از کش (`true`/`false`، پیش‌فرض: `true`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 5. Get Groq Models
**GET** `http://localhost:8000/api/admin/ai-chat/groq-models/`

**Query Parameters:**
- `use_cache`: استفاده از کش (`true`/`false`، پیش‌فرض: `true`)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 6. Clear OpenRouter Cache
**POST** `http://localhost:8000/api/admin/ai-chat/clear-openrouter-cache/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "provider": "google"
}
```

**نکته:** اگر `provider` ندهید، تمام کش پاک می‌شود.

---

### AI Audio Generation APIs

#### 1. Generate Audio
**POST** `http://localhost:8000/api/admin/ai-audio/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "provider_name": "openai",
  "text": "Text to convert to speech",
  "voice": "alloy",
  "model": "tts-1",
  "speed": 1.0
}
```

**فیلدها:**
- `provider_name`: **الزامی** - نام provider (مثل `openai`)
- `text`: **الزامی** - متن برای تبدیل به صدا
- `voice`: **اختیاری** - نوع صدا (`alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`)
- `model`: **اختیاری** - مدل TTS (`tts-1`, `tts-1-hd`)
- `speed`: **اختیاری** - سرعت پخش (0.25 تا 4.0، پیش‌فرض: 1.0)

---

## Chatbot APIs

### Admin FAQ APIs

#### 1. List FAQs
**GET** `http://localhost:8000/api/admin/chatbot/faq/`

**Query Parameters:**
- `search`: جستجو در question, answer
- `ordering`: مرتب‌سازی
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get FAQ by ID
**GET** `http://localhost:8000/api/admin/chatbot/faq/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create FAQ
**POST** `http://localhost:8000/api/admin/chatbot/faq/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "question": "سوال متداول",
  "answer": "پاسخ کامل به سوال متداول",
  "keywords": "کلمه کلیدی 1, کلمه کلیدی 2, کلمه کلیدی 3",
  "order": 1,
  "is_active": true
}
```

**فیلدها:**
- `question`: **الزامی** - متن سوال (حداکثر 500 کاراکتر)
- `answer`: **الزامی** - متن پاسخ (بدون محدودیت)
- `keywords`: **اختیاری** - کلمات کلیدی برای جستجو (comma-separated، حداکثر 500 کاراکتر)
- `order`: **اختیاری** - ترتیب نمایش (عدد صحیح، پیش‌فرض: 0)
- `is_active`: **اختیاری** - وضعیت فعال (پیش‌فرض: true)

---

#### 4. Update FAQ
**PUT/PATCH** `http://localhost:8000/api/admin/chatbot/faq/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "question": "سوال جدید",
  "answer": "پاسخ جدید",
  "category": "عمومی",
  "is_active": true,
  "order": 1
}
```

---

#### 5. Delete FAQ
**DELETE** `http://localhost:8000/api/admin/chatbot/faq/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Admin Chatbot Settings APIs

#### 1. Get Chatbot Settings
**GET** `http://localhost:8000/api/admin/chatbot/settings/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Update Chatbot Settings
**PUT/PATCH** `http://localhost:8000/api/admin/chatbot/settings/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "is_active": true,
  "welcome_message": "سلام! چطور می‌تونم کمکتون کنم؟",
  "fallback_message": "متأسفانه متوجه نشدم. لطفاً سوال خود را به شکل دیگری بپرسید.",
  "rate_limit_per_minute": 10
}
```

**فیلدها:**
- `is_active`: **اختیاری** - فعال/غیرفعال بودن چت‌بات (پیش‌فرض: true)
- `welcome_message`: **اختیاری** - پیام خوش‌آمدگویی (حداکثر 500 کاراکتر، پیش‌فرض: "سلام! چطور می‌تونم کمکتون کنم؟")
- `fallback_message`: **اختیاری** - پیام در صورت عدم یافتن پاسخ (حداکثر 500 کاراکتر)
- `rate_limit_per_minute`: **اختیاری** - محدودیت درخواست در دقیقه (1 تا 100، پیش‌فرض: 10)

---

### Public Chatbot APIs

#### 1. Send Message to Chatbot
**POST** `http://localhost:8000/api/public/chatbot/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "message": "سلام",
  "conversation_id": null
}
```

**Response:**
```json
{
  "response": "سلام، چطور می‌تونم کمکتون کنم؟",
  "conversation_id": "uuid-string"
}
```

---

## Ticket APIs

### Admin Ticket APIs

#### 1. List Tickets
**GET** `http://localhost:8000/api/admin/tickets/`

**Query Parameters:**
- `search`: جستجو در subject, description
- `status`: فیلتر بر اساس وضعیت (`open`, `in_progress`, `resolved`, `closed`)
- `priority`: فیلتر بر اساس اولویت (`low`, `medium`, `high`, `urgent`)
- `assigned_to_me`: فیلتر تیکت‌های اختصاص داده شده به من (`true`/`false`)
- `unassigned`: فیلتر تیکت‌های بدون اختصاص (`true`/`false`)
- `ordering`: مرتب‌سازی (`-created_at`, `created_at`, `-updated_at`)
- `limit`: تعداد نتایج (پیش‌فرض: 20)
- `offset`: شروع از آیتم چندم (پیش‌فرض: 0)

**مثال:**
```
GET http://localhost:8000/api/admin/tickets/?status=open&priority=high&assigned_to_me=true&ordering=-created_at
```

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Ticket by ID
**GET** `http://localhost:8000/api/admin/tickets/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Ticket
**POST** `http://localhost:8000/api/admin/tickets/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "subject": "موضوع تیکت",
  "description": "توضیحات کامل تیکت",
  "priority": "high",
  "status": "open",
  "user": 1,
  "assigned_admin": 2
}
```

**فیلدها:**
- `subject`: **الزامی** - موضوع تیکت
- `description`: **الزامی** - توضیحات کامل تیکت
- `priority`: **اختیاری** - اولویت (`low`, `medium`, `high`, `urgent`، پیش‌فرض: `medium`)
- `status`: **اختیاری** - وضعیت (`open`, `in_progress`, `resolved`, `closed`، پیش‌فرض: `open`)
- `user`: **اختیاری** - ID کاربر (اگر admin تیکت را برای کاربر ایجاد می‌کند)
- `assigned_admin`: **اختیاری** - ID ادمین اختصاص داده شده

---

#### 4. Update Ticket
**PUT/PATCH** `http://localhost:8000/api/admin/tickets/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "closed",
  "priority": "low"
}
```

---

#### 5. Delete Ticket
**DELETE** `http://localhost:8000/api/admin/tickets/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 6. Assign Ticket to Admin
**POST** `http://localhost:8000/api/admin/tickets/{id}/assign/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "admin_id": 2
}
```

**یا برای حذف اختصاص:**
```json
{}
```

---

#### 7. Update Ticket Status
**POST** `http://localhost:8000/api/admin/tickets/{id}/update_status/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "in_progress"
}
```

**مقادیر مجاز status:**
- `open`
- `in_progress`
- `resolved`
- `closed`

---

### Admin Ticket Message APIs

#### 1. List Ticket Messages
**GET** `http://localhost:8000/api/admin/ticket-messages/`

**Query Parameters:**
- `ticket`: فیلتر بر اساس ticket ID
- `ordering`: مرتب‌سازی
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Ticket Message by ID
**GET** `http://localhost:8000/api/admin/ticket-messages/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Ticket Message
**POST** `http://localhost:8000/api/admin/ticket-messages/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "ticket": 1,
  "message": "پیام پاسخ",
  "is_internal": false
}
```

---

#### 4. Update Ticket Message
**PUT/PATCH** `http://localhost:8000/api/admin/ticket-messages/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

---

#### 5. Delete Ticket Message
**DELETE** `http://localhost:8000/api/admin/ticket-messages/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Public Ticket APIs

#### 1. List User Tickets
**GET** `http://localhost:8000/api/public/tickets/`

**Headers:**
```
Authorization: Bearer {user_access_token}
```

---

#### 2. Get Ticket by ID
**GET** `http://localhost:8000/api/public/tickets/{id}/`

**Headers:**
```
Authorization: Bearer {user_access_token}
```

---

#### 3. Create Ticket
**POST** `http://localhost:8000/api/public/tickets/`

**Headers:**
```
Authorization: Bearer {user_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "subject": "موضوع تیکت",
  "description": "توضیحات تیکت",
  "priority": "medium"
}
```

---

#### 4. Add Message to Ticket
**POST** `http://localhost:8000/api/public/tickets/{id}/messages/`

**Headers:**
```
Authorization: Bearer {user_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "message": "پیام جدید"
}
```

---

## Email APIs

### Email Message APIs

#### 1. List Email Messages
**GET** `http://localhost:8000/api/email/messages/`

**Query Parameters:**
- `search`: جستجو در name, email, subject, message, phone
- `status`: فیلتر بر اساس وضعیت
- `ordering`: مرتب‌سازی (created_at, updated_at, status)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Email Message by ID
**GET** `http://localhost:8000/api/email/messages/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Email Message
**POST** `http://localhost:8000/api/email/messages/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "name": "نام فرستنده",
  "email": "sender@example.com",
  "phone": "09123456789",
  "subject": "موضوع",
  "message": "پیام"
}
```

---

#### 4. Update Email Message
**PUT/PATCH** `http://localhost:8000/api/email/messages/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "read"
}
```

---

#### 5. Delete Email Message
**DELETE** `http://localhost:8000/api/email/messages/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

## Settings APIs

### General Settings APIs

#### 1. Get General Settings
**GET** `http://localhost:8000/api/settings/general/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Update General Settings
**PUT/PATCH** `http://localhost:8000/api/settings/general/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "site_name": "نام سایت",
  "site_description": "توضیحات سایت",
  "logo": 123
}
```

---

### Contact Phone APIs

#### 1. List Contact Phones
**GET** `http://localhost:8000/api/settings/phones/`

**Query Parameters:**
- `search`: جستجو در phone_number, label
- `ordering`: مرتب‌سازی (order, created_at)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Contact Phone by ID
**GET** `http://localhost:8000/api/settings/phones/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Contact Phone
**POST** `http://localhost:8000/api/settings/phones/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "phone_number": "02112345678",
  "label": "دفتر مرکزی",
  "order": 1,
  "is_active": true
}
```

---

#### 4. Update Contact Phone
**PUT/PATCH** `http://localhost:8000/api/settings/phones/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "phone_number": "02112345679",
  "label": "دفتر جدید",
  "order": 2,
  "is_active": true
}
```

---

#### 5. Delete Contact Phone
**DELETE** `http://localhost:8000/api/settings/phones/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Contact Mobile APIs

#### 1. List Contact Mobiles
**GET** `http://localhost:8000/api/settings/mobiles/`

**Query Parameters:**
- `search`: جستجو در mobile_number, label
- `ordering`: مرتب‌سازی (order, created_at)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Contact Mobile by ID
**GET** `http://localhost:8000/api/settings/mobiles/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Contact Mobile
**POST** `http://localhost:8000/api/settings/mobiles/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "mobile_number": "09123456789",
  "label": "موبایل پشتیبانی",
  "order": 1,
  "is_active": true
}
```

---

#### 4. Update Contact Mobile
**PUT/PATCH** `http://localhost:8000/api/settings/mobiles/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "mobile_number": "09123456790",
  "label": "موبایل جدید",
  "order": 2,
  "is_active": true
}
```

---

#### 5. Delete Contact Mobile
**DELETE** `http://localhost:8000/api/settings/mobiles/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Contact Email APIs

#### 1. List Contact Emails
**GET** `http://localhost:8000/api/settings/emails/`

**Query Parameters:**
- `search`: جستجو در email, label
- `ordering`: مرتب‌سازی (order, created_at)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Contact Email by ID
**GET** `http://localhost:8000/api/settings/emails/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Contact Email
**POST** `http://localhost:8000/api/settings/emails/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "info@example.com",
  "label": "ایمیل عمومی",
  "order": 1,
  "is_active": true
}
```

---

#### 4. Update Contact Email
**PUT/PATCH** `http://localhost:8000/api/settings/emails/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "new@example.com",
  "label": "ایمیل جدید",
  "order": 2,
  "is_active": true
}
```

---

#### 5. Delete Contact Email
**DELETE** `http://localhost:8000/api/settings/emails/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Social Media APIs

#### 1. List Social Media
**GET** `http://localhost:8000/api/settings/social-media/`

**Query Parameters:**
- `search`: جستجو در name, url
- `ordering`: مرتب‌سازی (order, created_at)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Social Media by ID
**GET** `http://localhost:8000/api/settings/social-media/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Social Media
**POST** `http://localhost:8000/api/settings/social-media/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "instagram",
  "url": "https://instagram.com/example",
  "icon": "instagram",
  "order": 1,
  "is_active": true
}
```

---

#### 4. Update Social Media
**PUT/PATCH** `http://localhost:8000/api/settings/social-media/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "telegram",
  "url": "https://t.me/example",
  "icon": "telegram",
  "order": 2,
  "is_active": true
}
```

---

#### 5. Delete Social Media
**DELETE** `http://localhost:8000/api/settings/social-media/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

## Page APIs

### About Page APIs

#### 1. Get About Page
**GET** `http://localhost:8000/api/pages/about/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Update About Page
**PUT/PATCH** `http://localhost:8000/api/pages/about/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "درباره ما",
  "content": "محتوای صفحه درباره ما",
  "is_active": true
}
```

---

### Terms Page APIs

#### 1. Get Terms Page
**GET** `http://localhost:8000/api/pages/terms/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 2. Update Terms Page
**PUT/PATCH** `http://localhost:8000/api/pages/terms/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "قوانین و مقررات",
  "content": "محتوای صفحه قوانین",
  "is_active": true
}
```

---

## Form APIs

### Contact Form Field APIs

#### 1. List Form Fields
**GET** `http://localhost:8000/api/form/fields/`

**Query Parameters:**
- `search`: جستجو در field_key, label, placeholder
- `is_active`: فیلتر بر اساس active (true/false)
- `field_type`: فیلتر بر اساس نوع فیلد
- `required`: فیلتر بر اساس required (true/false)
- `ordering`: مرتب‌سازی (order, created_at, field_key)
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
(برای لیست عمومی - بدون نیاز به احراز هویت)
Authorization: Bearer {admin_access_token} (برای مدیریت)
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Form Field by ID
**GET** `http://localhost:8000/api/form/fields/{id}/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

---

#### 3. Create Form Field
**POST** `http://localhost:8000/api/form/fields/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "field_key": "name",
  "field_type": "text",
  "label": "نام",
  "placeholder": "نام خود را وارد کنید",
  "required": true,
  "platforms": ["website", "mobile_app"],
  "options": [],
  "validation_rules": {
    "min_length": 2,
    "max_length": 50
  },
  "order": 1,
  "is_active": true
}
```

**فیلدها:**
- `field_key`: **الزامی** - کلید یکتای فیلد (حداقل 2 کاراکتر، باید unique باشد)
- `field_type`: **الزامی** - نوع فیلد (`text`, `email`, `phone`, `textarea`, `select`, `checkbox`, `radio`, `number`, `date`, `url`)
- `label`: **الزامی** - برچسب فارسی فیلد (حداکثر 200 کاراکتر)
- `placeholder`: **اختیاری** - متن راهنما (حداکثر 200 کاراکتر)
- `required`: **اختیاری** - آیا فیلد الزامی است (پیش‌فرض: true)
- `platforms`: **اختیاری** - لیست پلتفرم‌ها (`["website"]`, `["mobile_app"]`, `["website", "mobile_app"]`)
- `options`: **اختیاری** - گزینه‌های فیلد انتخابی (برای select, radio, checkbox)
  ```json
  [
    {"value": "option1", "label": "گزینه 1"},
    {"value": "option2", "label": "گزینه 2"}
  ]
  ```
- `validation_rules`: **اختیاری** - قوانین اعتبارسنجی
  ```json
  {
    "min_length": 3,
    "max_length": 100,
    "pattern": "^[a-zA-Z]+$"
  }
  ```
- `order`: **اختیاری** - ترتیب نمایش (عدد صحیح، پیش‌فرض: 0)
- `is_active`: **اختیاری** - وضعیت فعال (پیش‌فرض: true)

---

#### 4. Update Form Field
**PUT/PATCH** `http://localhost:8000/api/form/fields/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "label": "نام جدید",
  "placeholder": "placeholder جدید",
  "required": false,
  "order": 2,
  "is_active": true
}
```

---

#### 5. Delete Form Field
**DELETE** `http://localhost:8000/api/form/fields/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

### Contact Form Submission APIs

#### 1. List Form Submissions
**GET** `http://localhost:8000/api/form/submissions/`

**Query Parameters:**
- `search`: جستجو در form data
- `ordering`: مرتب‌سازی
- `limit`: تعداد نتایج
- `offset`: شروع از آیتم چندم

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Form Submission by ID
**GET** `http://localhost:8000/api/form/submissions/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Form Submission
**POST** `http://localhost:8000/api/form/submissions/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "form_data": {
    "name": "نام فرستنده",
    "email": "sender@example.com",
    "message": "پیام"
  }
}
```

---

#### 4. Delete Form Submission
**DELETE** `http://localhost:8000/api/form/submissions/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

## Statistics APIs

### Admin Statistics APIs

#### 1. Get Statistics
**GET** `http://localhost:8000/api/admin/statistics/`

**Query Parameters:**
- `start_date`: تاریخ شروع (YYYY-MM-DD)
- `end_date`: تاریخ پایان (YYYY-MM-DD)
- `type`: نوع آمار (general, blog, portfolio, users, etc.)

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

**Response:**
```json
{
  "total_blogs": 100,
  "total_portfolios": 50,
  "total_users": 200,
  "total_visits": 10000
}
```

---

## Panel APIs

### Admin Panel Settings APIs

#### 1. List Panel Settings
**GET** `http://localhost:8000/api/admin/panel-settings/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 2. Get Panel Setting by ID
**GET** `http://localhost:8000/api/admin/panel-settings/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

#### 3. Create Panel Setting
**POST** `http://localhost:8000/api/admin/panel-settings/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "key": "setting_key",
  "value": "setting_value",
  "description": "توضیحات"
}
```

---

#### 4. Update Panel Setting
**PUT/PATCH** `http://localhost:8000/api/admin/panel-settings/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
Content-Type: application/json
```

**Body:**
```json
{
  "value": "new_value",
  "description": "توضیحات جدید"
}
```

---

#### 5. Delete Panel Setting
**DELETE** `http://localhost:8000/api/admin/panel-settings/{id}/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

---

## Core APIs

### Upload Settings API

#### 1. Get Upload Settings
**GET** `http://localhost:8000/api/core/upload-settings/`

**Headers:**
```
Authorization: Bearer {admin_access_token}
X-CSRFToken: {csrf_token}
```

**Response:**
```json
{
  "max_file_size": 10485760,
  "allowed_image_types": ["jpg", "jpeg", "png", "gif"],
  "allowed_video_types": ["mp4", "avi"],
  "allowed_document_types": ["pdf", "doc", "docx"]
}
```

---

### CSRF Token API

#### 1. Get CSRF Token
**GET** `http://localhost:8000/api/core/csrf-token/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

**Response:**
```json
{
  "message": "CSRF token is available in cookies"
}
```

---

### Captcha APIs

#### 1. Generate Captcha
**GET** `http://localhost:8000/api/core/captcha/generate/`

**Headers:**
```
(بدون نیاز به احراز هویت)
```

**Response:**
```json
{
  "captcha_id": "uuid-string",
  "image": "base64-encoded-image"
}
```

---

#### 2. Verify Captcha
**POST** `http://localhost:8000/api/core/captcha/verify/`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "captcha_id": "uuid-string",
  "answer": "captcha-answer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Captcha verified successfully"
}
```

---

## نکات مهم

### Authentication
- برای Admin APIs باید از `Bearer Token` در header استفاده کنید
- برای Admin APIs باید `X-CSRFToken` را در header قرار دهید
- برای دریافت CSRF token از `/api/core/csrf-token/` استفاده کنید

### Pagination
- تمام لیست‌ها از pagination استفاده می‌کنند
- پیش‌فرض: `limit=20`, `offset=0`
- می‌توانید این مقادیر را در query parameters تغییر دهید

### Filtering & Searching
- از `search` برای جستجوی متنی استفاده کنید
- از فیلترهای خاص هر endpoint استفاده کنید
- می‌توانید چند فیلتر را با هم ترکیب کنید

### File Uploads
- برای آپلود فایل از `multipart/form-data` استفاده کنید
- در Postman از تب "Body" > "form-data" استفاده کنید

### Error Responses
- تمام خطاها به صورت JSON برمی‌گردند
- کدهای وضعیت HTTP استاندارد استفاده می‌شوند:
  - `200`: موفق
  - `201`: ایجاد شد
  - `400`: درخواست نامعتبر
  - `401`: نیاز به احراز هویت
  - `403`: دسترسی غیرمجاز
  - `404`: یافت نشد
  - `500`: خطای سرور

---

## مثال‌های استفاده در Postman

### 1. لاگین Admin و دریافت Token

1. **Request:** `POST http://localhost:8000/api/admin/login/`
2. **Body (JSON):**
   ```json
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```
3. **Response:** Token را از فیلد `access` کپی کنید

### 2. دریافت CSRF Token

1. **Request:** `GET http://localhost:8000/api/core/csrf-token/`
2. **Response:** CSRF token در cookie قرار می‌گیرد

### 3. ایجاد Blog با Token

1. **Request:** `POST http://localhost:8000/api/admin/blog/`
2. **Headers:**
   - `Authorization: Bearer {your_access_token}`
   - `X-CSRFToken: {your_csrf_token}`
3. **Body (form-data):**
   - `title`: عنوان بلاگ
   - `slug`: blog-slug
   - `description`: توضیحات
   - `status`: published
   - `file`: (انتخاب فایل)

### 4. لیست Blogs با فیلتر

1. **Request:** `GET http://localhost:8000/api/admin/blog/?status=published&is_featured=true&search=test&ordering=-created_at&limit=10`
2. **Headers:**
   - `Authorization: Bearer {your_access_token}`
   - `X-CSRFToken: {your_csrf_token}`

---

**پایان مستندات**

