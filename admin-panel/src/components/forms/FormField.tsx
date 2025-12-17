import type { ReactNode } from "react";
import { Label } from "@/components/elements/Label";
import { Input } from "@/components/elements/Input";
import { AlertCircle } from "lucide-react";
import { cn } from "@/core/utils/cn";

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  description?: string;
  className?: string;
}

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
      {label && (
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
      )}
      
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
    >
      <Input 
        {...inputProps}
        className={cn(
          error && "border-red-1 focus-visible:ring-red-1",
          className
        )}
      />
    </FormField>
  );
}

