PROPERTY_SUCCESS = {
    "property_list_success": "لیست املاک با موفقیت دریافت شد.",
    "property_created": "ملک با موفقیت ایجاد شد.",
    "property_updated": "ملک با موفقیت به‌روزرسانی شد.",
    "property_deleted": "ملک با موفقیت حذف شد.",
    "property_retrieved": "ملک با موفقیت دریافت شد.",
    "property_status_changed": "وضعیت ملک با موفقیت تغییر کرد.",
    "property_published": "ملک با موفقیت منتشر شد.",
    "property_bulk_deleted": "املاک با موفقیت حذف شدند.",
    "property_bulk_status_updated": "وضعیت املاک با موفقیت به‌روزرسانی شد.",
    "property_media_added": "رسانه با موفقیت به ملک اضافه شد.",
    "property_main_image_set": "تصویر شاخص با موفقیت تنظیم شد.",
    "property_statistics_retrieved": "آمار املاک با موفقیت دریافت شد.",
    "property_seo_generated": "اطلاعات SEO با موفقیت تولید شد.",
    "property_seo_validated": "اطلاعات SEO با موفقیت بررسی شد.",
    "property_seo_report_retrieved": "گزارش SEO با موفقیت دریافت شد.",
    "property_bulk_seo_generated": "SEO املاک با موفقیت تولید شد.",
    "property_media_removed": "رسانه با موفقیت حذف شد.",
    "property_field_options_retrieved": "گزینه‌های فیلد با موفقیت دریافت شدند.",
    "property_deal_finalized": "معامله ملک با موفقیت نهایی شد.",
    "property_geo_results_retrieved": "نتایج جستجوی مکانی با موفقیت دریافت شد.",
    "property_map_data_retrieved": "داده‌های نقشه با موفقیت دریافت شد.",
    "property_geo_engine_status_retrieved": "وضعیت موتور جستجوی مکانی با موفقیت دریافت شد.",
}

PROPERTY_ERRORS = {
    "property_not_found": "ملک یافت نشد.",
    "property_not_authorized": "شما اجازه دسترسی به این ملک را ندارید.",
    "property_invalid_status": "وضعیت نامعتبر است.",
    "property_create_failed": "ایجاد ملک ناموفق بود.",
    "property_update_failed": "به‌روزرسانی ملک ناموفق بود.",
    "property_delete_failed": "حذف ملک ناموفق بود.",
    "property_validation_failed": "خطا در اعتبارسنجی داده‌های ملک. لطفاً فیلدهای الزامی را بررسی کنید.",
    "property_ids_required": "شناسه املاک مورد نیاز است.",
    "properties_not_found": "املاک انتخاب شده یافت نشدند.",
    "media_id_required": "شناسه رسانه مورد نیاز است.",
    "media_image_not_found": "تصویر رسانه یافت نشد.",
    "agent_id_required": "شناسه مشاور مورد نیاز است.",
    "agency_id_required": "شناسه آژانس مورد نیاز است.",
    "property_type_id_required": "شناسه نوع ملک مورد نیاز است.",
    "state_id_required": "شناسه وضعیت ملک مورد نیاز است.",
    "region_id_required": "شناسه محله مورد نیاز است.",
    "city_id_required": "شناسه شهر مورد نیاز است.",
    "media_upload_limit_exceeded": "حداکثر {max_items} رسانه برای آپلود مجاز است. شما {total_items} رسانه ارسال کرده‌اید.",
    "only_one_main_image": "فقط یک تصویر اصلی برای هر ملک مجاز است.",
    "property_export_failed": "خروجی گیری املاک ناموفق بود.",
    "property_export_limit_exceeded": "حد مجاز خروجی گیری تجاوز شده است. لطفاً بعداً تلاش کنید.",
    "property_export_too_large": "حجم خروجی بسیار بزرگ است. لطفاً فیلترهای بیشتری اعمال کنید.",
    "status_finalize_required": "برای ثبت وضعیت فروخته/اجاره‌رفته باید از عملیات «نهایی‌سازی معامله» استفاده شود.",
    "already_finalized": "این ملک قبلاً نهایی شده است.",
    "invalid_finalize_status": "فقط املاک active یا pending قابل نهایی‌سازی هستند.",
    "invalid_media_type": "نوع رسانه نامعتبر است.",
    "property_media_not_found": "رسانه یافت نشد.",
    "media_ids_or_files_required": "حداقل یکی از media_ids یا media_files باید ارسال شود.",
    "geo_coordinates_required": "مختصات جغرافیایی الزامی است.",
    "geo_coordinates_invalid": "مختصات جغرافیایی معتبر نیست.",
    "geo_bbox_coordinates_required": "مختصات محدوده الزامی است.",
    "geo_polygon_min_points": "چندضلعی باید حداقل 3 نقطه داشته باشد.",
    "geo_polygon_invalid": "مختصات چندضلعی معتبر نیست.",
    "property_slug_exists": "این نامک قبلاً استفاده شده است.",
    "property_required_defaults_missing": "ایجاد ملک ناموفق بود: اطلاعات پایه نوع/وضعیت/موقعیت تکمیل نیست.",
    "province_required": "استان الزامی است.",
    "city_required": "شهر الزامی است.",
    "region_city_mismatch": "منطقه انتخاب شده متعلق به این شهر نیست.",
    "bedrooms_range": "تعداد خواب باید بین 0 تا 20 باشد.",
    "bathrooms_range": "تعداد سرویس بهداشتی باید بین 0 تا 20 باشد.",
    "parking_spaces_range": "تعداد پارکینگ باید بین 0 تا 20 باشد.",
    "document_type_invalid": "نوع سند نامعتبر است. مقادیر مجاز: {allowed_values}",
    "extra_space_type_invalid": "نوع فضا نامعتبر: {invalid_value}. مقادیر مجاز: {allowed_values}",
    "extra_construction_status_invalid": "وضعیت ساخت نامعتبر: {invalid_value}. مقادیر مجاز: {allowed_values}",
    "extra_property_condition_invalid": "وضعیت ملک نامعتبر: {invalid_value}. مقادیر مجاز: {allowed_values}",
    "extra_property_direction_invalid": "جهت ملک نامعتبر: {invalid_value}. مقادیر مجاز: {allowed_values}",
    "extra_city_position_invalid": "موقعیت شهری نامعتبر: {invalid_value}. مقادیر مجاز: {allowed_values}",
    "extra_unit_type_invalid": "نوع واحد نامعتبر: {invalid_value}. مقادیر مجاز: {allowed_values}",
}

AGENT_DEFAULTS = {
    "meta_title_suffix": " - مشاور املاک",
}

PDF_LABELS = {
    'title': 'عنوان',
    'id': 'شناسه',
    'status': 'وضعیت',
    'created_at': 'تاریخ ایجاد',
    'updated_at': 'تاریخ به‌روزرسانی',
    'page': 'صفحه {page}',
    'property_type': 'نوع ملک',
    'state': 'وضعیت',
    'city': 'شهر',
    'province': 'استان',
    'price': 'قیمت',
    'bedrooms': 'خواب',
    'bathrooms': 'حمام',
    'built_area': 'متراژ',
    'published': 'منتشر شده',
    'featured': 'ویژه',
    'public': 'عمومی',
    'verified': 'تایید شده',
    'active': 'فعال',
    'agent': 'نماینده',
    'agency': 'آژانس',
    'labels': 'برچسب‌ها',
    'tags': 'تگ‌ها',
    'features': 'ویژگی‌ها',
    'yes': 'بله',
    'no': 'خیر',
}

AGENT_SUCCESS = {
    "agent_list_success": "لیست مشاورین با موفقیت دریافت شد.",
    "agent_created": "مشاور با موفقیت ایجاد شد.",
    "agent_updated": "مشاور با موفقیت به‌روزرسانی شد.",
    "agent_deleted": "مشاور با موفقیت حذف شد.",
    "agent_retrieved": "مشاور با موفقیت دریافت شد.",
    "agent_bulk_deleted": "مشاورین با موفقیت حذف شدند.",
    "agent_statistics_retrieved": "آمار مشاورین با موفقیت دریافت شد.",
}

AGENT_ERRORS = {
    "agent_not_found": "مشاور یافت نشد.",
    "agent_not_authorized": "شما اجازه دسترسی به مشاورین را ندارید.",
    "agent_create_failed": "ایجاد مشاور ناموفق بود.",
    "agent_update_failed": "به‌روزرسانی مشاور ناموفق بود.",
    "agent_delete_failed": "حذف مشاور ناموفق بود.",
    "agent_ids_required": "شناسه مشاورین مورد نیاز است.",
    "agents_not_found": "مشاورین انتخاب شده یافت نشدند.",
    "agent_has_properties": "این مشاور دارای {count} ملک است و قابل حذف نیست.",
    "user_already_has_agent": "این کاربر قبلاً یک پروفایل مشاور دارد.",
    "user_must_be_admin": "فقط کاربران ادمین می‌توانند مشاور املاک باشند.",
    "user_not_found": "کاربر یافت نشد.",
    "user_id_required": "شناسه کاربر مورد نیاز است.",
    "license_number_exists": "شماره پروانه قبلاً استفاده شده است.",
    "slug_required": "نامک (Slug) الزامی است.",
    "slug_exists": "این نامک قبلاً استفاده شده است.",
}

AGENCY_SUCCESS = {
    "agency_list_success": "لیست آژانس‌ها با موفقیت دریافت شد.",
    "agency_created": "آژانس با موفقیت ایجاد شد.",
    "agency_updated": "آژانس با موفقیت به‌روزرسانی شد.",
    "agency_deleted": "آژانس با موفقیت حذف شد.",
    "agency_retrieved": "آژانس با موفقیت دریافت شد.",
    "agency_bulk_deleted": "آژانس‌ها با موفقیت حذف شدند.",
    "agency_statistics_retrieved": "آمار آژانس‌ها با موفقیت دریافت شد.",
}

AGENCY_ERRORS = {
    "agency_not_found": "آژانس یافت نشد.",
    "agency_not_authorized": "شما اجازه دسترسی به آژانس‌ها را ندارید.",
    "agency_create_failed": "ایجاد آژانس ناموفق بود.",
    "agency_update_failed": "به‌روزرسانی آژانس ناموفق بود.",
    "agency_delete_failed": "حذف آژانس ناموفق بود.",
    "agency_ids_required": "شناسه آژانس‌ها مورد نیاز است.",
    "agencies_not_found": "آژانس‌های انتخاب شده یافت نشدند.",
    "agency_has_properties": "این آژانس دارای {count} ملک است و قابل حذف نیست.",
    "agency_has_agents": "این آژانس دارای {count} مشاور است و قابل حذف نیست.",
    "license_number_exists": "شماره پروانه قبلاً استفاده شده است.",
    "slug_required": "نامک (Slug) الزامی است.",
    "slug_exists": "این نامک قبلاً استفاده شده است.",
}

TYPE_SUCCESS = {
    "type_list_success": "لیست انواع ملک با موفقیت دریافت شد.",
    "type_created": "نوع ملک با موفقیت ایجاد شد.",
    "type_updated": "نوع ملک با موفقیت به‌روزرسانی شد.",
    "type_deleted": "نوع ملک با موفقیت حذف شد.",
    "type_retrieved": "نوع ملک با موفقیت دریافت شد.",
    "type_moved": "نوع ملک با موفقیت منتقل شد.",
    "type_bulk_deleted": "انواع ملک با موفقیت حذف شدند.",
    "type_statistics_retrieved": "آمار انواع ملک با موفقیت دریافت شد.",
}

TYPE_ERRORS = {
    "type_not_found": "نوع ملک یافت نشد.",
    "type_not_authorized": "شما اجازه دسترسی به انواع ملک را ندارید.",
    "type_create_failed": "ایجاد نوع ملک ناموفق بود.",
    "type_update_failed": "به‌روزرسانی نوع ملک ناموفق بود.",
    "type_delete_failed": "حذف نوع ملک ناموفق بود.",
    "type_has_properties": "این نوع ملک در {count} ملک استفاده شده و قابل حذف نیست.",
    "type_has_children": "این نوع ملک دارای {count} زیرنوع است و قابل حذف نیست.",
    "type_ids_required": "شناسه انواع ملک مورد نیاز است.",
    "types_not_found": "انواع ملک انتخاب‌شده یافت نشدند.",
    "type_move_to_descendant": "نمی‌توانید نوع ملک را به فرزند خودش منتقل کنید.",
    "type_move_to_self": "نمی‌توانید نوع ملک را به خودش منتقل کنید.",
    "type_move_failed": "خطا در انتقال نوع ملک: {error}",
    "type_title_exists": "این عنوان قبلاً ثبت شده است.",
    "type_slug_exists": "این نامک قبلاً استفاده شده است.",
    "type_max_depth": "حداکثر عمق مجاز برای نوع ملک رعایت نشده است.",
    "type_cannot_be_own_parent": "نوع ملک نمی‌تواند والد خودش باشد.",
}

STATE_SUCCESS = {
    "state_list_success": "لیست وضعیت‌های ملک با موفقیت دریافت شد.",
    "state_created": "وضعیت ملک با موفقیت ایجاد شد.",
    "state_updated": "وضعیت ملک با موفقیت به‌روزرسانی شد.",
    "state_deleted": "وضعیت ملک با موفقیت حذف شد.",
    "state_retrieved": "وضعیت ملک با موفقیت دریافت شد.",
    "state_bulk_deleted": "وضعیت‌های ملک با موفقیت حذف شدند.",
}

STATE_ERRORS = {
    "state_not_found": "وضعیت ملک یافت نشد.",
    "state_not_authorized": "شما اجازه دسترسی به وضعیت‌های ملک را ندارید.",
    "state_create_failed": "ایجاد وضعیت ملک ناموفق بود.",
    "state_update_failed": "به‌روزرسانی وضعیت ملک ناموفق بود.",
    "state_delete_failed": "حذف وضعیت ملک ناموفق بود.",
    "state_has_properties": "این وضعیت در {count} ملک استفاده شده و قابل حذف نیست.",
    "state_ids_required": "شناسه وضعیت‌های ملک مورد نیاز است.",
    "states_not_found": "وضعیت‌های انتخاب شده یافت نشدند.",
    "state_exists": "این وضعیت قبلاً ثبت شده است.",
    "state_slug_exists": "این نامک قبلاً استفاده شده است.",
}

LABEL_SUCCESS = {
    "label_list_success": "لیست برچسب‌های ملک با موفقیت دریافت شد.",
    "label_created": "برچسب ملک با موفقیت ایجاد شد.",
    "label_updated": "برچسب ملک با موفقیت به‌روزرسانی شد.",
    "label_deleted": "برچسب ملک با موفقیت حذف شد.",
    "label_retrieved": "برچسب ملک با موفقیت دریافت شد.",
}

LABEL_ERRORS = {
    "label_not_found": "برچسب ملک یافت نشد.",
    "label_not_authorized": "شما اجازه دسترسی به برچسب‌های ملک را ندارید.",
    "label_create_failed": "ایجاد برچسب ملک ناموفق بود.",
    "label_update_failed": "به‌روزرسانی برچسب ملک ناموفق بود.",
    "label_delete_failed": "حذف برچسب ملک ناموفق بود.",
    "label_exists": "این برچسب قبلاً ثبت شده است.",
}

FEATURE_SUCCESS = {
    "feature_list_success": "لیست ویژگی‌های ملک با موفقیت دریافت شد.",
    "feature_created": "ویژگی ملک با موفقیت ایجاد شد.",
    "feature_updated": "ویژگی ملک با موفقیت به‌روزرسانی شد.",
    "feature_deleted": "ویژگی ملک با موفقیت حذف شد.",
    "feature_retrieved": "ویژگی ملک با موفقیت دریافت شد.",
}

FEATURE_ERRORS = {
    "feature_not_found": "ویژگی ملک یافت نشد.",
    "feature_not_authorized": "شما اجازه دسترسی به ویژگی‌های ملک را ندارید.",
    "feature_create_failed": "ایجاد ویژگی ملک ناموفق بود.",
    "feature_update_failed": "به‌روزرسانی ویژگی ملک ناموفق بود.",
    "feature_delete_failed": "حذف ویژگی ملک ناموفق بود.",
    "feature_exists": "این ویژگی قبلاً ثبت شده است.",
}

TAG_SUCCESS = {
    "tag_list_success": "لیست تگ‌ها با موفقیت دریافت شد.",
    "tag_created": "تگ با موفقیت ایجاد شد.",
    "tag_updated": "تگ با موفقیت به‌روزرسانی شد.",
    "tag_deleted": "تگ با موفقیت حذف شد.",
    "tag_retrieved": "تگ با موفقیت دریافت شد.",
    "tag_bulk_deleted": "تگ‌ها با موفقیت حذف شدند.",
}

TAG_ERRORS = {
    "tag_not_found": "تگ یافت نشد.",
    "tag_not_authorized": "شما اجازه دسترسی به تگ‌ها را ندارید.",
    "tag_create_failed": "ایجاد تگ ناموفق بود.",
    "tag_update_failed": "به‌روزرسانی تگ ناموفق بود.",
    "tag_delete_failed": "حذف تگ ناموفق بود.",
    "tag_has_properties": "این تگ در {count} مورد استفاده شده و قابل حذف نیست.",
    "tag_ids_required": "شناسه تگ‌ها مورد نیاز است.",
    "tags_not_found": "تگ‌های انتخاب شده یافت نشدند.",
    "tag_slug_exists": "این نامک قبلاً استفاده شده است.",
    "tag_exists": "این تگ قبلاً ثبت شده است.",
}

FLOOR_PLAN_SUCCESS = {
    "floor_plan_list_success": "لیست پلان‌های معماری با موفقیت دریافت شد.",
    "floor_plan_created": "پلان معماری با موفقیت ایجاد شد.",
    "floor_plan_updated": "پلان معماری با موفقیت به‌روزرسانی شد.",
    "floor_plan_deleted": "پلان معماری با موفقیت حذف شد.",
    "floor_plan_retrieved": "پلان معماری با موفقیت دریافت شد.",
    "floor_plan_images_added": "تصاویر با موفقیت به پلان معماری اضافه شدند.",
    "floor_plan_image_removed": "تصویر با موفقیت حذف شد.",
    "floor_plan_main_image_set": "تصویر شاخص پلان با موفقیت تنظیم شد.",
    "floor_plan_images_synced": "تصاویر پلان با موفقیت همگام‌سازی شدند.",
}

FLOOR_PLAN_ERRORS = {
    "floor_plan_not_found": "پلان معماری یافت نشد.",
    "floor_plan_not_authorized": "شما اجازه دسترسی به پلان‌های معماری را ندارید.",
    "floor_plan_create_failed": "ایجاد پلان معماری ناموفق بود.",
    "floor_plan_update_failed": "به‌روزرسانی پلان معماری ناموفق بود.",
    "floor_plan_delete_failed": "حذف پلان معماری ناموفق بود.",
    "floor_plan_property_required": "شناسه ملک مورد نیاز است.",
    "image_id_required": "شناسه تصویر مورد نیاز است.",
    "image_not_found_in_floor_plan": "تصویر در این پلان یافت نشد.",
    "media_upload_limit_exceeded": "حداکثر {max_items} تصویر برای آپلود مجاز است. شما {total_items} تصویر ارسال کرده‌اید.",
    "only_one_main_image": "فقط یک تصویر اصلی برای هر پلان مجاز است.",
    "slug_exists": "این نامک قبلاً استفاده شده است.",
}

LOCATION_SUCCESS = {
    "province_list_success": "استان‌ها با موفقیت دریافت شدند.",
    "city_list_success": "شهرها با موفقیت دریافت شدند.",
    "region_list_success": "مناطق شهری با موفقیت دریافت شدند.",
}

LOCATION_ERRORS = {
    "location_not_authorized": "شما اجازه دسترسی به موقعیت‌های مکانی را ندارید.",
    "province_not_found": "استان یافت نشد.",
    "city_not_found": "شهر یافت نشد.",
}

