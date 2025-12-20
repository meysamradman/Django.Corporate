import type { ChangeEvent } from 'react';
import { FileItem } from './FileItem';
import type { MediaFile } from '../hooks/useMediaUpload';

interface FileListProps {
  files: MediaFile[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRemoveFile: (id: string) => void;
  onUpdateMetadata: (id: string, field: keyof MediaFile, value: any) => void;
  onCoverFileChange: (event: ChangeEvent<HTMLInputElement>, fileId: string) => void;
  onRemoveCoverFile: (id: string) => void;
  disabled?: boolean;
}

export function FileList({ 
  files, 
  activeTab, 
  onTabChange, 
  onRemoveFile,
  onUpdateMetadata,
  onCoverFileChange,
  onRemoveCoverFile,
  disabled = false 
}: FileListProps) {

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-font-p">فایل‌های آماده آپلود ({files.length})</h3>
      </div>
      
      <div className="space-y-4 overflow-y-auto p-1">
        {files.map(file => (
          <FileItem
            key={`file-item-${file.id}`}
            file={file}
            onRemove={onRemoveFile}
            onUpdateMetadata={onUpdateMetadata}
            onCoverFileChange={onCoverFileChange}
            onRemoveCoverFile={onRemoveCoverFile}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
