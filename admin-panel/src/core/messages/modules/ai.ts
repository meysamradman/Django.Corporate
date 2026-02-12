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
  
  // Provider & API Key Errors
  noApiKey: 'API Key برای این Provider تنظیم نشده است. لطفاً ابتدا به تنظیمات AI بروید و API Key را وارد کنید.',
  invalidApiKey: 'API Key نامعتبر است. لطفاً API Key صحیح را در تنظیمات وارد کنید.',
  providerNotActive: 'این Provider فعال نیست. لطفاً ابتدا از تنظیمات AI آن را فعال کنید.',
  providerNotSupported: 'این Provider پشتیبانی نمی‌شود یا در دسترس نیست.',
  
  // Billing & Credit Errors
  insufficientCredit: 'اعتبار کافی ندارید. لطفاً حساب خود را شارژ کنید یا با پشتیبانی تماس بگیرید.',
  billingLimitReached: 'محدودیت صورتحساب شما به پایان رسیده است. لطفاً پلن خود را ارتقا دهید.',
  quotaExceeded: 'سهمیه استفاده شما تمام شده است. لطفاً تا تمدید سهمیه صبر کنید یا پلن خود را ارتقا دهید.',
  
  // Rate Limit Errors
  rateLimitExceeded: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً چند لحظه صبر کنید و دوباره تلاش کنید.',
  tooManyRequests: 'درخواست‌های زیادی ارسال کرده‌اید. لطفاً 1-2 دقیقه صبر کنید.',
  
  // Model Errors
  modelNotFound: 'مدل انتخابی یافت نشد یا در دسترس نیست. لطفاً مدل دیگری را انتخاب کنید.',
  modelNotAvailable: 'این مدل در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید یا مدل دیگری را امتحان کنید.',
  modelLoadingError: 'خطا در بارگذاری مدل. این مدل ممکن است غیرفعال باشد.',
  
  // Generation Errors
  contentGenerationFailed: 'خطا در تولید محتوا. لطفاً دوباره تلاش کنید.',
  imageGenerationFailed: 'خطا در تولید تصویر. لطفاً دوباره تلاش کنید.',
  chatFailed: 'خطا در ارتباط با AI. لطفاً دوباره تلاش کنید.',
  
  // Network & Timeout Errors
  networkError: 'خطا در اتصال به سرویس AI. لطفاً اتصال اینترنت خود را بررسی کنید.',
  timeoutError: 'زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.',
  serverError: 'خطای سرور AI رخ داد. لطفاً چند لحظه بعد تلاش کنید.',
  
  // Input Validation Errors
  promptTooShort: 'توضیحات خیلی کوتاه است. لطفاً توضیحات بیشتری وارد کنید.',
  promptTooLong: 'توضیحات خیلی طولانی است. لطفاً آن را کوتاه‌تر کنید.',
  invalidInput: 'ورودی نامعتبر است. لطفاً اطلاعات را بررسی کنید.',
  
  // General Errors
  unknownError: 'خطای نامشخصی رخ داد. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.',
  operationFailed: 'عملیات با شکست مواجه شد.',
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

const GENERIC_UNKNOWN_PATTERNS = [
  'خطای نامشخص',
  'unknown error',
  'an error occurred',
  'request failed',
  'network error',
];

const isGenericMessage = (message?: string): boolean => {
  const value = (message || '').trim().toLowerCase();
  if (!value) return true;
  return GENERIC_UNKNOWN_PATTERNS.some((pattern) => value.includes(pattern));
};

export const resolveAIErrorMessage = (error: unknown): string => {
  const get = getAI;

  const asAny = error as any;
  const statusCode: number | undefined = asAny?.response?.AppStatusCode;
  const backendMessage: string | undefined = asAny?.response?.message || asAny?.message;
  const normalized = (backendMessage || '').toLowerCase();

  if (backendMessage && !isGenericMessage(backendMessage)) {
    return backendMessage;
  }

  if (statusCode === 401) return get('invalidApiKey');
  if (statusCode === 402) return get('modelNotAvailable');
  if (statusCode === 403) return get('providerNotSupported');
  if (statusCode === 404) return get('modelNotFound');
  if (statusCode === 408 || statusCode === 504) return get('timeoutError');
  if (statusCode === 429) return get('rateLimitExceeded');
  if (statusCode === 503) return get('networkError');

  if (normalized.includes('api key') || normalized.includes('unauthorized') || normalized.includes('401')) {
    return get('invalidApiKey');
  }
  if (normalized.includes('not a valid model id') || (normalized.includes('model') && normalized.includes('not found')) || (normalized.includes('model') && normalized.includes('invalid'))) {
    return get('modelNotFound');
  }
  if (normalized.includes('payment required') || normalized.includes('paid') || normalized.includes('pricing')) {
    return get('modelNotAvailable');
  }
  if (normalized.includes('quota') || normalized.includes('credit') || normalized.includes('billing')) {
    return get('quotaExceeded');
  }
  if (normalized.includes('rate limit') || normalized.includes('too many requests') || normalized.includes('429')) {
    return get('rateLimitExceeded');
  }
  if (normalized.includes('timeout')) {
    return get('timeoutError');
  }
  if (normalized.includes('network') || normalized.includes('connection') || normalized.includes('unreachable') || normalized.includes('503')) {
    return get('networkError');
  }

  return get('unknownError');
};
