---
trigger: always_on
alwaysApply: true
---

import React, { useState } from 'react';
import { Settings, Key, Search, Check, ChevronDown, ChevronUp, Zap, DollarSign, Filter } from 'lucide-react';

export default function AdvancedProviderManager() {
  const [activeTab, setActiveTab] = useState('shared'); // 'shared' or 'personal'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProviders, setExpandedProviders] = useState(['openrouter']); // default expanded
  const [filterType, setFilterType] = useState('all'); // 'all', 'free', 'paid'

  // API Keys State
  const [apiKeys, setApiKeys] = useState({
    shared: {
      openrouter: 'sk-or-xxxxx',
      openai: '',
      groq: 'gsk-xxxxx',
      google: '',
      anthropic: '',
    },
    personal: {
      openrouter: '',
      openai: '',
      groq: '',
      google: '',
      anthropic: '',
    }
  });

  // همه Provider ها و مدل‌هاشون
  const providers = [
    {
      id: 'openrouter',
      name: 'OpenRouter',
      icon: '🔄',
      description: 'دسترسی به 50+ مدل از providers مختلف',
      apiKeyLabel: 'OpenRouter API Key',
      models: [
        { id: 1, name: 'GPT-4o', provider: 'OpenAI', price: '$30/1M', free: false, selected: true },
        { id: 2, name: 'GPT-4 Turbo', provider: 'OpenAI', price: '$10/1M', free: false, selected: false },
        { id: 3, name: 'Claude 3.5 Sonnet', provider: 'Anthropic', price: '$15/1M', free: false, selected: true },
        { id: 4, name: 'Claude 3 Opus', provider: 'Anthropic', price: '$75/1M', free: false, selected: false },
        { id: 5, name: 'Llama 3.3 70B', provider: 'Meta', price: 'رایگان', free: true, selected: true },
        { id: 6, name: 'Llama 3.1 405B', provider: 'Meta', price: '$5/1M', free: false, selected: false },
        { id: 7, name: 'DeepSeek R1', provider: 'DeepSeek', price: 'رایگان', free: true, selected: true },
        { id: 8, name: 'DeepSeek V3', provider: 'DeepSeek', price: '$0.27/1M', free: false, selected: false },
        { id: 9, name: 'Qwen Max', provider: 'Alibaba', price: '$2/1M', free: false, selected: true },
        { id: 10, name: 'Qwen Turbo', provider: 'Alibaba', price: '$0.3/1M', free: false, selected: false },
        { id: 11, name: 'Gemini 2.5 Flash', provider: 'Google', price: 'رایگان', free: true, selected: true },
        { id: 12, name: 'Mistral Large', provider: 'Mistral', price: '$8/1M', free: false, selected: false },
      ]
    },
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🤖',
      description: 'ChatGPT و DALL-E مستقیم',
      apiKeyLabel: 'OpenAI API Key',
      models: [
        { id: 13, name: 'GPT-4o', price: '$30/1M', free: false, selected: true },
        { id: 14, name: 'GPT-4o mini', price: '$1.5/1M', free: false, selected: true },
        { id: 15, name: 'GPT-4 Turbo', price: '$10/1M', free: false, selected: false },
        { id: 16, name: 'o3-mini', price: '$1.1/1M', free: false, selected: false },
        { id: 17, name: 'DALL-E 3', price: '$0.08/image', free: false, selected: true },
      ]
    },
    {
      id: 'groq',
      name: 'Groq',
      icon: '⚡',
      description: 'سریع‌ترین inference (300+ tokens/sec)',
      apiKeyLabel: 'Groq API Key',
      models: [
        { id: 18, name: 'Llama 3.3 70B', price: 'رایگان', free: true, selected: true },
        { id: 19, name: 'DeepSeek R1 Distill', price: 'رایگان', free: true, selected: true },
        { id: 20, name: 'Mixtral 8x7B', price: 'رایگان', free: true, selected: false },
        { id: 21, name: 'Whisper Large', price: 'رایگان', free: true, selected: false },
      ]
    },
    {
      id: 'google',
      name: 'Google AI Studio',
      icon: '🌐',
      description: 'Gemini مستقیم (1M tokens/min رایگان)',
      apiKeyLabel: 'Google API Key',
      models: [
        { id: 22, name: 'Gemini 2.5 Flash', price: 'رایگان', free: true, selected: true },
        { id: 23, name: 'Gemini 2.5 Pro', price: '$0.075/1M', free: false, selected: false },
        { id: 24, name: 'Imagen 3', price: '$0.02/image', free: false, selected: false },
      ]
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      icon: '🧠',
      description: 'Claude مستقیم (بهترین برای کدنویسی)',
      apiKeyLabel: 'Anthropic API Key',
      models: [
        { id: 25, name: 'Claude 3.5 Sonnet', price: '$15/1M', free: false, selected: true },
        { id: 26, name: 'Claude 3.5 Haiku', price: '$4/1M', free: false, selected: false },
        { id: 27, name: 'Claude 3 Opus', price: '$75/1M', free: false, selected: false },
      ]
    },
  ];

  const [providerStates, setProviderStates] = useState(providers);

  const toggleProvider = (providerId) => {
    setExpandedProviders(prev =>
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const toggleModel = (providerId, modelId) => {
    setProviderStates(prev => prev.map(provider => {
      if (provider.id === providerId) {
        return {
          ...provider,
          models: provider.models.map(model =>
            model.id === modelId ? { ...model, selected: !model.selected } : model
          )
        };
      }
      return provider;
    }));
  };

  const updateApiKey = (providerId, value) => {
    setApiKeys(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [providerId]: value
      }
    }));
  };

  // Filtering
  const filteredProviders = providerStates.map(provider => ({
    ...provider,
    models: provider.models.filter(model => {
      const matchesSearch = 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.provider && model.provider.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'free' && model.free) ||
        (filterType === 'paid' && !model.free);
      
      return matchesSearch && matchesFilter;
    })
  })).filter(provider => provider.models.length > 0);

  // Stats
  const totalModels = providerStates.reduce((sum, p) => sum + p.models.length, 0);
  const selectedModels = providerStates.reduce(
    (sum, p) => sum + p.models.filter(m => m.selected).length, 
    0
  );

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">مدیریت Provider ها</h1>
          </div>
          <p className="text-slate-400">
            {totalModels} مدل از {providers.length} provider - {selectedModels} فعال
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'shared'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Key className="w-5 h-5" />
              اشتراکی (همه ادمین‌ها)
            </div>
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'personal'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              شخصی (فقط شما)
            </div>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در مدل‌ها..."
              className="w-full bg-slate-800 text-white rounded-lg pr-10 pl-4 py-3 border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 text-white rounded-lg px-4 py-3 border border-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">همه ({totalModels})</option>
            <option value="free">رایگان</option>
            <option value="paid">پولی</option>
          </select>
        </div>

        {/* Provider List */}
        <div className="space-y-4">
          {filteredProviders.map((provider) => {
            const isExpanded = expandedProviders.includes(provider.id);
            const selectedCount = provider.models.filter(m => m.selected).length;
            const hasApiKey = apiKeys[activeTab][provider.id];

            return (
              <div
                key={provider.id}
                className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
              >
                {/* Provider Header */}
                <div
                  onClick={() => toggleProvider(provider.id)}
                  className="p-5 cursor-pointer hover:bg-slate-750 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{provider.icon}</div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">{provider.name}</h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                          {provider.models.length} مدل
                        </span>
                        {selectedCount > 0 && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900 bg-opacity-30 text-blue-400 border border-blue-800">
                            {selectedCount} فعال
                          </span>
                        )}
                        {hasApiKey && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-900 bg-opacity-30 text-green-400 border border-green-800">
                            ✓ متصل
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{provider.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Provider Body */}
                {isExpanded && (
                  <div className="border-t border-slate-700 p-5 bg-slate-850">
                    
                    {/* API Key Input */}
                    <div className="mb-5">
                      <label className="block text-white font-semibold mb-2">
                        🔑 {provider.apiKeyLabel}
                      </label>
                      <input
                        type="password"
                        value={apiKeys[activeTab][provider.id]}
                        onChange={(e) => updateApiKey(provider.id, e.target.value)}
                        placeholder="sk-xxxxxxxxxxxxx"
                        className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Models Grid */}
                    <div>
                      <p className="text-white font-semibold mb-3">
                        مدل‌های موجود ({provider.models.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {provider.models.map((model) => (
                          <div
                            key={model.id}
                            onClick={() => toggleModel(provider.id, model.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition ${
                              model.selected
                                ? 'bg-blue-900 bg-opacity-20 border-blue-600'
                                : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  model.selected ? 'bg-blue-600 border-blue-600' : 'border-slate-500'
                                }`}>
                                  {model.selected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">{model.name}</p>
                                  {model.provider && (
                                    <p className="text-slate-400 text-xs">{model.provider}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                model.free
                                  ? 'bg-green-900 bg-opacity-30 text-green-400'
                                  : 'bg-slate-600 text-slate-300'
                              }`}>
                                {model.price}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition">
          💾 ذخیره تنظیمات ({selectedModels} مدل فعال)
        </button>

        {/* Info */}
        <div className="mt-6 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-300 text-sm">
            <span className="font-semibold">💡 نکته:</span> هر provider به صورت جداگانه کار می‌کند. 
            اگر API key نداشته باشید، مدل‌های آن provider غیرفعال خواهند بود.
          </p>
        </div>
      </div>
    </div>
  );
}