import React from "react";
import { Input } from "@/components/elements/Input";
import { Search } from "lucide-react";

interface TicketSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TicketSearch({ value, onChange, placeholder = "جستجوی تیکت..." }: TicketSearchProps) {
  return (
    <div className="relative w-64">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-font-s" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
    </div>
  );
}

