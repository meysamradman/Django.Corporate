import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/elements/Button';
import { FormField, FormFieldInput } from '@/components/forms/FormField';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/elements/InputOtp';
import { otpLoginSchema, type OtpLoginForm } from './validations/loginSchema';
import { filterNumericOnly } from '@/core/filters/numeric';
import { validateMobile } from '@/core/validation/mobile';
import { msg } from '@/core/messages';
import { showSuccess, showError } from '@/core/toast';
import { Loader2 } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';
import { CaptchaField } from './CaptchaField';
import { useState, useEffect } from 'react';
import { authApi } from '@/api/auth';

interface OTPLoginFormProps {
  captchaId: string;
  captchaDigits: string;
  captchaLoading: boolean;
  onCaptchaRefresh: () => void;
  onLogin: (mobile: string, otp: string, captchaId: string, captchaAnswer: string) => Promise<void>;
  loading?: boolean;
  otpLength?: number;
}

export function OTPLoginForm({
  captchaId,
  captchaDigits,
  captchaLoading,
  onCaptchaRefresh,
  onLogin,
  loading = false,
  otpLength = 5,
}: OTPLoginFormProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  const form = useForm<OtpLoginForm>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: {
      mobile: '',
      otp: '',
      captcha_id: '',
      captcha_answer: '',
    },
  });

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (resendTimer > 0) {
      intervalId = setInterval(() => {
        setResendTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [resendTimer, otpSent]);

  const handleSendOTP = async () => {
    const mobile = form.getValues('mobile');
    
    const mobileValidation = validateMobile(mobile);
    if (!mobileValidation.isValid) {
      showError(new Error(mobileValidation.error || msg.validation("mobileInvalid")));
      return;
    }

    setIsSendingOTP(true);

    try {
      await authApi.sendOTP(mobile);
      setOtpSent(true);
      setResendTimer(60);
      showSuccess(msg.auth("otpSent"));
    } catch (error) {
      let errorMessage = msg.auth("otpSendFailed");
      
      if (error instanceof ApiError) {
        errorMessage = error.response?.message || msg.auth("otpSendFailed");
      } else if (error instanceof Error) {
        errorMessage = error.message || msg.auth("otpSendFailed");
      }
      
      showError(new Error(errorMessage));
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!otpSent) {
      showError(new Error(msg.validation("otpRequired")));
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin(data.mobile, data.otp, captchaId, data.captcha_answer);
      showSuccess(msg.auth("loginSuccess"));
    } catch (error) {
      let errorMessage = msg.auth("invalidCredentials");
      
      if (error instanceof ApiError) {
        const backendMessage = error.response?.message || '';
        
        if (backendMessage.toLowerCase().includes('captcha') || backendMessage.toLowerCase().includes('کپتچا')) {
          errorMessage = backendMessage || msg.validation("captchaRequired");
          onCaptchaRefresh();
          form.setValue('captcha_answer', '');
        } else {
          errorMessage = backendMessage || msg.auth("invalidCredentials");
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || msg.auth("invalidCredentials");
      }
      
      showError(new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  });

  const formatResendTimer = () => {
    const minutes = Math.floor(resendTimer / 60);
    const seconds = resendTimer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLoading = loading || isSubmitting || isSendingOTP || captchaLoading;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormFieldInput
        id="mobile"
        label="شماره موبایل"
        type="tel"
        placeholder="09123456789"
        maxLength={11}
        {...form.register("mobile", {
          onChange: (e) => {
            const filteredValue = filterNumericOnly(e.target.value);
            e.target.value = filteredValue;
            form.setValue("mobile", filteredValue);
          }
        })}
        error={form.formState.errors.mobile?.message}
        required
        disabled={isLoading}
        dir="ltr"
        className="text-start"
      />

      <FormField
        label="کد یکبار مصرف"
        error={form.formState.errors.otp?.message}
        required
        htmlFor="otp"
      >
        <div className="flex justify-center">
          <InputOTP
            maxLength={otpLength}
            value={form.watch("otp") || ''}
            onChange={(value: string) => {
              const filteredValue = filterNumericOnly(value);
              form.setValue("otp", filteredValue, { shouldValidate: true });
            }}
            disabled={isLoading}
            containerClassName="justify-center"
            className={form.formState.errors.otp ? "aria-invalid" : ""}
          >
            <InputOTPGroup>
              {Array.from({ length: otpLength }).map((_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      </FormField>

      <CaptchaField
        captchaId={captchaId}
        captchaDigits={captchaDigits}
        captchaLoading={captchaLoading}
        form={form}
        onRefresh={onCaptchaRefresh}
        disabled={isLoading}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleSendOTP}
          disabled={isLoading || resendTimer > 0}
          className="flex-1 h-11 font-semibold hover:bg-bg transition-all"
        >
          {resendTimer > 0 ? `ارسال مجدد (${formatResendTimer()})` : "ارسال کد"}
        </Button>
        <Button 
          type="submit" 
          className="flex-1 h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin ml-2" />
              در حال بارگذاری...
            </>
          ) : (
            'تأیید کد'
          )}
        </Button>
      </div>
    </form>
  );
}

