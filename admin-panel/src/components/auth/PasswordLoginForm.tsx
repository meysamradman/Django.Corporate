import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { FormField, FormFieldInput } from '@/components/forms/FormField';
import { passwordLoginSchema, type PasswordLoginForm } from './validations/loginSchema';
import { filterNumericOnly } from '@/core/filters/numeric';
import { msg } from '@/core/messages';
import { showSuccess, showError } from '@/core/toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';
import { CaptchaField } from './CaptchaField';
import { useState } from 'react';

interface PasswordLoginFormProps {
  captchaId: string;
  captchaDigits: string;
  captchaLoading: boolean;
  onCaptchaRefresh: () => void;
  onLogin: (mobile: string, password: string, captchaId: string, captchaAnswer: string) => Promise<void>;
  loading?: boolean;
}

export function PasswordLoginForm({
  captchaId,
  captchaDigits,
  captchaLoading,
  onCaptchaRefresh,
  onLogin,
  loading = false,
}: PasswordLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PasswordLoginForm>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      mobile: '',
      password: '',
      captcha_id: '',
      captcha_answer: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!captchaId) {
      showError(new Error(msg.validation("captchaRequired")));
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin(data.mobile, data.password, captchaId, data.captcha_answer);
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

  const isLoading = loading || isSubmitting || captchaLoading;

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
            className={form.formState.errors.password ? "border-red-1 focus-visible:ring-red-1 pr-10" : "pr-10"}
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

      <CaptchaField
        captchaId={captchaId}
        captchaDigits={captchaDigits}
        captchaLoading={captchaLoading}
        form={form}
        onRefresh={onCaptchaRefresh}
        disabled={isLoading}
      />

      <Button 
        type="submit" 
        className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin ml-2" />
            در حال بارگذاری...
          </>
        ) : (
          "ورود"
        )}
      </Button>
    </form>
  );
}

