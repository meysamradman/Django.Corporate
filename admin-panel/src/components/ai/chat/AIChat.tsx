import { useRef } from 'react';
import { Button } from '@/components/elements/Button';
import { Trash2, Sparkles } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { mediaService } from '@/components/media/services';
import { useChatMessages, useChatProviders, useChatHandlers } from './hooks';
import { ChatMessageList, ChatInput } from './components';

interface AIChatProps {
    compact?: boolean;
}

export function AIChat({ compact = false }: AIChatProps = {}) {
    const { user } = useAuth();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const permissionsObject = user?.permissions as any;
    const permissionsArray = (permissionsObject?.permissions || []) as string[];
    const hasAIPermission = permissionsArray.some((p: string) =>
        p === 'all' || p === 'ai.manage' || p.startsWith('ai.')
    );

    const {
        availableProviders,
        loadingProviders,
        selectedProvider,
        setSelectedProvider,
        selectedModel,
        setSelectedModel,
        showProviderDropdown,
        setShowProviderDropdown,
        selectedProviderData,
    } = useChatProviders({
        compact,
        hasAIPermission,
        userAuthenticated: !!user,
    });

    const {
        messages,
        messagesEndRef,
        addMessage,
        removeLastUserMessage,
        clearMessages,
    } = useChatMessages({ compact, userAuthenticated: !!user });

    const {
        message,
        setMessage,
        sending,
        attachedFile,
        fileInputRef,
        handleSend,
        handleKeyPress,
        handleFileUpload,
        handleFileChange,
        removeAttachedFile,
    } = useChatHandlers({
        selectedProvider,
        selectedModel,
        messages,
        addMessage,
        removeLastUserMessage,
        textareaRef,
    });

    const getAdminDisplayName = () => {
        if (user?.profile?.full_name) return user.profile.full_name;
        if (user?.full_name) return user.full_name;
        if (user?.profile?.first_name && user?.profile?.last_name) {
            return `${user.profile.first_name} ${user.profile.last_name}`;
        }
        return user?.email || 'ادمین';
    };

    const getAdminInitials = () => {
        const name = getAdminDisplayName();
        const words = name.trim().split(' ');
        if (words.length >= 2) {
            return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
        }
        return name.charAt(0).toUpperCase();
    };

    const getAdminProfileImageUrl = () => {
        if (user?.profile?.profile_picture?.file_url) {
            return mediaService.getMediaUrlFromObject(user.profile.profile_picture);
        }
        return null;
    };

    const handleClearChat = () => {
        clearMessages();
    };

    if (compact) {
        return (
            <div className="flex flex-col h-full relative">
                <div className="shrink-0 flex items-center justify-between p-3 border-b border-br bg-bg/50">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-font-p">چت با AI</h3>
                    </div>
                    {messages.length > 0 && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleClearChat}
                            className="h-7 w-7 border-0 hover:bg-bg text-font-s"
                            aria-label="پاک کردن چت"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                <ChatMessageList
                    messages={messages}
                    sending={sending}
                    compact={true}
                    getAdminDisplayName={getAdminDisplayName}
                    getAdminInitials={getAdminInitials}
                    getAdminProfileImageUrl={getAdminProfileImageUrl}
                    messagesEndRef={messagesEndRef}
                />

                <ChatInput
                    compact={true}
                    message={message}
                    setMessage={setMessage}
                    sending={sending}
                    selectedProvider={selectedProvider}
                    handleSend={handleSend}
                    handleKeyPress={handleKeyPress}
                    textareaRef={textareaRef}
                    attachedFile={attachedFile}
                    fileInputRef={fileInputRef}
                    handleFileUpload={handleFileUpload}
                    handleFileChange={handleFileChange}
                    removeAttachedFile={removeAttachedFile}
                    loadingProviders={loadingProviders}
                    availableProviders={availableProviders}
                    setSelectedProvider={setSelectedProvider}
                    showProviderDropdown={showProviderDropdown}
                    setShowProviderDropdown={setShowProviderDropdown}
                    selectedProviderData={selectedProviderData}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                />
            </div>
        );
    }

    const renderChatContent = () => {
        if (messages.length === 0) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-3xl space-y-8">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-blue rounded-2xl flex items-center justify-center mb-6">
                                <Sparkles className="h-8 w-8 text-blue-1" />
                            </div>
                            <h1 className="text-2xl font-semibold text-font-p mb-2">
                                چطور می‌تونم کمکت کنم؟
                            </h1>
                            <p className="text-base text-font-s">
                                من اینجام تا به هر سوال یا کاری کمکت کنم
                            </p>
                        </div>

                        <ChatInput
                            compact={false}
                            message={message}
                            setMessage={setMessage}
                            sending={sending}
                            selectedProvider={selectedProvider}
                            handleSend={handleSend}
                            handleKeyPress={handleKeyPress}
                            textareaRef={textareaRef}
                            attachedFile={attachedFile}
                            fileInputRef={fileInputRef}
                            handleFileUpload={handleFileUpload}
                            handleFileChange={handleFileChange}
                            removeAttachedFile={removeAttachedFile}
                            loadingProviders={loadingProviders}
                            availableProviders={availableProviders}
                            setSelectedProvider={setSelectedProvider}
                            showProviderDropdown={showProviderDropdown}
                            setShowProviderDropdown={setShowProviderDropdown}
                            selectedProviderData={selectedProviderData}
                            variant="center"
                        />
                    </div>
                </div>
            );
        }

        return (
            <>
                <ChatMessageList
                    messages={messages}
                    sending={sending}
                    compact={false}
                    getAdminDisplayName={getAdminDisplayName}
                    getAdminInitials={getAdminInitials}
                    getAdminProfileImageUrl={getAdminProfileImageUrl}
                    messagesEndRef={messagesEndRef}
                />

                <ChatInput
                    compact={false}
                    message={message}
                    setMessage={setMessage}
                    sending={sending}
                    selectedProvider={selectedProvider}
                    handleSend={handleSend}
                    handleKeyPress={handleKeyPress}
                    textareaRef={textareaRef}
                    attachedFile={attachedFile}
                    fileInputRef={fileInputRef}
                    handleFileUpload={handleFileUpload}
                    handleFileChange={handleFileChange}
                    removeAttachedFile={removeAttachedFile}
                    loadingProviders={loadingProviders}
                    availableProviders={availableProviders}
                    setSelectedProvider={setSelectedProvider}
                    showProviderDropdown={showProviderDropdown}
                    setShowProviderDropdown={setShowProviderDropdown}
                    selectedProviderData={selectedProviderData}
                    selectedModel={selectedModel}
                    setSelectedModel={setSelectedModel}
                    variant="bottom"
                />
            </>
        );
    };

    return (
        <div className="relative flex flex-col h-full">
            {renderChatContent()}
        </div>
    );
}

