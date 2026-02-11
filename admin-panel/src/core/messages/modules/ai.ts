import { createMessageGetter } from '../utils';

export const AI_MESSAGES = {
  selectModel: 'لطفاً یک Provider انتخاب کنید',
  selectModelWithInstructions: 'لطفاً یک Provider انتخاب کنید. ابتدا باید در تنظیمات پنل > تنظیمات AI، یک Provider را فعال کنید.',
  enterTopic: 'لطفاً موضوع محتوا را وارد کنید',
  enterPrompt: 'لطفاً توضیحات تصویر را وارد کنید',
  enterMessage: 'لطفاً پیام خود را وارد کنید',
  enterApiKey: 'لطفاً API key را وارد کنید',
  contentGenerated: 'محتوای جدید تولید شد',
  imageGenerated: 'تصویر با موفقیت تولید شد (ذخیره نشده)',
  imageGeneratedAndSaved: 'تصویر با موفقیت تولید و ذخیره شد',
  imageSaved: 'تصویر در دیتابیس ذخیره شد',
  copied: 'کپی شد',
  chatCleared: 'چت پاک شد',
  operationSuccess: 'عملیات با موفقیت انجام شد',
  copyError: 'خطا در کپی کردن',
  saveImageError: 'خطا در ذخیره تصویر',
} as const;

export const AI_UI_MESSAGES = {
  selectModel: 'انتخاب Provider AI',
  imagePrompt: 'توضیحات تصویر',
  contentTopic: 'موضوع محتوا',
  selectModelPlaceholder: 'انتخاب Provider',
  messagePlaceholder: 'پیام خود را بنویسید... (Enter برای ارسال، Shift+Enter برای خط جدید)',
  topicPlaceholder: 'مثال: راهنمای کامل طراحی وب سایت',
  promptPlaceholder: 'مثال: a beautiful cat, professional photography, high quality...',
  apiKeyPlaceholder: 'API key را وارد کنید',
  generateContent: 'تولید محتوای SEO',
  generatingContent: 'در حال تولید محتوا...',
  generateImage: 'تولید تصویر',
  generatingImage: 'در حال تولید تصویر...',
  save: 'ذخیره',
  cancel: 'لغو',
  selectImage: 'انتخاب این تصویر',
  selectImageDisabled: 'انتخاب (ابتدا ذخیره کنید)',
  newGeneration: 'تولید جدید',
  saveToDatabase: 'ذخیره در دیتابیس',
  editApiKey: 'تغییر API Key',
  enterApiKey: 'وارد کردن API Key',
  goToSettings: 'رفتن به تنظیمات',
  goToAISettings: 'رفتن به تنظیمات AI',
  clearChat: 'پاک کردن چت',
  selected: 'انتخاب شده',
  clickToSelect: 'برای انتخاب کلیک کنید',
  active: 'فعال',
  inactive: 'غیرفعال',
  noApiKey: 'بدون API Key',
  status: 'وضعیت:',
  usageCount: 'تعداد استفاده:',
  times: 'بار',
  notSaved: '(ذخیره نشده)',
  noActiveProviders: 'هیچ Provider فعالی یافت نشد',
  noActiveProvidersForImage: 'هیچ Provider فعالی برای تولید تصویر وجود ندارد',
  noActiveModel: 'هیچ مدل فعالی یافت نشد',
  startConversation: 'شروع مکالمه',
  chatDescription: 'سوالات خود را از AI بپرسید. پیام‌ها ذخیره نمی‌شوند.',
  chatInstructions: 'برای استفاده از چت، لطفاً یک Provider را در تنظیمات پنل فعال کنید.',
  chatInstructionsFull: 'برای استفاده از چت با AI، ابتدا باید یک Provider (Gemini، OpenAI یا DeepSeek) را در تنظیمات پنل > تنظیمات AI فعال کنید.',
  imageGenerationInstructions: 'برای تولید تصویر با AI، باید:',
  imageGenerationStep1: 'به تب "تنظیمات AI" بروید',
  imageGenerationStep2: 'برای یک Provider (مثل OpenAI) API key وارد کنید',
  imageGenerationStep3: 'API key را ذخیره کنید',
  imageGenerationStep4: 'Switch را فعال کنید',
  qualityTipTitle: '💡 نکته برای کیفیت بهتر:',
  qualityTipDescription: 'برای نتیجه بهتر، توضیحات را به انگلیسی بنویسید. مثال: "a beautiful cat, high quality, detailed"',
  qualityTipNote: 'سیستم به صورت خودکار کلمات کلیدی کیفیت را اضافه می‌کند.',
  autoSaveLabel: 'ذخیره خودکار در دیتابیس (اگر خالی باشد، فقط نمایش داده می‌شود - سریع‌تر)',
  copyHTML: 'کپی HTML',
  copyText: 'کپی متن',
  copiedHTML: 'کپی HTML شد',
  fullContent: 'محتوای کامل',
  generatedImage: 'تصویر تولید شده',
  responding: 'در حال پاسخ...',
  confirmClearChat: 'آیا مطمئن هستید که می‌خواهید تمام پیام‌ها را پاک کنید؟',
} as const;

export const getAI = createMessageGetter(AI_MESSAGES);
export const getAIUI = createMessageGetter(AI_UI_MESSAGES);
