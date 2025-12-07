"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FAQ } from "@/types/chatbot/chatbot";
import { useCreateFAQ, useUpdateFAQ } from "@/components/ai/chatbot/hooks/useChatbot";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/elements/Dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/elements/Form";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Button } from "@/components/elements/Button";
import { Switch } from "@/components/elements/Switch";

const formSchema = z.object({
  question: z.string().min(1, "سوال الزامی است").max(500, "سوال نمی‌تواند بیشتر از 500 کاراکتر باشد"),
  answer: z.string().min(1, "پاسخ الزامی است"),
  keywords: z.string().optional(),
  patterns: z.string().optional(),
  order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface FAQDialogProps {
  isOpen: boolean;
  onClose: () => void;
  faq?: FAQ | null;
}

export function FAQDialog({ isOpen, onClose, faq }: FAQDialogProps) {
  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      answer: "",
      keywords: "",
      patterns: "",
      order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (faq) {
      form.reset({
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords || "",
        patterns: faq.patterns || "",
        order: faq.order,
        is_active: faq.is_active,
      });
    } else {
      form.reset({
        question: "",
        answer: "",
        keywords: "",
        patterns: "",
        order: 0,
        is_active: true,
      });
    }
  }, [faq, form, isOpen]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (faq) {
        await updateFAQ.mutateAsync({ id: faq.id, data });
      } else {
        await createFAQ.mutateAsync(data);
      }
      onClose();
    } catch (error) {
    }
  };

  const isLoading = createFAQ.isPending || updateFAQ.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{faq ? "ویرایش سوال متداول" : "افزودن سوال متداول"}</DialogTitle>
          <DialogDescription>
            سوالات متداول به کاربران کمک می‌کنند تا پاسخ سوالات خود را سریع‌تر پیدا کنند.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>سوال *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: قیمت خدمات چقدر است؟" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>پاسخ *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="پاسخ کامل به سوال..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کلمات کلیدی</FormLabel>
                    <FormControl>
                      <Input placeholder="قیمت, هزینه, هزینه خدمات" {...field} />
                    </FormControl>
                    <FormDescription>
                      کلمات کلیدی را با کاما جدا کنید
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ترتیب</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      ترتیب نمایش (کمتر = اول)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="patterns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الگوهای سوال</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="هر خط یک الگو&#10;مثال:&#10;قیمت چقدر است؟&#10;هزینه چقدره؟"
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    هر خط یک الگوی سوال (اختیاری)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>فعال</FormLabel>
                    <FormDescription>
                      سوال در چت‌بات نمایش داده شود
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                انصراف
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "در حال ذخیره..." : faq ? "به‌روزرسانی" : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

