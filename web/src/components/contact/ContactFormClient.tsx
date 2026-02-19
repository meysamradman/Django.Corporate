"use client";

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ApiError } from "@/types/api/apiError";
import { publicContactFormApi } from "@/api/form/route";
import type { PublicContactFormField } from "@/types/form/contactForm";
import { Button } from "@/components/elements/custom/button";
import { Input } from "@/components/elements/input";
import { Textarea } from "@/components/elements/textarea";

type DynamicFormValues = Record<string, any> & {
  __hp?: string;
};

function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={`w-full rounded-md border border-br bg-wt px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      {...props}
    >
      {children}
    </select>
  );
}

const normalizeServerErrors = (errors: unknown): Record<string, string> => {
  if (!errors || typeof errors !== "object") return {};

  const record = errors as Record<string, unknown>;
  const out: Record<string, string> = {};

  for (const [key, val] of Object.entries(record)) {
    if (typeof val === "string") {
      out[key] = val;
      continue;
    }

    if (Array.isArray(val)) {
      const first = val.find((x) => typeof x === "string") as string | undefined;
      if (first) out[key] = first;
      continue;
    }

    // Some backends return nested dict; we keep it general.
    if (val && typeof val === "object") {
      out[key] = "خطای اعتبارسنجی";
    }
  }

  return out;
};

const renderField = (field: PublicContactFormField) => {
  const placeholder = field.placeholder ?? undefined;

  switch (field.field_type) {
    case "textarea":
      return <Textarea placeholder={placeholder} />;

    case "email":
      return <Input type="email" placeholder={placeholder} dir="ltr" />;

    case "phone":
      return <Input type="tel" placeholder={placeholder} dir="ltr" />;

    case "number":
      return <Input type="number" placeholder={placeholder} />;

    case "date":
      return <Input type="date" placeholder={placeholder} />;

    case "url":
      return <Input type="url" placeholder={placeholder} dir="ltr" />;

    case "select":
    case "radio":
      return (
        <NativeSelect defaultValue="">
          <option value="" disabled>
            انتخاب کنید
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
      );

    case "checkbox":
      // Minimal and safe interpretation: treat as single boolean.
      return <Input type="checkbox" className="w-4 h-4" />;

    case "text":
    default:
      return <Input type="text" placeholder={placeholder} />;
  }
};

export default function ContactFormClient() {
  const [fields, setFields] = React.useState<PublicContactFormField[]>([]);
  const [loadingFields, setLoadingFields] = React.useState(true);
  const [submitState, setSubmitState] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = React.useState<string | null>(null);

  const form = useForm<DynamicFormValues>({
    defaultValues: {
      __hp: "",
    },
  });

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingFields(true);
        const data = await publicContactFormApi.getFields("website");
        if (!mounted) return;
        setFields(data);
      } catch {
        if (!mounted) return;
        setFields([]);
      } finally {
        if (!mounted) return;
        setLoadingFields(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (values: DynamicFormValues) => {
    setSubmitState("submitting");
    setSubmitMessage(null);
    form.clearErrors();

    // Honeypot: if filled, silently accept.
    if (values.__hp && String(values.__hp).trim()) {
      setSubmitState("success");
      setSubmitMessage("پیام شما با موفقیت ثبت شد.");
      form.reset({ __hp: "" });
      return;
    }

    const form_data: Record<string, any> = {};
    for (const field of fields) {
      const key = field.field_key;
      if (!key) continue;

      const value = values[key];
      if (field.field_type === "checkbox") {
        form_data[key] = !!value;
      } else {
        form_data[key] = value;
      }
    }

    try {
      await publicContactFormApi.submit({
        platform: "website",
        form_data,
      });

      setSubmitState("success");
      setSubmitMessage("پیام شما با موفقیت ثبت شد.");
      form.reset({ __hp: "" });
    } catch (e) {
      const err = e as unknown;
      if (err instanceof ApiError) {
        const serverErrors = normalizeServerErrors(err.response.errors);
        for (const [key, message] of Object.entries(serverErrors)) {
          // Map backend errors directly if they match a field_key.
          if (key && message) {
            form.setError(key as any, { type: "server", message });
          }
        }

        setSubmitState("error");
        setSubmitMessage(err.response.message || "خطا در ارسال فرم");
        return;
      }

      setSubmitState("error");
      setSubmitMessage("خطا در ارسال فرم");
    }
  };

  return (
    <section className="bg-wt border border-br/50 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-base font-black">فرم تماس</h2>
        <p className="mt-1 text-sm text-font-s">پیام خود را ارسال کنید تا با شما تماس بگیریم.</p>
      </div>

      <div className="p-6">
        {loadingFields ? (
          <div className="rounded-xl border border-br/50 bg-bg p-4 text-sm text-font-s">در حال بارگذاری فرم...</div>
        ) : fields.length === 0 ? (
          <div className="rounded-xl border border-br/50 bg-bg p-4 text-sm text-font-s leading-7">
            برای نمایش فرم، ابتدا فیلدهای فرم تماس را در بک‌اند تعریف کنید.
            <br />
            حداقل یک فیلد با <span className="font-black">is_active=true</span> و
            <span className="font-black"> platforms شامل website</span> بسازید.
          </div>
        ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="__hp">نام</label>
                <input id="__hp" type="text" tabIndex={-1} autoComplete="off" {...form.register("__hp")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <Controller
                    key={field.field_key}
                    control={form.control}
                    name={field.field_key as keyof DynamicFormValues}
                    rules={{
                      required: field.required ? "این فیلد الزامی است" : false,
                    }}
                    render={({ field: rhfField, fieldState }) => {

                      return (
                      <div className={field.field_type === "textarea" ? "md:col-span-2" : ""}>
                        <label className="text-sm font-medium">
                          {field.label}
                          {field.required ? <span className="text-red-2"> *</span> : null}
                        </label>
                        <div className="mt-1.5">
                          <div>
                            {React.cloneElement(renderField(field) as any, {
                              ...rhfField,
                              value:
                                field.field_type === "checkbox"
                                  ? undefined
                                  : rhfField.value ?? "",
                              checked:
                                field.field_type === "checkbox"
                                  ? !!rhfField.value
                                  : undefined,
                              onChange: (e: any) => {
                                if (field.field_type === "checkbox") {
                                  rhfField.onChange(!!e?.target?.checked);
                                  return;
                                }
                                rhfField.onChange(e?.target?.value);
                              },
                            })}
                          </div>
                        </div>
                        {fieldState.error?.message ? (
                          <p className="mt-1 text-sm text-red-2">{fieldState.error.message}</p>
                        ) : null}
                      </div>
                      );
                    }}
                  />
                ))}
              </div>

              {submitMessage ? (
                <div
                  className={
                    submitState === "success"
                      ? "rounded-xl border border-br/50 bg-bg p-3 text-sm text-font-p"
                      : "rounded-xl border border-red-1/30 bg-bg p-3 text-sm text-red-2"
                  }
                >
                  {submitMessage}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <Button type="submit" disabled={submitState === "submitting"}>
                  {submitState === "submitting" ? "در حال ارسال..." : "ارسال پیام"}
                </Button>
              </div>
            </form>
        )}
      </div>
    </section>
  );
}
