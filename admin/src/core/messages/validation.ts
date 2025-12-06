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
  
  nationalIdRequired: 'کد ملی الزامی است',
  nationalIdLength: 'کد ملی باید ۱۰ رقم باشد',
  nationalIdInvalid: 'کد ملی معتبر نیست',
  
  metaTitleMaxLength: 'عنوان متا نباید بیشتر از ۷۰ کاراکتر باشد',
  metaDescMaxLength: 'توضیحات متا نباید بیشتر از ۱۶۰ کاراکتر باشد',
  ogTitleMaxLength: 'عنوان OG نباید بیشتر از ۷۰ کاراکتر باشد',
  ogDescMaxLength: 'توضیحات OG نباید بیشتر از ۱۶۰ کاراکتر باشد',
  
  urlInvalid: 'آدرس وارد شده معتبر نیست',
} as const;

export const getValidation = createMessageGetter(VALIDATION_MESSAGES);
