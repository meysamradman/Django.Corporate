"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Button } from '@/components/elements/Button';
import { Label } from '@/components/elements/Label';
import { AIContentGenerationResponse } from '@/api/ai/route';
import { FileText, Copy, Check } from 'lucide-react';
import { msg } from '@/core/messages/message';

interface ContentDisplayProps {
    content: AIContentGenerationResponse;
    copiedField: string | null;
    onCopy: (text: string, fieldName: string) => void;
}

export function ContentDisplay({ content, copiedField, onCopy }: ContentDisplayProps) {
    return (
        <CardWithIcon
            icon={FileText}
            title={content.h1}
            iconBgColor="bg-pink"
            iconColor="stroke-pink-2"
            borderColor="border-b-pink-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3 border-b"
            titleExtra={
                <CardDescription className="mt-2">
                    {content.word_count} کلمه | 
                    زمان تولید: {content.generation_time_ms}ms |
                </CardDescription>
            }
        >
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">{msg.aiUI('fullContent')}</Label>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onCopy(content.content, 'content_html');
                                }}
                                className="h-8"
                            >
                                {copiedField === 'content_html' ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2 text-green-1" />
                                        {msg.aiUI('copiedHTML')}
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        {msg.aiUI('copyHTML')}
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const tempDiv = document.createElement('div');
                                    tempDiv.innerHTML = content.content;
                                    const textContent = tempDiv.textContent || tempDiv.innerText || '';
                                    onCopy(textContent, 'content');
                                }}
                                className="h-8"
                            >
                                {copiedField === 'content' ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2 text-green-1" />
                                        {msg.ai('copied')}
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" />
                                        {msg.aiUI('copyText')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="p-6 bg-bg/30 rounded-lg border">
                        <article 
                            className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-base prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-semibold"
                            dangerouslySetInnerHTML={{ __html: content.content }} 
                        />
                    </div>
                </div>
        </CardWithIcon>
    );
}

