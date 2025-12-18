import { useState, useEffect, lazy, Suspense } from 'react';
import { Skeleton } from '@/components/elements/Skeleton';
import { useAuth } from '@/core/auth/AuthContext';
import { showError, showSuccess } from '@/core/toast';
import { msg } from '@/core/messages';
import { authApi } from '@/api/auth/auth';
import { MobileInputForm } from './MobileInputForm';
import { ChevronLeft } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';

// ✅ سینتکس صحیح React 19 + Vite 7
const PasswordLoginForm = lazy(() => import('./PasswordLoginForm'));
const OTPLoginForm = lazy(() => import('./OTPLoginForm'));

const FormSkeleton = () => (
  <div className="space-y-5">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-24 rounded-lg" />
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>
    </div>
    <Skeleton className="h-11 w-full rounded-lg" />
  </div>
);

type LoginStep = 'mobile' | 'otp' | 'password';

export function LoginForm() {
  const { login, loginWithOTP, isLoading: authLoading } = useAuth();
  
  const [step, setStep] = useState<LoginStep>('mobile');
  const [mobile, setMobile] = useState<string>('');
  const [otpLength, setOtpLength] = useState(5);
  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaDigits, setCaptchaDigits] = useState<string>('');
  const [captchaLoading, setCaptchaLoading] = useState<boolean>(false);
  const [captchaAnswer, setCaptchaAnswer] = useState<string>('');

  const fetchCaptchaChallenge = async () => {
    setCaptchaLoading(true);
    try {
      const { captcha_id, digits } = await authApi.getCaptchaChallenge();
      setCaptchaId(captcha_id);
      setCaptchaDigits(digits);
    } catch (error) {
      showError(error, { customMessage: msg.error("network") });
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [otpSettingsResult, captchaResult] = await Promise.allSettled([
        authApi.getOTPSettings().catch(() => ({ otp_length: 5 })),
        authApi.getCaptchaChallenge().catch(() => null),
      ]);

      if (otpSettingsResult.status === 'fulfilled' && otpSettingsResult.value?.otp_length) {
        setOtpLength(otpSettingsResult.value.otp_length);
      }

      if (captchaResult.status === 'fulfilled' && captchaResult.value) {
        setCaptchaId(captchaResult.value.captcha_id);
        setCaptchaDigits(captchaResult.value.digits);
      } else if (captchaResult.status === 'rejected') {
        showError(captchaResult.reason, { customMessage: msg.error("network") });
      }
    };

    fetchData();
  }, []);

  const handleMobileSubmitted = (mobileNumber: string, captchaIdValue: string, captchaAnswerValue: string) => {
    setMobile(mobileNumber);
    setCaptchaId(captchaIdValue);
    setCaptchaAnswer(captchaAnswerValue);
    // مستقیماً به صفحه رمز عبور می‌رویم
    setStep('password');
  };

  const handlePasswordLogin = async (mobile: string, password: string) => {
    if (!captchaId) {
      showError(new Error(msg.validation("captchaRequired")));
      await fetchCaptchaChallenge();
      return;
    }

    try {
      await login(mobile, password, captchaId, captchaAnswer);
      showSuccess(msg.auth("loginSuccess"));
    } catch (error) {
      if (error instanceof ApiError) {
        const backendMessage = error.response?.message || '';
        if (backendMessage.toLowerCase().includes('captcha') || backendMessage.toLowerCase().includes('کپتچا')) {
          await fetchCaptchaChallenge();
        }
      }
      throw error;
    }
  };

  const handleOTPLogin = async (mobile: string, otp: string) => {
    if (!captchaId) {
      showError(new Error(msg.validation("captchaRequired")));
      await fetchCaptchaChallenge();
      return;
    }

    try {
      await loginWithOTP(mobile, otp, captchaId, captchaAnswer);
      showSuccess(msg.auth("loginSuccess"));
    } catch (error) {
      if (error instanceof ApiError) {
        const backendMessage = error.response?.message || '';
        if (backendMessage.toLowerCase().includes('captcha') || backendMessage.toLowerCase().includes('کپتچا')) {
          await fetchCaptchaChallenge();
        }
      }
      throw error;
    }
  };

  const handleBackToMobile = () => {
    setStep('mobile');
    setMobile('');
  };

  const handleSwitchToPassword = () => {
    setStep('password');
    fetchCaptchaChallenge();
  };

  const handleBackToOTP = () => {
    setStep('otp');
  };

  if (step === 'mobile') {
    return (
      <MobileInputForm 
        onMobileSubmitted={handleMobileSubmitted}
        loading={authLoading}
        captchaId={captchaId}
        captchaDigits={captchaDigits}
        captchaLoading={captchaLoading}
        onCaptchaRefresh={fetchCaptchaChallenge}
      />
    );
  }

  return (
    <>
      {step === 'otp' && (
        <button
          type="button"
          onClick={handleBackToMobile}
          className="mb-4 flex items-center gap-2 text-sm text-font-s hover:text-font-p transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          بازگشت
        </button>
      )}

      <Suspense fallback={<FormSkeleton />}>
        {step === 'otp' ? (
          <OTPLoginForm
            mobile={mobile}
            onLogin={handleOTPLogin}
            onSwitchToPassword={handleSwitchToPassword}
            loading={authLoading}
            otpLength={otpLength}
          />
        ) : (
          <PasswordLoginForm
            mobile={mobile}
            onLogin={handlePasswordLogin}
            onSwitchToOTP={handleBackToOTP}
            loading={authLoading}
          />
        )}
      </Suspense>
    </>
  );
}
