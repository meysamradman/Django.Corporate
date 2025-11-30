"use client"

import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select"


interface DataTableSelectFilterProps<TValue> {
  title?: string
  options: {
    label: string
    value: TValue
  }[]
  placeholder?: string
  value?: TValue
  onChange: (value: TValue | undefined) => void
}

export function DataTableSelectFilter<TValue extends string | boolean>({
  title,
  options,
  placeholder,
  value,
  onChange
}: DataTableSelectFilterProps<TValue>) {

  const filterValue = value === undefined ? undefined : String(value);
  const defaultPlaceholder = placeholder || title || "انتخاب کنید...";

  const handleValueChange = (newValue: string) => {
    if (newValue === "all") {
      onChange(undefined);
    } else {
      const originalValue = options.find(opt => String(opt.value) === newValue)?.value;
      onChange(originalValue);
    }
  };

  const selectedOption = options.find(
    (option) => String(option.value) === filterValue
  );

  let triggerText: string;
  if (filterValue === undefined) {
    triggerText = defaultPlaceholder;
  } else if (filterValue === "all") {
          triggerText = "همه";
  } else if (selectedOption) {
    triggerText = selectedOption.label;
  } else {
    triggerText = defaultPlaceholder;
  }

  return (
    <Select value={filterValue ?? "all"} onValueChange={handleValueChange}>
      <SelectTrigger className="w-full md:w-auto">
        <SelectValue placeholder={defaultPlaceholder}>
          {triggerText}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">همه</SelectItem>
        {options.map((option) => (
          <SelectItem key={String(option.value)} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 