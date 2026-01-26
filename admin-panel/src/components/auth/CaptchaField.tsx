import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { FormField } from '@/components/shared/FormField';
import { Loader2, RotateCw } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { filterNumericOnly } from '@/core/filters/numeric';

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
      label="کد کپچا را وارد کنید"
      error={form.formState.errors[fieldName]?.message as string | undefined}
      required
    >
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            id="captchaAnswer"
            type="tel"
            {...form.register(fieldName, {
              onChange: (e) => {
                const filteredValue = filterNumericOnly(e.target.value);
                e.target.value = filteredValue;
                form.setValue(fieldName, filteredValue);
              }
            })}
            className={`h-11 text-start ${form.formState.errors[fieldName] ? "border-red-1 focus-visible:ring-red-1" : ""}`}
            disabled={disabled || captchaLoading}
            dir="ltr"
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={captchaLoading || disabled}
          className="shrink-0 h-11 w-11 rounded-lg hover:bg-bg transition-all"
        >
          {captchaLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <RotateCw className="h-5 w-5 text-font-p hover:text-primary transition-colors" />
          )}
        </Button>
        {captchaDigits && (
          <div className="flex items-center justify-center h-11 min-w-[100px] px-4 bg-transparent border-2 border-primary rounded-lg font-mono text-2xl font-bold text-primary select-none">
            {captchaDigits}
          </div>
        )}
      </div>
    </FormField>
  );
}

