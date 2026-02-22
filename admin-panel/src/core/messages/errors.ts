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

const SYSTEM_MESSAGE_MAP: Record<string, string> = {
  'Internal server error': 'خطای داخلی سرور',
  'Server error': 'خطای سرور',
  'Validation error': 'خطا در اعتبارسنجی اطلاعات',
  'Unauthorized': 'دسترسی غیر مجاز',
  'Forbidden': 'دسترسی ممنوع',
  'Not found': 'یافت نشد',
  'Network Error': 'خطا در اتصال به شبکه',
  'Request timeout': 'زمان اتصال به پایان رسید',
  'Invalid credentials': 'ورود اعتبارنامه‌های ارائه شده نادرست است',
  'Invalid password': 'رمز عبور اشتباه است',
  'Invalid OTP': 'کد تأیید نامعتبر است',
  'Session expired': 'جلسه کاری منقضی شده است',
  'Access denied': 'دسترسی غیر مجاز',
  'Unknown error': 'خطای نامشخص',
};

const isProbablyEnglish = (value: string): boolean => /[A-Za-z]/.test(value);

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

export const normalizeSystemMessage = (message: string): string => {
  const normalized = message.trim();
  if (!normalized) {
    return message;
  }

  const direct = SYSTEM_MESSAGE_MAP[normalized];
  if (direct) {
    return direct;
  }

  if (isProbablyEnglish(normalized)) {
    const lowerKey = normalized.toLowerCase();

    if (lowerKey.includes('timeout')) return 'زمان اتصال به پایان رسید';
    if (lowerKey.includes('network')) return 'خطا در اتصال به شبکه';
    if (lowerKey.includes('forbidden')) return 'دسترسی ممنوع';
    if (lowerKey.includes('unauthorized')) return 'دسترسی غیر مجاز';
    if (lowerKey.includes('not found')) return 'موردی یافت نشد';
    if (lowerKey.includes('server')) return 'خطای سرور';
    if (lowerKey.includes('validation')) return 'خطا در اعتبارسنجی اطلاعات';
    if (lowerKey.includes('invalid credentials')) return 'ورود اعتبارنامه‌های ارائه شده نادرست است';
    if (lowerKey.includes('invalid password')) return 'رمز عبور اشتباه است';
    if (lowerKey.includes('invalid otp')) return 'کد تأیید نامعتبر است';
    if (lowerKey.includes('session')) return 'جلسه کاری منقضی شده است';
    if (lowerKey.includes('access denied')) return 'دسترسی غیر مجاز';
  }

  return message;
};

export const shouldUseBackendMessage = (statusCode: number): boolean =>
  BACKEND_MESSAGE_CODES.includes(statusCode as any);

export const isSilentError = (statusCode: number): boolean =>
  SILENT_STATUS_CODES.includes(statusCode as any);

