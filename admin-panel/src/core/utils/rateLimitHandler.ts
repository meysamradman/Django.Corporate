interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfter?: number;
  lastError?: Date;
  errorCount: number;
}

class RateLimitHandler {
  private rateLimitInfo: Map<string, RateLimitInfo> = new Map();
  private readonly STORAGE_KEY = 'rate_limit_info';

  constructor() {
    this.loadFromStorage();
  }

  isEndpointLimited(endpoint: string): boolean {
    const info = this.rateLimitInfo.get(endpoint);
    if (!info || !info.isRateLimited) return false;

    if (info.retryAfter && info.lastError) {
      const now = Date.now();
      const lastErrorTime = info.lastError.getTime();
      const retryAfterMs = info.retryAfter * 1000;

      if (now - lastErrorTime > retryAfterMs) {
        this.clearLimit(endpoint);
        return false;
      }
    }

    return true;
  }

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
  }

  clearLimit(endpoint: string) {
    this.rateLimitInfo.delete(endpoint);
    this.saveToStorage();
  }

  clearAllLimits() {
    this.rateLimitInfo.clear();
    this.saveToStorage();
  }

  getLimitInfo(endpoint: string): RateLimitInfo | undefined {
    return this.rateLimitInfo.get(endpoint);
  }

  getAllLimitedEndpoints(): string[] {
    return Array.from(this.rateLimitInfo.keys()).filter(endpoint =>
      this.isEndpointLimited(endpoint)
    );
  }

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
    }
  }

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

      this.rateLimitInfo.forEach((_info, endpoint) => {
        if (!this.isEndpointLimited(endpoint)) {
          this.rateLimitInfo.delete(endpoint);
        }
      });
    } catch (error) {
      this.rateLimitInfo.clear();
    }
  }

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

export const rateLimitHandler = new RateLimitHandler();

export const handleRateLimitError = (endpoint: string, retryAfter?: number) => {
  rateLimitHandler.recordRateLimit(endpoint, retryAfter);
  return rateLimitHandler.getUserFriendlyMessage(endpoint);
};
