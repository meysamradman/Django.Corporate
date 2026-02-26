"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/core/utils/cn";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/elements/dialog";
import { Input } from "@/components/elements/input";

export type PopupPickerOption = {
  value: string;
  title: string;
};

type PopupPickerProps = {
  value: string;
  title: string;
  placeholder: string;
  options: PopupPickerOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  showCheck?: boolean;
};

export function PopupPicker({
  value,
  title,
  placeholder,
  options,
  onSelect,
  disabled = false,
  searchable = false,
  searchPlaceholder = "جستجو کنید",
  showCheck = true,
}: PopupPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((item) => item.value === value);
  const displayText = selected?.title || placeholder;
  const normalizedQuery = query.trim().toLocaleLowerCase("fa-IR");
  const filteredOptions = searchable
    ? options.filter((item) => item.title.toLocaleLowerCase("fa-IR").includes(normalizedQuery))
    : options;

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(disabled ? false : next)}>
      <DialogTrigger asChild>
        <button
          dir="rtl"
          type="button"
          disabled={disabled}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-br bg-wt px-3 text-sm text-font-p shadow-xs outline-none transition-colors focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="line-clamp-1 text-right">{displayText}</span>
          <ChevronDown className="size-4 text-font-s" />
        </button>
      </DialogTrigger>

      <DialogContent dir="rtl" className="max-w-sm border-br bg-card p-0" showCloseButton={false}>
        <DialogHeader className="border-b border-br px-3 py-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-br bg-bg text-font-s transition-colors hover:bg-card hover:text-font-p"
              aria-label="بستن"
            >
              <X className="size-4" />
            </button>
            <DialogTitle className="text-sm font-black text-font-p">{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {searchable ? (
            <div className="mb-2">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />
            </div>
          ) : null}

          {filteredOptions.map((item) => {
            const isActive = item.value === value;
            return (
              <button
                key={`${item.value || "empty"}-${item.title}`}
                type="button"
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-end rounded-md px-2.5 py-2 text-right text-sm transition-colors",
                  isActive ? "bg-bg text-font-p" : "text-font-s hover:bg-bg hover:text-font-p"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="line-clamp-1">{item.title}</span>
                  {showCheck ? (
                    <span
                      className={cn(
                        "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                        isActive ? "border-primary bg-primary text-static-w" : "border-br bg-card text-transparent"
                      )}
                    >
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
