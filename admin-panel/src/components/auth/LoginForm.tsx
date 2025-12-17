import { useState, useEffect, lazy, Suspense } from 'react';
import { Label } from '@/components/elements/Label';
import { RadioGroup, RadioGroupItem } from '@/components/elements/RadioGroup';
import { Skeleton } from '@/components/elements/Skeleton';
import { useAuth } from '@/core/auth/AuthContext';
import { showError } from '@/core/toast';
import { msg } from '@/core/messages';
import { authApi } from '@/api/auth';

const PasswordLoginForm = lazy(() => import('./PasswordLoginForm').then(module => ({ default: module.PasswordLoginForm })));
const OTPLoginForm = lazy(() => import('./OTPLoginForm').then(module => ({ default: module.OTPLoginForm })));

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

export function LoginForm() {
  const { login, loginWithOTP, isLoading: authLoading } = useAuth();
  
  const [loginType, setLoginType] = useState('password');
  const [otpLength, setOtpLength] = useState(5);
  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaDigits, setCaptchaDigits] = useState<string>('');
  const [captchaLoading, setCaptchaLoading] = useState<boolean>(true);

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
    const fetchOTPSettings = async () => {
      try {
        const settings = await authApi.getOTPSettings();
        if (settings?.otp_length) {
          setOtpLength(settings.otp_length);
        }
      } catch (error) {
        setOtpLength(5);
      }
    };

    fetchOTPSettings();
    fetchCaptchaChallenge();
  }, []);

  const handlePasswordLogin = async (mobile: string, password: string, captchaId: string, captchaAnswer: string) => {
    await login(mobile, password, captchaId, captchaAnswer);
  };

  const handleOTPLogin = async (mobile: string, otp: string, captchaId: string, captchaAnswer: string) => {
    await loginWithOTP(mobile, otp, captchaId, captchaAnswer);
  };

  return (
    <>
      <div className="mb-8">
        <RadioGroup
          defaultValue="password"
          value={loginType}
          onValueChange={setLoginType}
          className="flex gap-6 bg-bg/50 p-1 rounded-lg"
        >
          <div className="flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-md transition-all cursor-pointer hover:bg-bg/80 data-[state=checked]:bg-card data-[state=checked]:shadow-sm">
            <RadioGroupItem value="password" id="password" className="data-[state=checked]:border-primary"/>
            <Label htmlFor="password" className="cursor-pointer font-medium text-sm">رمز عبور</Label>
          </div>
          <div className="flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-md transition-all cursor-pointer hover:bg-bg/80 data-[state=checked]:bg-card data-[state=checked]:shadow-sm">
            <RadioGroupItem value="otp" id="otp" className="data-[state=checked]:border-primary"/>
            <Label htmlFor="otp" className="cursor-pointer font-medium text-sm">کد یکبار مصرف</Label>
          </div>
        </RadioGroup>
      </div>

      {loginType === 'password' ? (
        <Suspense fallback={<FormSkeleton />}>
          <PasswordLoginForm
            captchaId={captchaId}
            captchaDigits={captchaDigits}
            captchaLoading={captchaLoading}
            onCaptchaRefresh={fetchCaptchaChallenge}
            onLogin={handlePasswordLogin}
            loading={authLoading}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<FormSkeleton />}>
          <OTPLoginForm
            captchaId={captchaId}
            captchaDigits={captchaDigits}
            captchaLoading={captchaLoading}
            onCaptchaRefresh={fetchCaptchaChallenge}
            onLogin={handleOTPLogin}
            loading={authLoading}
            otpLength={otpLength}
          />
        </Suspense>
      )}
    </>
  );
}
