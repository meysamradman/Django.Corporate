"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Paperclip, 
  Share2, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  MoreVertical,
  ChevronDown,
  Lightbulb,
  Zap,
  Rocket,
  Moon,
  Infinity,
  Users,
  Lock,
  Check,
  Mic,
  Box
} from 'lucide-react';
import { Button } from '@/components/elements/Button';

export default function AIChatTestPage() {
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState("expert");
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const models = [
    { id: "auto", name: "خودکار", icon: Rocket, description: "انتخاب سریع یا متخصص" },
    { id: "fast", name: "سریع", icon: Zap, description: "پاسخ‌های سریع" },
    { id: "expert", name: "متخصص", icon: Lightbulb, description: "تحلیل عمیق" },
    { id: "grok", name: "Grok 4.1", icon: Moon, description: "نسخه آزمایشی" },
    { id: "heavy", name: "سنگین", icon: Users, description: "تیم متخصصان" },
    { id: "supergrok", name: "SuperGrok", icon: Infinity, description: "افزایش ظرفیت...", upgrade: true },
    { id: "custom", name: "دستورالعمل سفارشی", icon: Users, description: "تنظیم نشده", customize: true },
    { id: "all", name: "همه مدل‌ها", icon: Box, description: "", locked: true },
  ];

  const currentModel = models.find(m => m.id === selectedModel) || models[2];

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        {/* User Message - Left aligned in RTL */}
        <div className="flex justify-start mb-6">
          <div className="max-w-[70%]">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 inline-block">
              <p className="text-base text-gray-900">سلام</p>
            </div>
          </div>
        </div>

        {/* AI Message - Right aligned in RTL */}
        <div className="flex justify-end mb-6">
          <div className="max-w-[70%]">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 inline-block shadow-sm">
              <p className="text-base text-gray-900">سلام! 👋 چطور میتونم کمکت کنم؟</p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Area - Elevated and improved */}
      <div className="py-6 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-4">
            {/* Textarea for message input */}
            <textarea
              placeholder="پیام..."
              rows={1}
              className="w-full px-4 py-3 resize-none focus:outline-none text-base text-gray-900 placeholder-gray-400 bg-transparent overflow-hidden"
              style={{
                minHeight: '24px',
                maxHeight: '200px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />

            {/* Bottom controls */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              {/* Left side - Expert button */}
              <div className="relative" ref={modelDropdownRef}>
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <currentModel.icon className="h-4 w-4 text-gray-700" />
                  <span className="text-sm font-medium text-gray-900">{currentModel.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </button>

                {/* Model Dropdown */}
                {showModelDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    {models.map((model) => {
                      const Icon = model.icon;
                      const isSelected = model.id === selectedModel;
                      return (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-right hover:bg-gray-50 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Icon className="h-5 w-5 text-gray-700" />
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium text-gray-900">{model.name}</span>
                              {model.description && (
                                <span className="text-xs text-gray-500">{model.description}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                            {model.upgrade && (
                              <span className="px-2 py-1 bg-black text-white text-xs rounded">ارتقا</span>
                            )}
                            {model.customize && (
                              <span className="px-2 py-1 bg-gray-200 text-gray-900 text-xs rounded">سفارشی‌سازی</span>
                            )}
                            {model.locked && (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right side - Paperclip and Mic icons */}
              <div className="flex items-center gap-2">
                {/* Paperclip Icon */}
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                  <Paperclip className="h-5 w-5" />
                </button>
                
                {/* Mic Icon */}
                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                  <Mic className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-500">
            چت‌های این صفحه ذخیره نمی‌شوند.
          </p>
        </div>
      </div>
    </div>
  );
}
