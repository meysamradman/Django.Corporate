import { createMessageGetter } from '../utils';

export const BLOG_MESSAGES = {
  nameRequired: 'عنوان وبلاگ الزامی است',
  nameMinLength: 'عنوان وبلاگ باید حداقل ۳ کاراکتر باشد',
  nameMaxLength: 'عنوان وبلاگ نباید بیشتر از ۲۰۰ کاراکتر باشد',
  slugRequired: 'اسلاگ وبلاگ الزامی است',
  slugInvalid: 'اسلاگ وبلاگ فقط می‌تواند شامل حروف فارسی، انگلیسی، اعداد و خط تیره باشد',
  slugMaxLength: 'اسلاگ وبلاگ نباید بیشتر از ۶۰ کاراکتر باشد',
  shortDescMaxLength: 'توضیحات کوتاه وبلاگ نباید بیشتر از ۳۰۰ کاراکتر باشد',
  categoryRequired: 'انتخاب دسته‌بندی وبلاگ الزامی است',
  featuredImageRequired: 'انتخاب تصویر شاخص وبلاگ الزامی است',
  
  categoryNameRequired: 'نام دسته‌بندی الزامی است',
  categoryNameMinLength: 'نام دسته‌بندی باید حداقل ۲ کاراکتر باشد',
  categorySlugRequired: 'اسلاگ دسته‌بندی الزامی است',
  
  tagNameRequired: 'نام تگ الزامی است',
  tagNameMinLength: 'نام تگ باید حداقل ۲ کاراکتر باشد',
  tagSlugRequired: 'اسلاگ تگ الزامی است',
} as const;

export const getBlog = createMessageGetter(BLOG_MESSAGES);
