import { CheckSquare, FileAudio, FileText, ImageOff, Play, Square } from 'lucide-react';
import { Input } from '@/components/elements/Input';
import { Skeleton } from '@/components/elements/Skeleton';
import { cn } from '@/core/utils/cn';
import { MediaPreview } from '@/components/media/base/MediaPreview';
import { PaginationControls } from '@/components/shared/paginations/PaginationControls';
import { DialogClose, DialogFooter } from '@/components/elements/Dialog';
import { Button } from '@/components/elements/Button';
import type { Media } from '@/types/shared/media';
import { DEFAULT_MEDIA_PAGE_SIZE } from '@/api/media/media';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/elements/Select';

interface ModalFilters {
    file_type?: string;
    page: number;
    limit: number;
}

interface MediaLibrarySelectTabProps {
    searchTerm: string;
    filters: ModalFilters;
    error: string | null;
    isLoading: boolean;
    mediaItems: Media[];
    selectedMedia: Record<string | number, Media>;
    selectedIds: string[];
    totalCount: number;
    onSearchTermChange: (value: string) => void;
    onFileTypeChange: (value: string) => void;
    onSelectMedia: (item: Media) => void;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newLimit: number) => void;
    onCancel: () => void;
    onConfirmSelection: () => void;
}

function getMediaTypeIcon(mediaType: string) {
    switch (mediaType) {
        case 'video':
            return <Play className="h-4 w-4" />;
        case 'audio':
            return <FileAudio className="h-4 w-4" />;
        case 'document':
        case 'pdf':
            return <FileText className="h-4 w-4" />;
        default:
            return null;
    }
}

export function MediaLibrarySelectTab({
    searchTerm,
    filters,
    error,
    isLoading,
    mediaItems,
    selectedMedia,
    selectedIds,
    totalCount,
    onSearchTermChange,
    onFileTypeChange,
    onSelectMedia,
    onPageChange,
    onPageSizeChange,
    onCancel,
    onConfirmSelection,
}: MediaLibrarySelectTabProps) {
    return (
        <>
            <div className="flex items-center gap-4 px-4 py-2 border-b">
                <Input
                    type="text"
                    placeholder="جستجو در رسانه‌ها..."
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    className="mb-4"
                />

                <div className="flex gap-2 mb-4">
                    <Select value={filters.file_type || 'all'} onValueChange={onFileTypeChange}>
                        <SelectTrigger className="w-30">
                            <SelectValue placeholder="نوع" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه انواع</SelectItem>
                            <SelectItem value="image">تصویر</SelectItem>
                            <SelectItem value="video">ویدئو</SelectItem>
                            <SelectItem value="audio">صوتی</SelectItem>
                            <SelectItem value="document">سند</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grow p-4 overflow-auto">
                {error && (
                    <div className="text-center text-red-1 p-4">{error}</div>
                )}
                {isLoading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-3">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <div
                                key={`media-skeleton-${index}`}
                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent"
                            >
                                <Skeleton className="h-full w-full" />
                                <div className="absolute top-1.5 right-1.5 z-10">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : mediaItems.length === 0 ? (
                    <div className="text-center text-font-s py-10">
                        <ImageOff className="mx-auto h-12 w-12" />
                        <p className="mt-4">No media items found matching filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-3">
                        {mediaItems.map((item) => {
                            const isSelected = !!selectedMedia[item.id];
                            const displayName = item.title || item.original_file_name || item.file_name || 'Untitled';

                            return (
                                <div
                                    key={`media-item-${item.media_type}-${item.id}`}
                                    className={cn(
                                        'relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
                                        isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-font-s/50'
                                    )}
                                    onClick={() => onSelectMedia(item)}
                                    role="button"
                                    aria-pressed={isSelected}
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectMedia(item); }}
                                >
                                    <div className="relative w-full h-full">
                                        <MediaPreview
                                            media={item}
                                            className="h-full"
                                            showPlayIcon={true}
                                        />
                                    </div>
                                    <div className={cn(
                                        'absolute top-1.5 right-1.5 z-10 p-0.5 rounded-full transition-colors',
                                        isSelected ? 'bg-primary text-static-w' : 'bg-card/60 text-font-s group-hover:bg-card'
                                    )}>
                                        {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                    </div>
                                    <div
                                        className={cn(
                                            'absolute bottom-0 left-0 right-0 p-1 text-[10px] z-0 transition-opacity duration-300',
                                            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        )}
                                    >
                                        <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />
                                        <div className="relative flex items-center gap-1">
                                            {getMediaTypeIcon(item.media_type || '')}
                                            <p className="font-medium truncate text-static-w" title={displayName}>{displayName}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {totalCount > filters.limit && !isLoading && (
                <div className="px-4 py-2 border-t">
                    <PaginationControls
                        currentPage={filters.page}
                        totalPages={Math.ceil(totalCount / (filters.limit || DEFAULT_MEDIA_PAGE_SIZE))}
                        onPageChange={onPageChange}
                        pageSize={filters.limit || DEFAULT_MEDIA_PAGE_SIZE}
                        onPageSizeChange={onPageSizeChange}
                        pageSizeOptions={[12, 24, 36, 48]}
                        showPageSize={true}
                        showInfo={true}
                        selectedCount={selectedIds.length}
                        totalCount={totalCount}
                        infoText={`${selectedIds.length} از ${totalCount} انتخاب شده`}
                        showFirstLast={true}
                        showPageNumbers={true}
                    />
                </div>
            )}

            <DialogFooter className="p-4 border-t">
                <DialogClose asChild>
                    <Button variant="outline" onClick={onCancel}>انصراف</Button>
                </DialogClose>
                <Button onClick={onConfirmSelection} disabled={selectedIds.length === 0}>
                    {`انتخاب ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
                </Button>
            </DialogFooter>
        </>
    );
}