import { useState, useEffect, useMemo, useCallback } from 'react';
import { CardContent } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';
import { Badge } from '@/components/elements/Badge';
import { Switch } from '@/components/elements/Switch';
import { Eye, EyeOff, Sparkles, Loader2, CheckCircle2, Trash2, Edit2, Save, X, Users, User } from 'lucide-react';
import type { Provider } from '../hooks/useAISettings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/elements/Tabs';

interface ProviderCardProps {
  provider: Provider;
  isExpanded: boolean;
  apiKey: string;
  showApiKey: boolean;
  useSharedApi: boolean;
  hasStoredApiKey?: boolean;
  isSuperAdmin?: boolean;
  allowNormalAdmins?: boolean;
  hasSharedApi?: boolean;
  canUseSharedApi?: boolean;
  isActive?: boolean;
  personalApiKey?: string;
  sharedApiKey?: string;
  hasStoredPersonalApiKey?: boolean;
  hasStoredSharedApiKey?: boolean;
  showPersonalApiKey?: boolean;
  showSharedApiKey?: boolean;
  onToggleApiKeyVisibility: () => void;
  onApiKeyChange: (value: string) => void;
  onPersonalApiKeyChange?: (value: string) => void;
  onSharedApiKeyChange?: (value: string) => void;
  onTogglePersonalApiKeyVisibility?: () => void;
  onToggleSharedApiKeyVisibility?: () => void;
  onToggleUseSharedApi: (checked: boolean) => void;
  onToggleActive?: (checked: boolean) => void;
  onSave: () => void;
  onSavePersonal?: () => void;
  onSaveShared?: () => void;
  onDeletePersonal?: () => void;
  onDeleteShared?: () => void;
  isSaving?: boolean;
}

function maskApiKey(apiKey: string, showFull: boolean = false): string {
  if (!apiKey || apiKey.trim() === '') return '';

  if (showFull) return apiKey;

  if (apiKey.length <= 8) return '•'.repeat(apiKey.length);

  const prefix = apiKey.substring(0, 4);
  const suffix = apiKey.substring(apiKey.length - 4);
  const masked = '•'.repeat(Math.min(8, apiKey.length - 8));

  return `${prefix}${masked}${suffix}`;
}

export function ProviderCard({
  provider,
  isExpanded = false,
  apiKey,
  showApiKey,
  useSharedApi,
  hasStoredApiKey = false,
  isSuperAdmin = false,
  allowNormalAdmins = false,
  hasSharedApi = false,
  canUseSharedApi: canUseSharedApiProp,
  isActive = false,
  personalApiKey = '',
  sharedApiKey = '',
  hasStoredPersonalApiKey = false,
  hasStoredSharedApiKey = false,
  showPersonalApiKey = false,
  showSharedApiKey = false,
  onToggleApiKeyVisibility,
  onApiKeyChange,
  onPersonalApiKeyChange,
  onSharedApiKeyChange,
  onTogglePersonalApiKeyVisibility,
  onToggleSharedApiKeyVisibility,
  onToggleUseSharedApi,
  onToggleActive,
  onSave,
  onSavePersonal,
  onSaveShared,
  onDeletePersonal,
  onDeleteShared,
  isSaving = false,
}: ProviderCardProps) {
  const canUseSharedApi = canUseSharedApiProp !== undefined
    ? canUseSharedApiProp
    : (isSuperAdmin || (allowNormalAdmins && hasSharedApi));
  
  const hasModels = provider.models && provider.models.length > 0;

  const currentPersonalApiKey = useMemo(() => 
    personalApiKey || (useSharedApi ? '' : apiKey), 
    [personalApiKey, useSharedApi, apiKey]
  );
  const currentSharedApiKey = useMemo(() => 
    sharedApiKey || (useSharedApi && isSuperAdmin ? apiKey : ''), 
    [sharedApiKey, useSharedApi, isSuperAdmin, apiKey]
  );
  const currentHasStoredPersonalApiKey = useMemo(() => 
    hasStoredPersonalApiKey || (useSharedApi ? false : hasStoredApiKey), 
    [hasStoredPersonalApiKey, useSharedApi, hasStoredApiKey]
  );
  const currentHasStoredSharedApiKey = useMemo(() => 
    hasStoredSharedApiKey || (useSharedApi && isSuperAdmin ? hasStoredApiKey : false), 
    [hasStoredSharedApiKey, useSharedApi, isSuperAdmin, hasStoredApiKey]
  );
  const currentShowPersonalApiKey = useMemo(() => 
    showPersonalApiKey !== undefined ? showPersonalApiKey : (useSharedApi ? false : showApiKey), 
    [showPersonalApiKey, useSharedApi, showApiKey]
  );
  const currentShowSharedApiKey = useMemo(() => 
    showSharedApiKey !== undefined ? showSharedApiKey : (useSharedApi && isSuperAdmin ? showApiKey : false), 
    [showSharedApiKey, useSharedApi, isSuperAdmin, showApiKey]
  );

  const handleSharedApiKeyChange = useCallback((value: string) => {
    onSharedApiKeyChange ? onSharedApiKeyChange(value) : onApiKeyChange(value);
  }, [onSharedApiKeyChange, onApiKeyChange]);

  const handlePersonalApiKeyChange = useCallback((value: string) => {
    onPersonalApiKeyChange ? onPersonalApiKeyChange(value) : onApiKeyChange(value);
  }, [onPersonalApiKeyChange, onApiKeyChange]);

  const handleSharedApiKeyVisibility = useCallback(() => {
    onToggleSharedApiKeyVisibility ? onToggleSharedApiKeyVisibility() : onToggleApiKeyVisibility();
  }, [onToggleSharedApiKeyVisibility, onToggleApiKeyVisibility]);

  const handlePersonalApiKeyVisibility = useCallback(() => {
    onTogglePersonalApiKeyVisibility ? onTogglePersonalApiKeyVisibility() : onToggleApiKeyVisibility();
  }, [onTogglePersonalApiKeyVisibility, onToggleApiKeyVisibility]);

  const ApiKeyField = ({
    label,
    apiKey,
    showApiKey,
    hasStoredApiKey,
    onApiKeyChange,
    onToggleVisibility,
    onDelete,
    onSave,
    isSaving,
    fieldId,
    placeholder,
    description,
    icon: Icon,
    iconColor,
  }: {
    label: string;
    apiKey: string;
    showApiKey: boolean;
    hasStoredApiKey: boolean;
    onApiKeyChange: (value: string) => void;
    onToggleVisibility: () => void;
    onDelete?: () => void;
    onSave?: (apiKeyValue?: string) => void;
    isSaving: boolean;
    fieldId: string;
    placeholder: string;
    description: string;
    icon: any;
    iconColor: string;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempApiKey, setTempApiKey] = useState(apiKey);

    useEffect(() => {
      setTempApiKey(apiKey);
    }, [apiKey]);

    const handleSave = () => {
      if (onSave) {
        const trimmedValue = tempApiKey.trim();
        onApiKeyChange(trimmedValue);
        onSave(trimmedValue);
        setIsEditing(false);
      }
    };

    const handleCancel = () => {
      setTempApiKey(apiKey);
      setIsEditing(false);
    };

    const handleDelete = () => {
      if (onDelete) {
        onApiKeyChange('');
        setIsEditing(false);
        setTempApiKey('');
        onDelete();
      }
    };

  return (
      <div className="p-4 bg-gradient-to-br from-bg/50 to-bg/30 rounded-lg border border-br hover:border-primary/30 transition-all">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-1.5 rounded-lg ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="text-sm font-semibold block text-font-p truncate">{label}</Label>
            <p className="text-xs text-font-s mt-0.5 truncate">{description}</p>
          </div>
          {hasStoredApiKey && (
            <Badge variant="green" className="text-xs h-5 px-2 flex-shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              ذخیره شده
            </Badge>
          )}
        </div>

          <div className="space-y-3">
            <div className="relative">
              <Input
              id={fieldId}
                type={showApiKey ? "text" : "password"}
              value={isEditing ? tempApiKey : (hasStoredApiKey && !showApiKey && apiKey ? maskApiKey(apiKey, false) : (apiKey || ''))}
              onChange={(e) => {
                const newValue = e.target.value;
                setTempApiKey(newValue);
                if (!isEditing) {
                  onApiKeyChange(newValue);
                }
              }}
              onFocus={() => {
                if (hasStoredApiKey && !isEditing && apiKey) {
                  setIsEditing(true);
                  setTempApiKey(apiKey);
                } else if (!hasStoredApiKey) {
                  setIsEditing(true);
                }
              }}
              placeholder={placeholder}
              className="pr-10 pl-10 font-mono text-xs h-9"
              disabled={isSaving && !isEditing}
                autoComplete="new-password"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 border-0 shadow-none bg-transparent hover:bg-transparent text-font-s hover:text-font-p z-10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                onToggleVisibility();
                }}
                disabled={isSaving}
                title={showApiKey ? 'مخفی کردن' : 'نمایش'}
              >
              {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>

              {apiKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 border-0 shadow-none bg-transparent hover:bg-transparent text-font-s hover:text-red-1 z-10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  if (isEditing) {
                    setTempApiKey('');
                  } else {
                    onApiKeyChange('');
                  }
                  }}
                  disabled={isSaving}
                  title="پاک کردن"
                >
                <X className="h-3.5 w-3.5" />
                </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
              <Button
                type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !tempApiKey.trim()}
                  className="flex-1 gap-1.5 h-8 text-xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      ذخیره
                    </>
                  )}
              </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="gap-1.5 h-8 text-xs"
                >
                  <X className="h-3 w-3" />
                  انصراف
                </Button>
              </>
            ) : (
              <>
                {hasStoredApiKey && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      disabled={isSaving}
                      className="flex-1 gap-1.5 h-8 text-xs"
                    >
                      <Edit2 className="h-3 w-3" />
                      ویرایش
                    </Button>
                    {onDelete && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="gap-1.5 h-8 text-xs text-red-1 hover:text-red-2 hover:border-red-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        حذف
                      </Button>
                    )}
                  </>
                )}
                {!hasStoredApiKey && onSave && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const valueToSave = isEditing ? tempApiKey.trim() : apiKey.trim();
                      if (valueToSave && onSave) {
                        onApiKeyChange(valueToSave);
                        onSave(valueToSave);
                      }
                    }}
                    disabled={isSaving || !(isEditing ? tempApiKey.trim() : apiKey.trim())}
                    className="w-full gap-1.5 h-8 text-xs"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3" />
                        ذخیره API Key
                      </>
                    )}
                </Button>
              )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const [activeTab, setActiveTab] = useState<'shared' | 'personal'>(useSharedApi ? 'shared' : 'personal');

  useEffect(() => {
    setActiveTab(useSharedApi ? 'shared' : 'personal');
  }, [useSharedApi]);

  return (
    <CardContent className="pt-4 pb-4 space-y-4">
      {!hasModels && (
        <div className="p-3 bg-amber/10 border border-amber/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-1 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-1 mb-1">
                این Provider هنوز مدل فعالی ندارد
              </p>
              <p className="text-xs text-font-s leading-relaxed">
                برای استفاده از این Provider، ابتدا آن را فعال کنید و API Key خود را تنظیم نمایید.
              </p>
            </div>
          </div>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {onToggleActive && (
          <div className="p-3 bg-gradient-to-r from-bg/80 to-bg/40 rounded-lg border border-br">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-semibold block text-font-p truncate">وضعیت</Label>
                <p className="text-xs text-font-s mt-0.5 truncate">
                  {isActive ? '✅ فعال' : '❌ غیرفعال'}
                  </p>
                </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={isActive}
                  onCheckedChange={onToggleActive}
                  disabled={isSaving}
                  className="scale-90"
                />
                <Badge variant={isActive ? "green" : "gray"} className="text-xs min-w-[50px] text-center">
                  {isActive ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {canUseSharedApi && (
          <div className="p-3 bg-gradient-to-r from-bg/80 to-bg/40 rounded-lg border border-br">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-semibold block text-font-p truncate">نوع API Key</Label>
                <p className="text-xs text-font-s mt-0.5 truncate">
                  {useSharedApi ? 'API مشترک' : 'API شخصی'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={useSharedApi}
                  onCheckedChange={onToggleUseSharedApi}
                  disabled={isSaving}
                  className={`scale-90 ${useSharedApi
                    ? "data-[state=checked]:bg-blue-1 data-[state=unchecked]:bg-gray-1"
                    : "data-[state=checked]:bg-purple-1 data-[state=unchecked]:bg-gray-1"
                  }`}
                />
                <Badge
                  variant={useSharedApi ? "default" : "outline"}
                  className={`text-xs min-w-[50px] text-center ${useSharedApi ? 'bg-blue/10 text-blue-1 border-blue/20' : 'bg-purple/10 text-purple-1 border-purple/20'}`}
                >
                  {useSharedApi ? 'مشترک' : 'شخصی'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {isSuperAdmin && canUseSharedApi ? (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'shared' | 'personal')} className="w-full">
            <TabsList className="w-full justify-start gap-4">
              <TabsTrigger value="shared" className="gap-2">
                <Users className="h-4 w-4" />
                API مشترک
                {currentHasStoredSharedApiKey && (
                  <Badge variant="green" className="text-xs h-4 px-1.5">ذخیره شده</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="personal" className="gap-2">
                <User className="h-4 w-4" />
                API شخصی
                {currentHasStoredPersonalApiKey && (
                  <Badge variant="green" className="text-xs h-4 px-1.5">ذخیره شده</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shared">
              <ApiKeyField
                label="API مشترک"
                apiKey={currentSharedApiKey}
                showApiKey={currentShowSharedApiKey}
                hasStoredApiKey={currentHasStoredSharedApiKey}
                onApiKeyChange={handleSharedApiKeyChange}
                onToggleVisibility={handleSharedApiKeyVisibility}
                onDelete={onDeleteShared}
                onSave={onSaveShared || (useSharedApi ? onSave : undefined)}
                isSaving={isSaving}
                fieldId={`shared-api-key-${provider.id}`}
                placeholder="وارد کردن API Key مشترک"
                description="این API Key برای همه ادمین‌ها قابل استفاده است"
                icon={Users}
                iconColor="bg-blue/10 text-blue-1"
              />
            </TabsContent>

            <TabsContent value="personal">
              <ApiKeyField
                label="API شخصی"
                apiKey={currentPersonalApiKey}
                showApiKey={currentShowPersonalApiKey}
                hasStoredApiKey={currentHasStoredPersonalApiKey}
                onApiKeyChange={handlePersonalApiKeyChange}
                onToggleVisibility={handlePersonalApiKeyVisibility}
                onDelete={onDeletePersonal}
                onSave={onSavePersonal || ((!useSharedApi || !isSuperAdmin) ? onSave : undefined)}
                isSaving={isSaving}
                fieldId={`personal-api-key-${provider.id}`}
                placeholder="وارد کردن API Key شخصی"
                description="این API Key فقط برای شما قابل استفاده است"
                icon={User}
                iconColor="bg-purple/10 text-purple-1"
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-br">
              <User className="h-4 w-4 text-purple-1" />
              <Label className="text-sm font-semibold text-font-p">API شخصی</Label>
              {currentHasStoredPersonalApiKey && (
                <Badge variant="green" className="text-xs">ذخیره شده</Badge>
              )}
            </div>
            <ApiKeyField
              label="API شخصی"
              apiKey={currentPersonalApiKey}
              showApiKey={currentShowPersonalApiKey}
              hasStoredApiKey={currentHasStoredPersonalApiKey}
              onApiKeyChange={handlePersonalApiKeyChange}
              onToggleVisibility={handlePersonalApiKeyVisibility}
              onDelete={onDeletePersonal}
              onSave={onSavePersonal || ((!useSharedApi || !isSuperAdmin) ? onSave : undefined)}
              isSaving={isSaving}
              fieldId={`personal-api-key-${provider.id}`}
              placeholder="وارد کردن API Key شخصی"
              description="این API Key فقط برای شما قابل استفاده است"
              icon={User}
              iconColor="bg-purple/10 text-purple-1"
            />
            {!isSuperAdmin && useSharedApi && !currentHasStoredPersonalApiKey && (
              <div className="p-3 bg-blue/10 border border-blue/20 rounded-lg mt-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-1 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-font-s">
                    ✅ از API مشترک استفاده می‌شود. نیازی به وارد کردن API key شخصی نیست.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CardContent>
  );
}

