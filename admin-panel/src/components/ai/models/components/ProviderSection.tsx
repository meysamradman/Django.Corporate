import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/elements/Badge';
import { Button } from '@/components/elements/Button';
import { ModelCard } from './ModelCard';

interface ProviderSectionProps {
    providerName: string;
    allModels: any[];
    paginatedModels: any[];
    totalPages: number;
    currentPage: number;
    needsPagination: boolean;
    capability: 'chat' | 'content' | 'image' | 'audio';
    expandedModels: Set<number | string>;
    isSaving: boolean;
    onToggleModel: (
        modelId: number | string,
        currentStatus: boolean,
        isOpenRouter?: boolean,
        providerSlug?: string,
        modelName?: string
    ) => void;
    onToggleExpand: (modelId: number | string) => void;
    onPageChange: (providerName: string, page: number) => void;
}

const getProviderIcon = (providerName: string) => {
    const name = providerName.toLowerCase();
    if (name.includes('openai') || name.includes('gpt')) return '🤖';
    if (name.includes('google') || name.includes('gemini')) return '🔷';
    if (name.includes('anthropic') || name.includes('claude')) return '🧠';
    if (name.includes('openrouter')) return '🌐';
    if (name.includes('deepseek')) return '🚀';
    return '⚡';
};

const getCapabilityLabel = (capability: string) => {
    switch (capability) {
        case 'chat': return 'چت';
        case 'content': return 'محتوا';
        case 'image': return 'تصویر';
        case 'audio': return 'صدا';
        default: return capability;
    }
};

export function ProviderSection({
    providerName,
    allModels,
    paginatedModels,
    totalPages,
    currentPage,
    needsPagination,
    capability,
    expandedModels,
    isSaving,
    onToggleModel,
    onToggleExpand,
    onPageChange,
}: ProviderSectionProps) {
    return (
        <div id={`provider-${providerName}`} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{getProviderIcon(providerName)}</span>
                    <div>
                        <h3 className="text-lg font-semibold text-font-p">{providerName}</h3>
                        <p className="text-xs text-font-s mt-0.5">
                            {allModels.length} مدل {getCapabilityLabel(capability)}
                            {needsPagination && totalPages > 1 && ` • صفحه ${currentPage} از ${totalPages}`}
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-xs">
                    {allModels.length} مدل
                </Badge>
            </div>

            {/* Models Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {paginatedModels.map((model) => {
                    const modelId = typeof model.id === 'string' ? model.id : model.id;
                    const isExpanded = expandedModels.has(modelId);
                    const isActive = model.is_active ?? false;

                    return (
                        <ModelCard
                            key={model.id}
                            model={model}
                            isExpanded={isExpanded}
                            isActive={isActive}
                            isSaving={isSaving}
                            onToggle={onToggleModel}
                            onToggleExpand={onToggleExpand}
                        />
                    );
                })}
            </div>

            {/* Pagination */}
            {needsPagination && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-border/50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(providerName, currentPage - 1)}
                        disabled={currentPage === 1}
                        className="gap-1"
                    >
                        <ChevronRight className="w-4 h-4" />
                        قبلی
                    </Button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onPageChange(providerName, pageNum)}
                                    className="min-w-[2.5rem]"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(providerName, currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                    >
                        بعدی
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
