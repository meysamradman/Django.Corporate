import type { ChangeEvent } from 'react';
import { 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  FileText,
  File
} from "lucide-react";
import { Button } from "@/components/elements/Button";
import { TruncatedText } from "@/components/elements/TruncatedText";
import type { MediaFile } from '../hooks/useMediaUpload';
import { getFileCategory, formatBytes } from '../services';
import { FileItemMetadataFields } from './FileItemMetadataFields';
import { FileItemCoverPicker } from './FileItemCoverPicker';

interface FileItemProps {
  file: MediaFile;
  onRemove: (id: string) => void;
  onUpdateMetadata: (id: string, field: keyof MediaFile, value: any) => void;
  onCoverFileChange: (event: ChangeEvent<HTMLInputElement>, fileId: string) => void;
  onRemoveCoverFile: (id: string) => void;
  disabled?: boolean;
}

export function FileItem({ 
  file, 
  onRemove, 
  onUpdateMetadata, 
  onCoverFileChange,
  onRemoveCoverFile,
  disabled = false 
}: FileItemProps) {
  const fileCategory = getFileCategory(file.file);
  const needsCover = ['video', 'audio', 'document'].includes(fileCategory);

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file);
    
    switch (category) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <FileVideo className="h-5 w-5" />;
      case 'audio': return <FileAudio className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      default: return <File className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'image': return 'تصویر';
      case 'video': return 'ویدیو';
      case 'audio': return 'صوتی';
      case 'document': return 'سند';
      default: return category;
    }
  };

  const renderFilePreview = () => {
    if (fileCategory === 'image') {
      return (
        <img 
          src={URL.createObjectURL(file.file)} 
          alt={file.title || file.file.name}
          className="w-full h-full object-contain" 
        />
      );
    }
    
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-lg bg-bg flex items-center justify-center mb-3 text-font-p">
          {getFileIcon(file.file)}
        </div>
        <TruncatedText 
          text={file.file.name}
          maxLength={35}
          className="text-sm text-font-s text-center"
          showTooltip={true}
        />
      </div>
    );
  };

  return (
    <div className="border rounded-xl p-5 bg-card hover:shadow-lg transition-all duration-200 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <div className="w-11 h-11 rounded-lg bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary border border-primary/20">
            {getFileIcon(file.file)}
          </div>
        </div>
        <div className="grow min-w-0">
          <div className="mb-2">
            <TruncatedText 
              text={file.file.name}
              maxLength={45}
              className="text-sm font-semibold text-font-p"
              showTooltip={true}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-font-s">
            <span className="px-2.5 py-1 bg-bg rounded-md font-medium">{formatBytes(file.file.size)}</span>
            <span className="px-2.5 py-1 bg-bg rounded-md font-medium">{getCategoryLabel(fileCategory)}</span>
          </div>
        </div>

        <div className="shrink-0">
          {file.status === 'pending' && (
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={() => onRemove(file.id)}
              className="h-8 w-8 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {file.status === 'uploading' && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {file.status === 'success' && (
            <CheckCircle className="h-5 w-5 text-green-1" />
          )}
          {file.status === 'error' && (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
        </div>
      </div>

      {file.status === 'uploading' && (
        <div className="w-full bg-bg rounded-full h-2 overflow-hidden">
          <div 
            className="bg-linear-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}

      {file.status === 'error' && file.error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{file.error}</span>
          </p>
        </div>
      )}

      {file.status !== 'success' && (
        <div className="space-y-5">
          {!needsCover ? (
            <>
              <div className="relative w-full h-64 bg-bg/30 rounded-lg overflow-hidden border shadow-sm">
                {renderFilePreview()}
              </div>

              <div className="space-y-4">
                <FileItemMetadataFields
                  fileId={file.id}
                  title={file.title || ''}
                  altText={file.alt_text || ''}
                  disabled={disabled}
                  onTitleChange={(value) => onUpdateMetadata(file.id, 'title', value)}
                  onAltTextChange={(value) => onUpdateMetadata(file.id, 'alt_text', value)}
                />
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative w-full h-48 bg-bg/30 rounded-lg overflow-hidden border shadow-sm">
                  {renderFilePreview()}
                </div>

                <FileItemCoverPicker
                  file={file}
                  fileCategory={fileCategory}
                  disabled={disabled}
                  onCoverFileChange={onCoverFileChange}
                  onRemoveCoverFile={onRemoveCoverFile}
                />
              </div>

              <FileItemMetadataFields
                fileId={file.id}
                title={file.title || ''}
                altText={file.alt_text || ''}
                disabled={disabled}
                onTitleChange={(value) => onUpdateMetadata(file.id, 'title', value)}
                onAltTextChange={(value) => onUpdateMetadata(file.id, 'alt_text', value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
