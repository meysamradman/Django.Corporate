"use client";

import { ReactNode } from "react";
import { Label } from "@/components/elements/Label";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { AlertCircle } from "lucide-react";
import { cn } from "@/core/utils/cn";

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  description?: string;
  className?: string;
}

/**
 * FormField Component
 * 
 * کامپوننت یکپارچه برای نمایش فیلد فرم با لیبل، خطا و توضیحات
 * 
 * @example
 * ```tsx
 * <FormField 
 *   label="نام" 
 *   error={errors.name?.message}
 *   required
 * >
 *   <Input {...register("name")} />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  error,
  required,
  children,
  htmlFor,
  description,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={htmlFor}
        className={cn(
          "text-sm font-medium",
          error && "text-red-1"
        )}
      >
        {label}
        {required && <span className="text-red-1 mr-1">*</span>}
      </Label>
      
      {children}
      
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-1">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {description && !error && (
        <p className="text-xs text-font-s">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * FormFieldInput - FormField + Input یکپارچه
 */
interface FormFieldInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export function FormFieldInput({
  label,
  error,
  required,
  description,
  className,
  ...inputProps
}: FormFieldInputProps) {
  return (
    <FormField 
      label={label} 
      error={error} 
      required={required}
      htmlFor={inputProps.id}
      description={description}
      className={className}
    >
      <Input 
        {...inputProps}
        className={cn(
          error && "border-red-1 focus-visible:ring-red-1"
        )}
      />
    </FormField>
  );
}

/**
 * FormFieldTextarea - FormField + Textarea یکپارچه
 */
interface FormFieldTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
}

export function FormFieldTextarea({
  label,
  error,
  required,
  description,
  className,
  ...textareaProps
}: FormFieldTextareaProps) {
  return (
    <FormField 
      label={label} 
      error={error} 
      required={required}
      htmlFor={textareaProps.id}
      description={description}
      className={className}
    >
      <Textarea 
        {...textareaProps}
        className={cn(
          error && "border-red-1 focus-visible:ring-red-1"
        )}
      />
    </FormField>
  );
}

