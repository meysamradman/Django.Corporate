import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ChevronLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

import { authApi } from '@/api/auth/auth';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Alert, AlertDescription } from '@/components/elements/Alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/elements/InputOtp';
import { CaptchaField } from './CaptchaField';
import { FormField, FormFieldInput } from '@/components/shared/FormField';
import { msg } from '@/core/messages';
import { notifyApiError, extractFieldErrors, showSuccess } from '@/core/toast';
import { filterNumericOnly } from '@/core/utils/numeric';
import { validateMobile } from '@/core/validation/mobile';
import { ApiError } from '@/types/api/apiError';
import { AUTH_UI_CONFIG } from '@/core/config/auth';

type ResetStep = 'request' | 'verify' | 'confirm';

const requestSchema = z.object({
  mobile: z.string().superRefine((val, ctx) => {
    const result = validateMobile(val);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || msg.validation('mobileInvalid'),
      });
    }
  }),
  captcha_id: z.string().min(1, msg.validation('captchaRequired')),
  captcha_answer: z.string().min(1, msg.validation('captchaRequired')),
});

const verifySchema = z.object({
  mobile: z.string().superRefine((val, ctx) => {
    const result = validateMobile(val);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || msg.validation('mobileInvalid'),
      });
    }
  }),
  otp_code: z.string().min(1, msg.validation('otpRequired')),
});

const confirmSchema = z.object({
  mobile: z.string().superRefine((val, ctx) => {
    const result = validateMobile(val);
    if (!result.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error || msg.validation('mobileInvalid'),
      });
    }
  }),
  reset_token: z.string().min(1, msg.error('unknown')),
  new_password: z
    .string()
    .min(8, msg.validation('passwordMinLength'))
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, msg.validation('passwordComplexity')),
  confirm_password: z.string().min(1, msg.validation('passwordRequired')),
}).superRefine((data, ctx) => {
  if (data.new_password !== data.confirm_password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تکرار رمز عبور با رمز عبور جدید یکسان نیست',
      path: ['confirm_password'],
    });
  }
});

type RequestForm = z.infer<typeof requestSchema>;
type VerifyForm = z.infer<typeof verifySchema>;
type ConfirmForm = z.infer<typeof confirmSchema>;

interface AdminPasswordResetFormProps {
  mobile: string;
  initialCaptchaId?: string;
  initialCaptchaDigits?: string;
  initialCaptchaAnswer?: string;
  otpLength?: number;
  resendSeconds?: number;
  loading?: boolean;
  onBack: () => void;
  onCompleted: (mobile: string) => void;
}

function AdminPasswordResetForm({
  mobile,
  initialCaptchaId,
  initialCaptchaDigits,
  initialCaptchaAnswer,
  otpLength = AUTH_UI_CONFIG.defaultOtpLength,
  resendSeconds = AUTH_UI_CONFIG.otpResendSeconds,
  loading = false,
  onBack,
  onCompleted,
}: AdminPasswordResetFormProps) {
  const [step, setStep] = useState<ResetStep>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState(initialCaptchaId || '');
  const [captchaDigits, setCaptchaDigits] = useState(initialCaptchaDigits || '');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const autoRequestTriedRef = useRef(false);

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      mobile,
      captcha_id: initialCaptchaId || '',
      captcha_answer: initialCaptchaAnswer || '',
    },
  });

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      mobile,
      otp_code: '',
    },
  });

  const confirmForm = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      mobile,
      reset_token: '',
      new_password: '',
      confirm_password: '',
    },
  });

  useEffect(() => {
    requestForm.setValue('mobile', mobile);
    verifyForm.setValue('mobile', mobile);
    confirmForm.setValue('mobile', mobile);
  }, [mobile, requestForm, verifyForm, confirmForm]);

  const fetchCaptchaChallenge = async () => {
    setCaptchaLoading(true);
    try {
      const { captcha_id, digits } = await authApi.getCaptchaChallenge();
      setCaptchaId(captcha_id);
      setCaptchaDigits(digits);
      requestForm.setValue('captcha_id', captcha_id, { shouldValidate: true });
      requestForm.setValue('captcha_answer', '', { shouldValidate: false });
    } catch (error) {
      notifyApiError(error, {
        fallbackMessage: msg.error('network'),
        preferBackendMessage: false,
        dedupeKey: 'auth-reset-captcha-fetch-error',
      });
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    if (resetToken) {
      confirmForm.setValue('reset_token', resetToken, { shouldValidate: true });
    }
  }, [resetToken, confirmForm]);

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
  }, [resendTimer]);

  const isLoading = loading || isSubmitting;

  const requestOtp = async (data: RequestForm) => {
    await authApi.requestAdminPasswordResetOtp({
      mobile: data.mobile,
      captcha_id: data.captcha_id,
      captcha_answer: data.captcha_answer,
    });

    showSuccess(msg.auth('resetOtpSent'));
    setStep('verify');
    setResendTimer(resendSeconds);
  };

  const formatResendTimer = () => {
    const minutes = Math.floor(resendTimer / 60);
    const seconds = resendTimer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const autoRequest = async () => {
      if (autoRequestTriedRef.current) {
        return;
      }
      autoRequestTriedRef.current = true;

      if (!mobile || !initialCaptchaId || !initialCaptchaAnswer) {
        if (!captchaId) {
          await fetchCaptchaChallenge();
        }
        return;
      }

      setFormAlert(null);
      setIsSubmitting(true);

      try {
        await requestOtp({
          mobile,
          captcha_id: initialCaptchaId,
          captcha_answer: initialCaptchaAnswer,
        });
      } catch (error) {
        const backendMessage = error instanceof ApiError ? (error.response?.message || '').toLowerCase() : '';
        if (backendMessage.includes('captcha') || backendMessage.includes('کپتچا')) {
          setFormAlert(null);
          await fetchCaptchaChallenge();
          requestForm.setValue('captcha_answer', '', { shouldValidate: false });
          setStep('request');
        } else if (error instanceof ApiError && error.response?.AppStatusCode && error.response.AppStatusCode < 500) {
          setFormAlert(error.response?.message || msg.auth('otpSendFailed'));
          setStep('request');
        } else {
          notifyApiError(error, {
            fallbackMessage: msg.error('serverError'),
            preferBackendMessage: false,
            dedupeKey: 'auth-reset-auto-request-system-error',
          });
          setStep('request');
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    void autoRequest();
  }, []);

  const applyFieldErrors = (
    error: unknown,
    setError: (field: string, message: string) => void,
    fieldMap?: Record<string, string>
  ): boolean => {
    const extracted = extractFieldErrors(error);
    let hasAny = false;

    Object.entries(extracted).forEach(([field, message]) => {
      if (field === 'non_field_errors') return;
      hasAny = true;
      const mappedField = fieldMap?.[field] || field;
      setError(mappedField, message);
    });

    if (extracted.non_field_errors) {
      setFormAlert(extracted.non_field_errors);
      hasAny = true;
    }

    return hasAny;
  };

  const handleRequestSubmit = requestForm.handleSubmit(async (data) => {
    setFormAlert(null);

    if (!captchaId) {
      setFormAlert(msg.validation('captchaRequired'));
      void fetchCaptchaChallenge();
      return;
    }

    setIsSubmitting(true);
    try {
      await requestOtp(data);
    } catch (error) {
      const handled = applyFieldErrors(
        error,
        (field, message) => requestForm.setError(field as keyof RequestForm, { type: 'server', message })
      );
      if (handled) return;

      if (error instanceof ApiError && error.response?.AppStatusCode && error.response.AppStatusCode < 500) {
        const backendMessage = (error.response?.message || '').toLowerCase();
        if (backendMessage.includes('captcha') || backendMessage.includes('کپتچا')) {
          requestForm.setValue('captcha_answer', '', { shouldValidate: false });
        }
        setFormAlert(error.response?.message || msg.auth('otpSendFailed'));
        return;
      }

      notifyApiError(error, {
        fallbackMessage: msg.error('serverError'),
        preferBackendMessage: false,
        dedupeKey: 'auth-reset-request-system-error',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleVerifySubmit = verifyForm.handleSubmit(async (data) => {
    setFormAlert(null);

    if (!data.otp_code || data.otp_code.length !== otpLength) {
      verifyForm.setError('otp_code', {
        type: 'manual',
        message: msg.validation('otpRequired'),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authApi.verifyAdminPasswordResetOtp({
        mobile: data.mobile,
        otp_code: data.otp_code,
      });

      setResetToken(result.reset_token);
      setStep('confirm');
    } catch (error) {
      const handled = applyFieldErrors(
        error,
        (field, message) => verifyForm.setError(field as keyof VerifyForm, { type: 'server', message }),
        { otp: 'otp_code' }
      );
      if (handled) return;

      if (error instanceof ApiError && error.response?.AppStatusCode && error.response.AppStatusCode < 500) {
        setFormAlert(error.response?.message || msg.auth('invalidOTP'));
        return;
      }

      notifyApiError(error, {
        fallbackMessage: msg.error('serverError'),
        preferBackendMessage: false,
        dedupeKey: 'auth-reset-verify-system-error',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleResendFromVerify = async () => {
    if (resendTimer > 0 || isLoading) {
      return;
    }

    setFormAlert(null);
    setIsSubmitting(true);

    try {
      await requestOtp({
        mobile: verifyForm.getValues('mobile'),
        captcha_id: '',
        captcha_answer: '',
      });
      verifyForm.setValue('otp_code', '', { shouldValidate: false });
      setStep('verify');
    } catch (error) {
      if (error instanceof ApiError && error.response?.AppStatusCode && error.response.AppStatusCode < 500) {
        const backendMessage = (error.response?.message || '').toLowerCase();
        if (backendMessage.includes('captcha') || backendMessage.includes('کپتچا')) {
          requestForm.setValue('captcha_answer', '', { shouldValidate: false });
          await fetchCaptchaChallenge();
          setStep('request');
        }
        setFormAlert(error.response?.message || msg.auth('otpSendFailed'));
        return;
      }

      notifyApiError(error, {
        fallbackMessage: msg.error('serverError'),
        preferBackendMessage: false,
        dedupeKey: 'auth-reset-resend-system-error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = confirmForm.handleSubmit(async (data) => {
    setFormAlert(null);
    setIsSubmitting(true);
    try {
      await authApi.confirmAdminPasswordReset({
        mobile: data.mobile,
        reset_token: data.reset_token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });

      showSuccess(msg.auth('passwordResetSuccess'));
      onCompleted(data.mobile);
    } catch (error) {
      const handled = applyFieldErrors(
        error,
        (field, message) => confirmForm.setError(field as keyof ConfirmForm, { type: 'server', message })
      );
      if (handled) return;

      if (error instanceof ApiError && error.response?.AppStatusCode && error.response.AppStatusCode < 500) {
        setFormAlert(error.response?.message || msg.auth('loginFailed'));
        return;
      }

      notifyApiError(error, {
        fallbackMessage: msg.error('serverError'),
        preferBackendMessage: false,
        dedupeKey: 'auth-reset-confirm-system-error',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-font-s hover:text-font-p transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
        بازگشت به ورود
      </button>

      {formAlert ? (
        <Alert variant="destructive" className="border-red-1/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formAlert}</AlertDescription>
        </Alert>
      ) : null}

      {step === 'request' && (
        <form onSubmit={handleRequestSubmit} noValidate className="space-y-5">
          <div className="text-sm text-font-s">
            بازیابی رمز عبور برای شماره <span className="font-medium text-font-p">{requestForm.watch('mobile')}</span>
          </div>

          <FormFieldInput
            id="reset-mobile"
            label="شماره موبایل"
            type="tel"
            placeholder="09123456789"
            maxLength={11}
            {...requestForm.register('mobile', {
              onChange: (event) => {
                const filtered = filterNumericOnly(event.target.value);
                event.target.value = filtered;
                requestForm.setValue('mobile', filtered);
              },
            })}
            error={requestForm.formState.errors.mobile?.message}
            required
            disabled
            readOnly
            dir="ltr"
            className="text-start h-11 bg-bg"
          />

          <CaptchaField
            captchaId={captchaId}
            captchaDigits={captchaDigits}
            captchaLoading={captchaLoading}
            form={requestForm}
            onRefresh={fetchCaptchaChallenge}
            disabled={isLoading}
          />

          <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                در حال ارسال...
              </>
            ) : (
              'ارسال کد بازیابی'
            )}
          </Button>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerifySubmit} noValidate className="space-y-5">
          <div className="mb-2 text-sm text-font-s">
            کد ارسال‌شده به <span className="font-medium text-font-p">{verifyForm.watch('mobile')}</span> را وارد کنید
          </div>

          <FormField label="کد یکبار مصرف *" error={verifyForm.formState.errors.otp_code?.message} required htmlFor="reset-otp">
            <div className="flex justify-center">
              <InputOTP
                maxLength={otpLength}
                value={verifyForm.watch('otp_code') || ''}
                onChange={(value) => {
                  const filtered = filterNumericOnly(value);
                  verifyForm.setValue('otp_code', filtered, { shouldValidate: true });
                }}
                disabled={isLoading}
                containerClassName="justify-center"
                className={verifyForm.formState.errors.otp_code ? 'aria-invalid' : ''}
              >
                <InputOTPGroup>
                  {Array.from({ length: otpLength }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </FormField>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendFromVerify}
              disabled={isLoading || resendTimer > 0}
              className="flex-1 h-12 rounded-lg"
            >
              {resendTimer > 0 ? `ارسال مجدد (${formatResendTimer()})` : 'ارسال مجدد کد'}
            </Button>
            <Button type="submit" className="flex-1 h-12 rounded-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  در حال بررسی...
                </>
              ) : (
                'تایید کد'
              )}
            </Button>
          </div>

          {resendTimer > 0 && (
            <p className="text-xs text-center text-font-s">
              {formatResendTimer()} مانده تا ارسال مجدد کد
            </p>
          )}
        </form>
      )}

      {step === 'confirm' && (
        <form onSubmit={handleConfirmSubmit} noValidate className="space-y-5">
          <FormField
            label="رمز عبور جدید"
            error={confirmForm.formState.errors.new_password?.message}
            required
            htmlFor="new-password"
          >
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="رمز عبور جدید را وارد کنید"
                {...confirmForm.register('new_password')}
                disabled={isLoading}
                className={`h-11 pr-10 ${confirmForm.formState.errors.new_password ? 'border-red-1 focus-visible:ring-red-1' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-font-s hover:text-font-p"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <FormField
            label="تکرار رمز عبور جدید"
            error={confirmForm.formState.errors.confirm_password?.message}
            required
            htmlFor="confirm-password"
          >
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="تکرار رمز عبور جدید"
                {...confirmForm.register('confirm_password')}
                disabled={isLoading}
                className={`h-11 pr-10 ${confirmForm.formState.errors.confirm_password ? 'border-red-1 focus-visible:ring-red-1' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-font-s hover:text-font-p"
                tabIndex={-1}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                در حال ذخیره...
              </>
            ) : (
              'تغییر رمز عبور'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

export default AdminPasswordResetForm;
