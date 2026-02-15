import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/elements/Button';
import { FormField } from "@/components/shared/FormField";
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/elements/InputOtp';
import { otpLoginSchema, type OtpLoginForm } from './validations/loginSchema';
import { filterNumericOnly } from '@/core/utils/numeric';
import { msg } from '@/core/messages';
import { z } from 'zod';
import { Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';
import { useState, useEffect } from 'react';
import { notifyApiError } from '@/core/toast';
import { Alert, AlertDescription } from '@/components/elements/Alert';
import { authApi } from '@/api/auth/auth';
import { extractMappedLoginFieldErrors, LOGIN_OTP_FIELD_MAP } from './validations/loginApiError';
import { AUTH_UI_CONFIG } from '@/core/config/auth';

interface OTPLoginFormProps {
  mobile: string;
  onLogin: (mobile: string, otp: string) => Promise<void>;
  onSwitchToPassword?: () => void;
  loading?: boolean;
  otpLength?: number;
  resendSeconds?: number;
  onCaptchaInvalid?: () => void;
}

function OTPLoginForm({
  mobile,
  onLogin,
  onSwitchToPassword,
  onCaptchaInvalid,
  loading = false,
  otpLength = AUTH_UI_CONFIG.defaultOtpLength,
  resendSeconds = AUTH_UI_CONFIG.otpResendSeconds,
}: OTPLoginFormProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);

  const otpSchemaWithoutCaptcha = otpLoginSchema.extend({
    captcha_id: z.string().optional(),
    captcha_answer: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(otpSchemaWithoutCaptcha),
    defaultValues: {
      mobile: mobile,
      otp: '',
      captcha_id: '',
      captcha_answer: '',
    },
  });

  useEffect(() => {
    form.setValue('mobile', mobile);
  }, [mobile, form]);

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
    setIsSendingOTP(true);

    try {
      await authApi.sendOTP(mobile);
      setOtpSent(true);
      setResendTimer(resendSeconds);
    } catch (error) {
      notifyApiError(error, { customMessage: msg.auth("otpSendFailed") });
    } finally {
      setIsSendingOTP(false);
    }
  };

  useEffect(() => {
    if (mobile) {
      setOtpSent(true);
      setResendTimer(resendSeconds);
    }
  }, [mobile, resendSeconds]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setFormAlert(null);
    if (!otpSent) {
      setFormAlert(msg.validation("otpRequired"));
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin(data.mobile, data.otp);
    } catch (error) {
      const { fieldErrors, nonFieldError } = extractMappedLoginFieldErrors(
        error,
        LOGIN_OTP_FIELD_MAP as unknown as Record<string, string>
      );

      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof OtpLoginForm, {
            type: 'server',
            message,
          });
        });

        if (fieldErrors.captcha_answer || fieldErrors.captcha_id) {
          setFormAlert(fieldErrors.captcha_answer || fieldErrors.captcha_id);
          onCaptchaInvalid?.();
        }

        return;
      }

      if (nonFieldError) {
        setFormAlert(nonFieldError);
        return;
      }

      if (error instanceof ApiError) {
        const statusCode = error.response?.AppStatusCode;
        const backendMessage = (error.response?.message || '').toLowerCase();

        if (backendMessage.includes('captcha') || backendMessage.includes('کپتچا')) {
          onCaptchaInvalid?.();
          setFormAlert(error.response?.message || msg.validation('captchaRequired'));
          return;
        }

        if (statusCode && statusCode < 500) {
          setFormAlert(error.response?.message || msg.auth('invalidOTP'));
          return;
        }
      }

      notifyApiError(error, {
        fallbackMessage: msg.error('serverError'),
        preferBackendMessage: false,
        dedupeKey: 'auth-otp-system-error',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const formatResendTimer = () => {
    const minutes = Math.floor(resendTimer / 60);
    const seconds = resendTimer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLoading = loading || isSubmitting || isSendingOTP;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formAlert ? (
        <Alert variant="destructive" className="border-red-1/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formAlert}</AlertDescription>
        </Alert>
      ) : null}
      <div className="mb-4">
        <p className="text-sm text-font-s">
          کد تایید برای شماره <span className="font-medium text-font-p">{mobile}</span> پیامک شد
        </p>
      </div>

      <FormField
        label="کد یکبار مصرف *"
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

      <div className="space-y-3">
        {onSwitchToPassword && (
          <button
            type="button"
            onClick={onSwitchToPassword}
            className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            ورود با رمز عبور
          </button>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSendOTP}
            disabled={isLoading || resendTimer > 0}
            className="flex-1 h-12 font-semibold rounded-lg hover:bg-bg transition-all"
          >
            {resendTimer > 0 ? `ارسال مجدد (${formatResendTimer()})` : "ارسال کد"}
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 text-base font-semibold rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                در حال بارگذاری...
              </>
            ) : (
              'تأیید'
            )}
          </Button>
        </div>

        {resendTimer > 0 && (
          <p className="text-xs text-center text-font-s">
            {formatResendTimer()} مانده تا دریافت مجدد کد
          </p>
        )}
      </div>
    </form>
  );
}

export default OTPLoginForm;

