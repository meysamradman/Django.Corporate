"use client";

import React from 'react';
import Link from 'next/link';
import { Search, List } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';

interface AISettingsHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function AISettingsHeader({ searchQuery, onSearchChange }: AISettingsHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="page-title">تنظیمات AI Provider</h1>
        <Button asChild>
          <Link href="/settings/ai/models">
            <List className="w-4 h-4" />
            انتخاب مدل‌ها
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-font-s pointer-events-none" />
          <Input
            type="text"
            id="search-providers"
            name="search_providers"
            autoComplete="off"
            placeholder="جستجو در Provider ها..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-10 h-10 text-sm bg-card border-br focus:border-primary transition-colors"
          />
        </div>
      </div>
    </>
  );
}
