import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { FormField } from '@/components/forms/FormField';
import { Loader2, RotateCw } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

interface CaptchaFieldProps {
  captchaId: string;
  captchaDigits: string;
  captchaLoading: boolean;
  form: UseFormReturn<any>;
  fieldName?: string;
  onRefresh: () => void;
  disabled?: boolean;
}

export function CaptchaField({
  captchaId,
  captchaDigits,
  captchaLoading,
  form,
  fieldName = 'captcha_answer',
  onRefresh,
  disabled = false,
}: CaptchaFieldProps) {
  if (!captchaId) return null;

  return (
    <FormField
      error={form.formState.errors[fieldName]?.message as string | undefined}
      required
    >
      <div className="flex items-center gap-3">
        {captchaDigits && (
          <div className="flex items-center justify-center h-11 min-w-[100px] px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-bg border-2 border-primary/20 rounded-lg font-mono text-2xl font-bold text-primary select-none shadow-sm">
            {captchaDigits}
          </div>
        )}
        <div className="flex-1">
          <Input
            id="captchaAnswer"
            type="text"
            placeholder="کد کپچا را وارد کنید"
            {...form.register(fieldName)}
            className={form.formState.errors[fieldName] ? "border-red-1" : ""}
            disabled={disabled || captchaLoading}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={captchaLoading || disabled}
          className="shrink-0 h-11 w-11 hover:bg-primary/10 hover:border-primary/30 transition-all"
        >
          {captchaLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <RotateCw className="h-5 w-5 text-font-p hover:text-primary transition-colors" />
          )}
        </Button>
      </div>
    </FormField>
  );
}

