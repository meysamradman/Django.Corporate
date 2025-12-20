import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/elements/Button';
import { FormFieldInput } from '@/components/forms/FormField';
import { CaptchaField } from './CaptchaField';
import { z } from 'zod';
import { filterNumericOnly } from '@/core/filters/numeric';
import { validateMobile } from '@/core/validation/mobile';
import { msg } from '@/core/messages';
import { showError } from '@/core/toast';
import { Loader2 } from 'lucide-react';

const mobileSchema = z.object({
  mobile: z.string().min(11, msg.validation("mobileInvalid")).max(11, msg.validation("mobileInvalid")),
  captcha_id: z.string().min(1, msg.validation("captchaRequired")),
  captcha_answer: z.string().min(1, msg.validation("captchaRequired")),
});

type MobileForm = z.infer<typeof mobileSchema>;

interface MobileInputFormProps {
  onMobileSubmitted: (mobile: string, captchaId: string, captchaAnswer: string) => void;
  loading?: boolean;
  captchaId: string;
  captchaDigits: string;
  captchaLoading: boolean;
  onCaptchaRefresh: () => void;
}

export function MobileInputForm({ 
  onMobileSubmitted,
  loading = false,
  captchaId,
  captchaDigits,
  captchaLoading,
  onCaptchaRefresh,
}: MobileInputFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MobileForm>({
    resolver: zodResolver(mobileSchema),
    defaultValues: {
      mobile: '',
      captcha_id: '',
      captcha_answer: '',
    },
  });

  useEffect(() => {
    if (captchaId) {
      form.setValue('captcha_id', captchaId, { shouldValidate: true });
    }
  }, [captchaId, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!captchaId) {
      showError(new Error(msg.validation("captchaRequired")));
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const mobileValidation = validateMobile(data.mobile);
    if (!mobileValidation.isValid) {
      form.setError("mobile", {
        type: "manual",
        message: mobileValidation.error || msg.validation("mobileInvalid"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onMobileSubmitted(data.mobile, data.captcha_id, data.captcha_answer);
    } catch (error) {
      showError(error, { customMessage: msg.auth("otpSendFailed") });
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
        className="text-start h-11"
      />

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
        className="w-full h-12 text-base font-semibold rounded-lg mt-6" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin ml-2" />
            در حال ارسال...
          </>
        ) : (
          "ادامه"
        )}
      </Button>
    </form>
  );
}

