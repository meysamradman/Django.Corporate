import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { FormField } from '@/components/shared/FormField';
import { Alert, AlertDescription } from '@/components/elements/Alert';
import { passwordLoginSchema, type PasswordLoginForm } from './validations/loginSchema';
import { extractMappedLoginFieldErrors, LOGIN_PASSWORD_FIELD_MAP } from './validations/loginApiError';
import { z } from 'zod';
import { msg } from '@/core/messages';
import { notifyApiError } from '@/core/toast';
import { Eye, EyeOff, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';
import { useState, useEffect } from 'react';

interface PasswordLoginFormProps {
  mobile: string;
  onLogin: (mobile: string, password: string) => Promise<void>;
  onSwitchToOTP?: () => void;
  onCaptchaInvalid?: () => void;
  loading?: boolean;
}

function PasswordLoginForm({
  mobile,
  onLogin,
  onSwitchToOTP,
  onCaptchaInvalid,
  loading = false,
}: PasswordLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formAlert, setFormAlert] = useState<string | null>(null);

  const passwordSchemaWithoutCaptcha = passwordLoginSchema.extend({
    captcha_id: z.string().optional(),
    captcha_answer: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(passwordSchemaWithoutCaptcha),
    defaultValues: {
      mobile: mobile,
      password: '',
      captcha_id: '',
      captcha_answer: '',
    },
  });

  useEffect(() => {
    form.setValue('mobile', mobile);
  }, [mobile, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setFormAlert(null);
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin(data.mobile, data.password);
    } catch (error) {
      const { fieldErrors, nonFieldError } = extractMappedLoginFieldErrors(
        error,
        LOGIN_PASSWORD_FIELD_MAP as unknown as Record<string, string>
      );

      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as keyof PasswordLoginForm, {
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
          setFormAlert(error.response?.message || msg.auth('invalidPassword'));
          return;
        }
      }

      notifyApiError(error, {
        fallbackMessage: msg.error('serverError'),
        preferBackendMessage: false,
        dedupeKey: 'auth-password-system-error',
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const isLoading = loading || isSubmitting;

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
          ورود با رمز عبور برای شماره <span className="font-medium text-font-p">{mobile}</span>
        </p>
      </div>

      <FormField
        label="رمز عبور"
        error={form.formState.errors.password?.message}
        required
        htmlFor="password"
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="رمز عبور خود را وارد کنید"
            {...form.register("password")}
            disabled={isLoading}
            className={`h-11 ${form.watch("password") ? "pr-10" : "pr-3"} placeholder:pr-0 placeholder:text-right ${form.formState.errors.password ? "border-red-1 focus-visible:ring-red-1" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-font-s hover:text-font-p transition-colors"
            tabIndex={-1}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </FormField>

      {onSwitchToOTP && (
        <button
          type="button"
          onClick={onSwitchToOTP}
          className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          ورود با کد یکبار مصرف
        </button>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold rounded-lg mt-6" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin ml-2" />
            در حال بارگذاری...
          </>
        ) : (
          "تایید"
        )}
      </Button>
    </form>
  );
}

export default PasswordLoginForm;

