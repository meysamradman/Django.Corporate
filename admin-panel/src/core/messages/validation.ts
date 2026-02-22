import { createMessageGetter } from './utils';

export const VALIDATION_MESSAGES = {
  required: '{field} الزامی است',
  minLength: '{field} باید حداقل {min} کاراکتر باشد',
  maxLength: '{field} نباید بیشتر از {max} کاراکتر باشد',
  
  mobileRequired: 'شماره موبایل الزامی است',
  mobileInvalid: 'شماره موبایل معتبر نیست',
  
  emailRequired: 'ایمیل الزامی است',
  emailInvalid: 'فرمت ایمیل معتبر نیست',
  
  passwordRequired: 'رمز عبور الزامی است',
  passwordMinLength: 'رمز عبور باید حداقل ۸ کاراکتر باشد',
  passwordComplexity: 'رمز عبور باید شامل حروف بزرگ، کوچک، عدد و کاراکتر ویژه باشد',
  passwordMismatch: 'رمز عبور و تکرار آن یکسان نیستند',
  
  captchaRequired: 'کد کپتچا الزامی است',
  otpRequired: 'کد یکبار مصرف الزامی است',
  
  nationalIdRequired: 'کد ملی الزامی است',
  nationalIdLength: 'کد ملی باید ۱۰ رقم باشد',
  nationalIdInvalid: 'کد ملی معتبر نیست',
  
  phoneMaxLength: 'شماره تلفن نباید بیشتر از ۱۵ رقم باشد',
  phoneInvalid: 'شماره تلفن معتبر نیست',
  addressMaxLength: 'آدرس نباید بیشتر از ۵۰۰ کاراکتر باشد',
  departmentMaxLength: 'بخش نباید بیشتر از ۱۰۰ کاراکتر باشد',
  positionMaxLength: 'سمت نباید بیشتر از ۱۰۰ کاراکتر باشد',
  bioMaxLength: 'بیوگرافی نباید بیشتر از ۱۰۰۰ کاراکتر باشد',
  notesMaxLength: 'یادداشت‌ها نباید بیشتر از ۱۰۰۰ کاراکتر باشد',
  provinceRequired: 'انتخاب استان الزامی است',
  cityRequired: 'انتخاب شهر الزامی است',
  
  roleNameRequired: 'نام نقش الزامی است',
  roleNameMinLength: 'نام نقش باید حداقل ۲ کاراکتر باشد',
  roleNameMaxLength: 'نام نقش نباید بیشتر از ۱۰۰ کاراکتر باشد',
  roleDescMaxLength: 'توضیحات نقش نباید بیشتر از ۳۰۰ کاراکتر باشد',
  permissionsRequired: 'حداقل یک مجوز باید انتخاب شود',
  
  metaTitleMaxLength: 'عنوان متا نباید بیشتر از ۷۰ کاراکتر باشد',
  metaDescMaxLength: 'توضیحات متا نباید بیشتر از ۱۶۰ کاراکتر باشد',
  ogTitleMaxLength: 'عنوان OG نباید بیشتر از ۷۰ کاراکتر باشد',
  ogDescMaxLength: 'توضیحات OG نباید بیشتر از ۱۶۰ کاراکتر باشد',
  
  slugRequired: 'اسلاگ الزامی است',
  slugMaxLength: 'اسلاگ نباید بیشتر از ۶۰ کاراکتر باشد',
  slugInvalid: 'اسلاگ فقط می‌تواند شامل حروف فارسی، انگلیسی، اعداد و خط تیره باشد',
  
  urlInvalid: 'آدرس وارد شده معتبر نیست',
  fileSizeLimit: 'حجم فایل نباید بیشتر از {max} باشد',
  duplicateFieldName: 'این نام فیلد قبلاً استفاده شده است',
} as const;

export const getValidation = createMessageGetter(VALIDATION_MESSAGES);

