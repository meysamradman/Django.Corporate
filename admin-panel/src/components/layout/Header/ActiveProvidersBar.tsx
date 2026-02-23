import { useQuery } from '@tanstack/react-query';
import { aiApi } from '@/api/ai/ai';
import { Brain } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/elements/DropdownMenu';
import { getProviderIcon } from '@/components/ai/shared/utils';

export function ActiveProvidersBar() {
  const { data: providers } = useQuery({
    queryKey: ['ai-backend-providers'],
    queryFn: async () => {
      const response = await aiApi.image.getProviders();
      return response.data || [];
    },
    staleTime: 0,
  });

  const activeProviders = providers?.filter((p: any) => p.is_active) || [];

  const { data: mySettings } = useQuery({
    queryKey: ['ai-my-settings'],
    queryFn: async () => {
      const res = await aiApi.personalSettings.getMySettings();
      return res.data || [];
    },
    staleTime: 0,
    enabled: activeProviders.length > 0,
  });

  const settingsMap = (mySettings || []).reduce((acc: Record<string, any>, s: any) => {
    if (s.provider_slug) acc[s.provider_slug] = s;
    if (s.provider_name) acc[s.provider_name.toLowerCase()] = s;
    return acc;
  }, {} as Record<string, any>);

  if (activeProviders.length === 0) return null;

  const findSetting = (p: any) => {
    if (!p) return undefined;
    const slug = p.slug;
    const name = (p.name || '').toLowerCase();
    const display = (p.display_name || '').toLowerCase();

    let s = settingsMap[slug] || settingsMap[name] || settingsMap[display];
    if (s) return s;

    if (mySettings && Array.isArray(mySettings)) {
      s = (mySettings as any[]).find((item: any) => {
        const ps = (item.provider_slug || '').toString();
        const pn = (item.provider_name || '').toLowerCase();
        const pd = (item.provider_display || '')?.toLowerCase?.() || '';
        return ps === slug || pn === name || pn === display || pd === name || pd === display;
      });
    }
    return s;
  };

  const detectSource = (s: any) => {
    if (!s) return 'none';
    if (s.api_config && s.api_config.personal && s.api_config.personal.configured) return 'personal';
    if (s.personal_api_key_value) return 'personal';
    if (s.has_personal_api) return 'personal';

    if (s.api_config && s.api_config.current_source) return s.api_config.current_source;

    if (s.use_shared_api) return 'shared';
    if (s.api_config && s.api_config.shared && s.api_config.shared.has_access) return 'shared';
    return 'none';
  };

  const providerStates = activeProviders.map((p: any) => {
    const s = findSetting(p);
    const source = detectSource(s);
    return { provider: p, setting: s, source };
  });

  const personalActiveCount = providerStates.filter((ps: any) => ps.source === 'personal').length;
  const sharedActiveCount = providerStates.filter((ps: any) => ps.source === 'shared').length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-br transition-colors cursor-pointer"
          aria-label={`Providers: شخصی ${personalActiveCount} - اشتراکی ${sharedActiveCount}`}
          title={`Providers: شخصی ${personalActiveCount} - اشتراکی ${sharedActiveCount}`}
        >
          <Brain className="text-font-p" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[320px]">
        <div className="px-3 py-2 text-sm font-semibold text-font-p mb-2 pb-2 border-b border-br">
          Provider های فعال ({activeProviders.length})
        </div>
        {providerStates.map(({ provider, source }: any) => {
          return (
            <DropdownMenuItem
              key={provider.id}
              className="cursor-pointer hover:bg-bg px-3 py-2 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="text-lg w-6 text-center">{getProviderIcon(provider)}</div>
                <div className="text-sm font-medium text-font-p">{provider.display_name || provider.name}</div>
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full border ${source === 'personal' ? 'bg-blue-50 border-blue-100 text-blue-600' : source === 'shared' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                {source === 'personal' ? 'شخصی' : source === 'shared' ? 'اشتراکی' : 'غیرفعال'}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
