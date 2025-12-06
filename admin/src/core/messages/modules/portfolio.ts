import { createMessageGetter } from '../utils';

export const PORTFOLIO_MESSAGES = {
  nameRequired: 'نام نمونه‌کار الزامی است',
  nameMinLength: 'نام نمونه‌کار باید حداقل ۳ کاراکتر باشد',
  nameMaxLength: 'نام نمونه‌کار نباید بیشتر از ۲۰۰ کاراکتر باشد',
  slugRequired: 'لینک (اسلاگ) الزامی است',
  slugInvalid: 'لینک (اسلاگ) فقط می‌تواند شامل حروف فارسی، انگلیسی، اعداد و خط تیره باشد',
  slugMaxLength: 'لینک (اسلاگ) نباید بیشتر از ۶۰ کاراکتر باشد',
  shortDescMaxLength: 'توضیحات کوتاه نباید بیشتر از ۳۰۰ کاراکتر باشد',
  categoryRequired: 'انتخاب دسته‌بندی الزامی است',
  featuredImageRequired: 'انتخاب تصویر شاخص الزامی است',
  
  categoryNameRequired: 'نام دسته‌بندی الزامی است',
  categoryNameMinLength: 'نام دسته‌بندی باید حداقل ۲ کاراکتر باشد',
  categorySlugRequired: 'اسلاگ دسته‌بندی الزامی است',
  
  tagNameRequired: 'نام تگ الزامی است',
  tagNameMinLength: 'نام تگ باید حداقل ۲ کاراکتر باشد',
  tagSlugRequired: 'اسلاگ تگ الزامی است',
  
  optionNameRequired: 'نام گزینه الزامی است',
  optionNameMinLength: 'نام گزینه باید حداقل ۲ کاراکتر باشد',
  optionSlugRequired: 'اسلاگ گزینه الزامی است',
} as const;

export const getPortfolio = createMessageGetter(PORTFOLIO_MESSAGES);
