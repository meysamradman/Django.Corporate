export const ERROR_MESSAGES = {
  network: 'خطا در اتصال به شبکه',
  unauthorized: 'دسترسی غیر مجاز',
  forbidden: 'دسترسی ممنوع',
  notFound: 'یافت نشد',
  serverError: 'خطای سرور',
  validation: 'خطا در اعتبارسنجی اطلاعات',
  timeout: 'زمان اتصال به پایان رسید',
  database: 'خطای پایگاه داده',
  unknown: 'خطای نامشخص',
  checkForm: 'لطفاً خطاهای فرم را بررسی کنید',
} as const;

export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'درخواست نامعتبر است',
  401: 'لطفاً وارد حساب کاربری خود شوید',
  403: 'شما دسترسی به این بخش ندارید',
  404: 'موردی یافت نشد',
  408: 'زمان درخواست به پایان رسید',
  409: 'تضاد در اطلاعات',
  422: 'اطلاعات وارد شده معتبر نیست',
  429: 'تعداد درخواست‌های شما بیش از حد مجاز است',
  500: 'خطای سرور رخ داد',
  502: 'سرور در دسترس نیست',
  503: 'سرویس موقتاً در دسترس نیست',
  504: 'زمان اتصال به سرور به پایان رسید',
} as const;

export const NETWORK_ERROR_MESSAGES = {
  network: 'خطا در اتصال به اینترنت',
  timeout: 'زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید',
  unknown: 'خطای نامشخصی رخ داده است',
} as const;

// Use backend-provided messages for admin-facing clarity.
// Especially important for AI capability mismatch errors (HTTP 400),
// quota/rate-limit (429), server errors (500), and timeouts (504).
export const BACKEND_MESSAGE_CODES = [400, 404, 409, 422, 429, 500, 504] as const;
export const SILENT_STATUS_CODES = [401, 403] as const;

export const getError = (key: keyof typeof ERROR_MESSAGES): string => {
  return ERROR_MESSAGES[key] || ERROR_MESSAGES.unknown;
};

export const getNetworkError = (key: keyof typeof NETWORK_ERROR_MESSAGES): string => {
  return NETWORK_ERROR_MESSAGES[key] || NETWORK_ERROR_MESSAGES.unknown;
};

export const getHttpError = (code: number): string => {
  return HTTP_ERROR_MESSAGES[code] || NETWORK_ERROR_MESSAGES.unknown;
};

export const shouldUseBackendMessage = (statusCode: number): boolean =>
  BACKEND_MESSAGE_CODES.includes(statusCode as any);

export const isSilentError = (statusCode: number): boolean =>
  SILENT_STATUS_CODES.includes(statusCode as any);

