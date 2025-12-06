import { createMessageGetter } from '../utils';

export const ADMIN_MESSAGES = {
  nameRequired: 'نام ادمین الزامی است',
  fullNameRequired: 'نام کامل الزامی است',
  fullNameMinLength: 'نام کامل باید حداقل ۲ کاراکتر باشد',
  fullNameMaxLength: 'نام کامل نباید بیشتر از ۱۰۰ کاراکتر باشد',
  
  firstNameMaxLength: 'نام نباید بیشتر از ۵۰ کاراکتر باشد',
  lastNameMaxLength: 'نام خانوادگی نباید بیشتر از ۵۰ کاراکتر باشد',
  
  phoneMaxLength: 'شماره تلفن نباید بیشتر از ۱۵ رقم باشد',
  phoneInvalid: 'شماره تلفن معتبر نیست',
  
  addressMaxLength: 'آدرس نباید بیشتر از ۵۰۰ کاراکتر باشد',
  
  departmentMaxLength: 'بخش نباید بیشتر از ۱۰۰ کاراکتر باشد',
  positionMaxLength: 'سمت نباید بیشتر از ۱۰۰ کاراکتر باشد',
  
  bioMaxLength: 'بیوگرافی نباید بیشتر از ۱۰۰۰ کاراکتر باشد',
  notesMaxLength: 'یادداشت‌ها نباید بیشتر از ۱۰۰۰ کاراکتر باشد',
  
  provinceRequired: 'انتخاب استان الزامی است',
  cityRequired: 'انتخاب شهر الزامی است',
} as const;

export const getAdmin = createMessageGetter(ADMIN_MESSAGES);
