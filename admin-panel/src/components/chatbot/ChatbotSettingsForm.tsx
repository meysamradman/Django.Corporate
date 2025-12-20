import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useChatbotSettings, useUpdateChatbotSettings } from "@/components/ai/chatbot/hooks/useChatbot";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/elements/Form";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Button } from "@/components/elements/Button";
import { Switch } from "@/components/elements/Switch";
import { Skeleton } from "@/components/elements/Skeleton";
import { Settings as SettingsIcon, Save, MessageSquare, Zap } from "lucide-react";
import { ProtectedButton } from "@/core/permissions";

const formSchema = z.object({
  is_enabled: z.boolean(),
  welcome_message: z.string().min(1, "پیام خوش‌آمدگویی الزامی است").max(500),
  default_message: z.string().min(1, "پیام پیش‌فرض الزامی است").max(500),
  rate_limit_per_minute: z.number().int().min(1).max(100),
});

type FormValues = z.infer<typeof formSchema>;

export function ChatbotSettingsForm() {
  const { data: settings, isLoading } = useChatbotSettings();
  const updateSettings = useUpdateChatbotSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_enabled: true,
      welcome_message: "سلام! چطور می‌تونم کمکتون کنم؟",
      default_message: "متأسفانه متوجه نشدم. لطفاً سوال خود را واضح‌تر بپرسید یا با پشتیبانی تماس بگیرید.",
      rate_limit_per_minute: 5,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        is_enabled: settings.is_enabled,
        welcome_message: settings.welcome_message,
        default_message: settings.default_message,
        rate_limit_per_minute: settings.rate_limit_per_minute,
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: FormValues) => {
    await updateSettings.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          تنظیمات چت‌بات
        </CardTitle>
        <CardDescription>
          تنظیمات مربوط به چت‌بات Rule-Based وب‌سایت
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-bg/50">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      فعال بودن چت‌بات
                    </FormLabel>
                    <FormDescription>
                      چت‌بات در وب‌سایت نمایش داده شود
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="welcome_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      پیام خوش‌آمدگویی
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="سلام! چطور می‌تونم کمکتون کنم؟"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      پیامی که هنگام باز کردن چت‌بات نمایش داده می‌شود
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>پیام پیش‌فرض</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="متأسفانه متوجه نشدم..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      پیامی که وقتی پاسخ پیدا نشد نمایش داده می‌شود
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rate_limit_per_minute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>محدودیت درخواست در دقیقه</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                    />
                  </FormControl>
                  <FormDescription>
                    تعداد درخواست مجاز در هر دقیقه برای هر IP (پیشنهاد: 5)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4 border-t border-br">
              <ProtectedButton
                type="submit"
                permission="chatbot.manage"
                disabled={updateSettings.isPending}
              >
                <Save className="h-4 w-4" />
                {updateSettings.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
              </ProtectedButton>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

