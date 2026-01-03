/**
 * 🔧 Rate Limit Handler
 * 
 * مدیریت خطاهای 429 (Too Many Requests) و نمایش پیام مناسب به کاربر
 */

interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfter?: number; // به ثانیه
  lastError?: Date;
  errorCount: number;
}

class RateLimitHandler {
  private rateLimitInfo: Map<string, RateLimitInfo> = new Map();
  private readonly STORAGE_KEY = 'rate_limit_info';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * بررسی اینکه آیا یک endpoint محدود شده است
   */
  isEndpointLimited(endpoint: string): boolean {
    const info = this.rateLimitInfo.get(endpoint);
    if (!info || !info.isRateLimited) return false;

    // بررسی اینکه آیا زمان retry تمام شده
    if (info.retryAfter && info.lastError) {
      const now = Date.now();
      const lastErrorTime = info.lastError.getTime();
      const retryAfterMs = info.retryAfter * 1000;

      if (now - lastErrorTime > retryAfterMs) {
        // زمان retry تمام شده - ریست کن
        this.clearLimit(endpoint);
        return false;
      }
    }

    return true;
  }

  /**
   * ثبت خطای 429 برای یک endpoint
   */
  recordRateLimit(endpoint: string, retryAfter: number = 60) {
    const existing = this.rateLimitInfo.get(endpoint);
    
    const info: RateLimitInfo = {
      isRateLimited: true,
      retryAfter,
      lastError: new Date(),
      errorCount: (existing?.errorCount || 0) + 1,
    };

    this.rateLimitInfo.set(endpoint, info);
    this.saveToStorage();

    console.warn(
      `⚠️ Rate limit hit for ${endpoint}. Retry after ${retryAfter}s. Error count: ${info.errorCount}`
    );
  }

  /**
   * پاک کردن محدودیت برای یک endpoint
   */
  clearLimit(endpoint: string) {
    this.rateLimitInfo.delete(endpoint);
    this.saveToStorage();
  }

  /**
   * پاک کردن تمام محدودیت‌ها
   */
  clearAllLimits() {
    this.rateLimitInfo.clear();
    this.saveToStorage();
  }

  /**
   * دریافت اطلاعات محدودیت برای یک endpoint
   */
  getLimitInfo(endpoint: string): RateLimitInfo | undefined {
    return this.rateLimitInfo.get(endpoint);
  }

  /**
   * دریافت تمام endpoint های محدود شده
   */
  getAllLimitedEndpoints(): string[] {
    return Array.from(this.rateLimitInfo.keys()).filter(endpoint =>
      this.isEndpointLimited(endpoint)
    );
  }

  /**
   * محاسبه زمان باقی‌مانده تا retry
   */
  getRetryAfterSeconds(endpoint: string): number | null {
    const info = this.rateLimitInfo.get(endpoint);
    if (!info || !info.lastError || !info.retryAfter) return null;

    const now = Date.now();
    const lastErrorTime = info.lastError.getTime();
    const retryAfterMs = info.retryAfter * 1000;
    const elapsedMs = now - lastErrorTime;
    const remainingMs = retryAfterMs - elapsedMs;

    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }

  /**
   * ذخیره در localStorage
   */
  private saveToStorage() {
    try {
      const data = Array.from(this.rateLimitInfo.entries()).map(([endpoint, info]) => ({
        endpoint,
        info: {
          ...info,
          lastError: info.lastError?.toISOString(),
        },
      }));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving rate limit info to localStorage:', error);
    }
  }

  /**
   * بارگذاری از localStorage
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);
      this.rateLimitInfo = new Map(
        data.map((item: any) => [
          item.endpoint,
          {
            ...item.info,
            lastError: item.info.lastError ? new Date(item.info.lastError) : undefined,
          },
        ])
      );

      // پاک کردن محدودیت‌های منقضی شده
      this.rateLimitInfo.forEach((_info, endpoint) => {
        if (!this.isEndpointLimited(endpoint)) {
          this.rateLimitInfo.delete(endpoint);
        }
      });
    } catch (error) {
      console.error('Error loading rate limit info from localStorage:', error);
      this.rateLimitInfo.clear();
    }
  }

  /**
   * دریافت پیام کاربرپسند برای نمایش
   */
  getUserFriendlyMessage(endpoint: string): string {
    const retryAfter = this.getRetryAfterSeconds(endpoint);
    
    if (retryAfter === null) {
      return 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.';
    }

    if (retryAfter > 60) {
      const minutes = Math.ceil(retryAfter / 60);
      return `تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ${minutes} دقیقه دیگر امتحان کنید.`;
    }

    return `تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ${retryAfter} ثانیه دیگر امتحان کنید.`;
  }
}

// Export singleton instance
export const rateLimitHandler = new RateLimitHandler();

// Export برای استفاده در axios interceptor
export const handleRateLimitError = (endpoint: string, retryAfter?: number) => {
  rateLimitHandler.recordRateLimit(endpoint, retryAfter);
  return rateLimitHandler.getUserFriendlyMessage(endpoint);
};
