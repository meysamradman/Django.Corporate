import { type RefObject, type KeyboardEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/elements/Button';
import { Textarea } from '@/components/elements/Textarea';
import { Loader2, Send, Paperclip, X } from 'lucide-react';
import { ProviderSelector } from './ProviderSelector';
import type { AvailableProvider } from '@/types/ai/ai';

interface ChatInputProps {
    compact?: boolean;
    message: string;
    setMessage: (message: string) => void;
    sending: boolean;
    selectedProvider: string;
    handleSend: () => void;
    handleKeyPress: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    
    attachedFile: File | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    handleFileUpload: () => void;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    removeAttachedFile: () => void;
    
    loadingProviders: boolean;
    availableProviders: AvailableProvider[];
    setSelectedProvider: (provider: string) => void;
    showProviderDropdown: boolean;
    setShowProviderDropdown: (show: boolean) => void;
    selectedProviderData?: AvailableProvider;
}

export function ChatInput({
    compact = false,
    message,
    setMessage,
    sending,
    selectedProvider,
    handleSend,
    handleKeyPress,
    textareaRef,
    attachedFile,
    fileInputRef,
    handleFileUpload,
    handleFileChange,
    removeAttachedFile,
    loadingProviders,
    availableProviders,
    setSelectedProvider,
    showProviderDropdown,
    setShowProviderDropdown,
    selectedProviderData,
}: ChatInputProps) {
    if (compact) {
        return (
            <div className="flex-shrink-0 border-t border-br bg-card p-3">
                <div className="relative w-full">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="پیام خود را بنویسید..."
                        className="min-h-[44px] max-h-[120px] resize-none w-full border border-br bg-card pr-10 pl-12 rounded-lg text-xs py-2"
                        disabled={sending || !selectedProvider}
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                        <Button
                            onClick={handleSend}
                            disabled={sending || !message.trim() || !selectedProvider}
                            size="icon"
                            className="h-7 w-7 bg-primary hover:bg-primary/90 text-static-w rounded-lg"
                        >
                            {sending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Send className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="mt-2 px-1">
                    <p className="text-[10px] text-font-s text-center leading-relaxed">
                        💡 چت‌ها موقتاً در مرورگر ذخیره می‌شوند (حداکثر 50 پیام)
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="sticky bottom-0 left-0 right-0 bg-transparent backdrop-blur-sm z-10">
            <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="bg-card rounded-2xl shadow-lg border border-br p-4">
                    <div className="relative">
                        {attachedFile && (
                            <div className="mb-2 p-2 bg-bg rounded-lg border border-br flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-font-s" />
                                    <span className="text-sm text-font-p">{attachedFile.name}</span>
                                    <span className="text-xs text-font-s">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeAttachedFile}
                                    className="p-1 hover:bg-card rounded transition-colors"
                                >
                                    <X className="h-4 w-4 text-font-s" />
                                </button>
                            </div>
                        )}
                        
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="پیام..."
                            rows={1}
                            disabled={sending || !selectedProvider}
                            className="w-full px-4 py-3 resize-none focus:outline-none text-base text-font-p placeholder-font-s bg-transparent overflow-hidden rounded-lg"
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
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-br">
                        <ProviderSelector
                            compact={false}
                            loadingProviders={loadingProviders}
                            availableProviders={availableProviders}
                            selectedProvider={selectedProvider}
                            setSelectedProvider={setSelectedProvider}
                            showProviderDropdown={showProviderDropdown}
                            setShowProviderDropdown={setShowProviderDropdown}
                            selectedProviderData={selectedProviderData}
                        />

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleFileUpload}
                                className="p-2.5 text-font-s hover:text-font-p hover:bg-bg rounded-full transition-colors"
                                aria-label="آپلود فایل"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
