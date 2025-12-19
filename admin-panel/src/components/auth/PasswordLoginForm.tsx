import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { FormField } from '@/components/forms/FormField';
import { passwordLoginSchema, type PasswordLoginForm } from './validations/loginSchema';
import { z } from 'zod';
import { msg } from '@/core/messages';
import { showError } from '@/core/toast';
import { Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react';
import type { ApiError } from '@/types/api/apiError';
import { useState, useEffect } from 'react';

interface PasswordLoginFormProps {
  mobile: string;
  onLogin: (mobile: string, password: string) => Promise<void>;
  onSwitchToOTP?: () => void;
  loading?: boolean;
}

function PasswordLoginForm({
  mobile,
  onLogin,
  onSwitchToOTP,
  loading = false,
}: PasswordLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin(data.mobile, data.password);
    } catch (error) {
      if (error instanceof ApiError) {
        const backendMessage = error.response?.message || '';
        if (backendMessage.toLowerCase().includes('captcha') || backendMessage.toLowerCase().includes('کپتچا')) {
          form.setValue('captcha_answer', '');
        }
      }
      showError(error, { customMessage: msg.auth("invalidCredentials") });
    } finally {
      setIsSubmitting(false);
    }
  });

  const isLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
            className={`h-11 ${form.watch("password") ? "pr-10" : "pr-3"} [&::placeholder]:pr-0 [&::placeholder]:text-right ${form.formState.errors.password ? "border-red-1 focus-visible:ring-red-1" : ""}`}
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

