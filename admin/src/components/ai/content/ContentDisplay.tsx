"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/elements/Card';
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
        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                        <FileText className="w-5 h-5 stroke-indigo-600" />
                    </div>
                    <CardTitle>{content.h1}</CardTitle>
                </div>
                <CardDescription>
                    {content.word_count} کلمه | 
                    زمان تولید: {content.generation_time_ms}ms |
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">{msg.aiUI('fullContent')}</Label>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    onCopy(content.content, 'content_html');
                                }}
                                className="h-8"
                            >
                                {copiedField === 'content_html' ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2 text-green-600" />
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
                                variant="ghost"
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
                                        <Check className="h-4 w-4 mr-2 text-green-600" />
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
                    <div className="p-6 bg-muted/30 rounded-lg border">
                        <article 
                            className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-base prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-foreground prose-strong:font-semibold"
                            dangerouslySetInnerHTML={{ __html: content.content }} 
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

