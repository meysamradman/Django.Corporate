import { type RefObject, type KeyboardEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/elements/Button';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupTextarea,
} from "@/components/elements/InputGroup";
import { Textarea } from "@/components/elements/Textarea";
import { Loader2, Paperclip, X, ArrowUpIcon, Send } from 'lucide-react';
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
    variant?: 'center' | 'bottom';
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
    variant = 'bottom',
}: ChatInputProps) {
    if (compact) {
        return (
            <div className="shrink-0 border-t border-br bg-card p-3">
                <div className="flex items-center justify-end pb-2">
                    <ProviderSelector
                        compact={true}
                        loadingProviders={loadingProviders}
                        availableProviders={availableProviders}
                        selectedProvider={selectedProvider}
                        setSelectedProvider={setSelectedProvider}
                        showProviderDropdown={showProviderDropdown}
                        setShowProviderDropdown={setShowProviderDropdown}
                        selectedProviderData={selectedProviderData}
                    />
                </div>
                <div className="relative w-full">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="پیام خود را بنویسید..."
                        className="min-h-11 max-h-30 resize-none w-full border border-br bg-card pr-10 pl-12 rounded-lg text-xs py-2"
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

    const containerClasses = variant === 'center'
        ? "w-full max-w-3xl mx-auto"
        : "sticky bottom-0 left-0 right-0 bg-transparent backdrop-blur-sm z-10";

    const wrapperClasses = variant === 'center'
        ? "w-full"
        : "max-w-4xl mx-auto px-4 py-4";

    return (
        <div className={containerClasses}>
            <div className={wrapperClasses}>
                <div className="bg-card rounded-2xl shadow-lg border border-br p-2">
                    {attachedFile && (
                        <div className="mb-2 p-2 bg-bg rounded-lg border border-br flex items-center justify-between mx-2">
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

                    <InputGroup className="border-0 shadow-none">
                        <InputGroupTextarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="چیزی بپرسید..."
                            disabled={sending}
                            className="min-h-11 max-h-50 text-base px-2 py-3"
                        />

                        <InputGroupAddon align="block-start" className="gap-2 px-2 pb-2">
                            <ProviderSelector
                                compact={false}
                                loadingProviders={loadingProviders}
                                availableProviders={availableProviders}
                                selectedProvider={selectedProvider}
                                setSelectedProvider={setSelectedProvider}
                                showProviderDropdown={showProviderDropdown}
                                setShowProviderDropdown={setShowProviderDropdown}
                                selectedProviderData={selectedProviderData}
                                variant="plus"
                            />

                            <InputGroupButton
                                variant="outline"
                                className="rounded-full gap-2 px-2 border-0 hover:bg-bg text-font-s"
                                size="sm"
                                onClick={handleFileUpload}
                                title="آپلود فایل"
                            >
                                <Paperclip className="size-5" />
                            </InputGroupButton>

                            <div className="flex-1" />

                            <InputGroupButton
                                variant="default"
                                className="rounded-full w-9 h-9 p-0 flex items-center justify-center bg-primary hover:bg-primary/90 text-static-w shadow-sm"
                                size="icon-sm"
                                disabled={sending || !message.trim() || !selectedProvider}
                                onClick={handleSend}
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ArrowUpIcon className="h-5 w-5" />
                                )}
                                <span className="sr-only">Send</span>
                            </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
            </div>
        </div>
    );
}
