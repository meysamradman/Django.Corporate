"use client";

import React from 'react';
import { StaticModelSelector } from '@/components/ai/core/StaticModelSelector';
import type { StaticModel } from '@/components/ai/core/StaticModelSelector';

interface GoogleGeminiModelSelectorContentProps {
  providerId: string;
  providerName: string;
  capability: 'chat' | 'content' | 'image' | 'audio';
  onSave: () => void;
  onSelectionChange?: (selectedCount: number) => void;
}

const GEMINI_MODELS: Record<string, StaticModel[]> = {
  chat: [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'gemini-2.0-flash-exp',
      display_name: 'Gemini 2.0 Flash (Experimental)',
      description: 'جدیدترین و سریع‌ترین مدل Gemini با قابلیت‌های پیشرفته',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 8192,
      context_window: 1000000,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'gemini-1.5-pro',
      display_name: 'Gemini 1.5 Pro',
      description: 'مدل پیشرفته با context window بسیار بزرگ',
      pricing_input: 1.25,
      pricing_output: 5,
      max_tokens: 8192,
      context_window: 2000000,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'gemini-1.5-flash',
      display_name: 'Gemini 1.5 Flash',
      description: 'سریع و کارآمد برای استفاده روزمره',
      pricing_input: 0.075,
      pricing_output: 0.3,
      max_tokens: 8192,
      context_window: 1000000,
    },
    {
      id: 'gemini-1.0-pro',
      name: 'gemini-1.0-pro',
      display_name: 'Gemini 1.0 Pro',
      description: 'نسخه اولیه با قابلیت‌های خوب',
      pricing_input: 0.5,
      pricing_output: 1.5,
      max_tokens: 2048,
      context_window: 32768,
    },
  ],
  content: [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'gemini-2.0-flash-exp',
      display_name: 'Gemini 2.0 Flash (Experimental)',
      description: 'بهترین برای تولید محتوای باکیفیت',
      pricing_input: 0,
      pricing_output: 0,
      max_tokens: 8192,
      context_window: 1000000,
    },
    {
      id: 'gemini-1.5-pro',
      name: 'gemini-1.5-pro',
      display_name: 'Gemini 1.5 Pro',
      description: 'تولید محتوای حرفه‌ای با context بزرگ',
      pricing_input: 1.25,
      pricing_output: 5,
      max_tokens: 8192,
      context_window: 2000000,
    },
    {
      id: 'gemini-1.5-flash',
      name: 'gemini-1.5-flash',
      display_name: 'Gemini 1.5 Flash',
      description: 'تولید سریع محتوا',
      pricing_input: 0.075,
      pricing_output: 0.3,
      max_tokens: 8192,
      context_window: 1000000,
    },
  ],
  image: [
    {
      id: 'imagen-3.0-generate-001',
      name: 'imagen-3.0-generate-001',
      display_name: 'Imagen 3.0',
      description: 'تولید تصویر با کیفیت بالا',
      pricing_input: 0.02,
      pricing_output: 0.02,
      max_tokens: null,
      context_window: null,
    },
  ],
  audio: [
    {
      id: 'gemini-1.5-flash',
      name: 'gemini-1.5-flash',
      display_name: 'Gemini 1.5 Flash (Audio)',
      description: 'پردازش و تولید صدا',
      pricing_input: 0.075,
      pricing_output: 0.3,
      max_tokens: 8192,
      context_window: 1000000,
    },
  ],
};

export function GoogleGeminiModelSelectorContent({
  providerId,
  providerName,
  capability,
  onSave,
  onSelectionChange,
}: GoogleGeminiModelSelectorContentProps) {
  const models = GEMINI_MODELS[capability] || [];

  return (
    <StaticModelSelector
      providerId={providerId}
      providerSlug="gemini"
      capability={capability}
      models={models}
      onSave={onSave}
      singleSelection={true}
    />
  );
}
