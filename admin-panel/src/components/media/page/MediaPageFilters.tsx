import { Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/elements/Input';
import { Checkbox } from '@/components/elements/Checkbox';
import { ProtectedButton } from '@/core/permissions';
import { DataTableFacetedFilterSimple } from '@/components/tables/DataTableFacetedFilterSimple';
import { DataTableDateRangeFilter } from '@/components/tables/DataTableDateRangeFilter';

interface MediaPageFiltersProps {
    allSelected: boolean;
    someSelected: boolean;
    selectedCount: number;
    searchValue?: string;
    fileType?: string;
    mounted: boolean;
    dateRange: { from?: string; to?: string };
    onSelectAll: (checked: boolean) => void;
    onSearchChange: (value: string) => void;
    onDeleteSelected: () => void;
    onFileTypeChange: (value: string) => void;
    onDateRangeChange: (range: { from?: string; to?: string }) => void;
}

export function MediaPageFilters({
    allSelected,
    someSelected,
    selectedCount,
    searchValue,
    fileType,
    mounted,
    dateRange,
    onSelectAll,
    onSearchChange,
    onDeleteSelected,
    onFileTypeChange,
    onDateRangeChange,
}: MediaPageFiltersProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="select-all"
                        checked={allSelected || (someSelected ? 'indeterminate' : false)}
                        onCheckedChange={onSelectAll}
                        aria-label="انتخاب همه موارد این صفحه"
                        className="h-4 w-4"
                    />
                    <span className="text-xs text-font-s">انتخاب همه</span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-font-s" />
                    <Input
                        placeholder="جستجو..."
                        defaultValue={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {selectedCount > 0 && (
                    <ProtectedButton
                        permission="media.delete"
                        variant="destructive"
                        onClick={onDeleteSelected}
                        size="sm"
                    >
                        <Trash2 className="h-4 w-4" />
                        حذف ({selectedCount})
                    </ProtectedButton>
                )}
            </div>

            <div className="flex flex-col flex-wrap gap-2 md:flex-row md:items-center md:gap-2">
                {mounted && (
                    <DataTableFacetedFilterSimple
                        title="نوع فایل"
                        options={[
                            { label: 'تصویر', value: 'image' },
                            { label: 'ویدیو', value: 'video' },
                            { label: 'صوت', value: 'audio' },
                            { label: 'مستند', value: 'pdf' },
                        ]}
                        value={fileType === 'all' ? undefined : fileType}
                        onChange={(value) => {
                            if (value === undefined || value === null) {
                                onFileTypeChange('all');
                            } else {
                                onFileTypeChange(value as string);
                            }
                        }}
                        multiSelect={false}
                        showSearch={false}
                    />
                )}

                <DataTableDateRangeFilter
                    title="بازه تاریخ"
                    value={dateRange}
                    onChange={onDateRangeChange}
                    placeholder="انتخاب بازه تاریخ"
                />
            </div>
        </div>
    );
}