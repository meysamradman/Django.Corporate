import { createMessageGetter } from '../utils';

export const ROLE_MESSAGES = {
  nameRequired: 'نام نقش الزامی است',
  nameMinLength: 'نام نقش باید حداقل ۲ کاراکتر باشد',
  nameMaxLength: 'نام نقش نباید بیشتر از ۱۰۰ کاراکتر باشد',
  
  descMaxLength: 'توضیحات نقش نباید بیشتر از ۳۰۰ کاراکتر باشد',
  
  permissionsRequired: 'حداقل یک مجوز باید انتخاب شود',
} as const;

export const getRole = createMessageGetter(ROLE_MESSAGES);
