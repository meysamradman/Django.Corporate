"use client";

import { Card, CardContent } from '@/components/elements/Card';
import { CardWithIcon } from '@/components/elements/CardWithIcon';
import { Button } from '@/components/elements/Button';
import { Media } from '@/types/shared/media';
import { Volume2, Save, Download, Play, Pause } from 'lucide-react';
import { useState, useRef } from 'react';

interface GeneratedAudioDisplayProps {
    generatedMedia: Media | null;
    generatedAudioUrl: string | null;
    text: string;
    saveToDb: boolean;
    onSaveToDb: () => void;
    onSelect: () => void;
    onReset: () => void;
}

export function GeneratedAudioDisplay({
    generatedMedia,
    generatedAudioUrl,
    text,
    saveToDb,
    onSaveToDb,
    onSelect,
    onReset,
}: GeneratedAudioDisplayProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    if (!generatedMedia && !generatedAudioUrl) {
        return null;
    }

    const audioUrl = generatedMedia?.file || generatedAudioUrl;

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleDownload = () => {
        if (audioUrl) {
            const link = document.createElement('a');
            link.href = audioUrl;
            link.download = generatedMedia?.title || `podcast_${Date.now()}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <CardWithIcon
            icon={Volume2}
            title={
                <>
                    پادکست تولید شده
                    {!saveToDb && generatedAudioUrl && (
                        <span className="text-xs text-orange-1 bg-orange px-2 py-1 rounded">
                            (ذخیره نشده)
                        </span>
                    )}
                </>
            }
            iconBgColor="bg-purple"
            iconColor="stroke-purple-2"
            borderColor="border-b-purple-1"
            className="hover:shadow-lg transition-all duration-300"
            headerClassName="pb-3 border-b"
        >
            <div className="space-y-4">
                <div className="bg-bg/40 border border-br rounded-lg p-4">
                    <audio
                        ref={audioRef}
                        src={audioUrl || undefined}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        className="w-full"
                    />
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handlePlayPause}
                            variant="outline"
                            size="icon"
                            className="flex-shrink-0"
                        >
                            {isPlaying ? (
                                <Pause className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5" />
                            )}
                        </Button>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-font-p mb-1">
                                {generatedMedia?.title || text.substring(0, 50) + '...'}
                            </div>
                            <div className="text-xs text-font-s">
                                {generatedMedia ? 'ذخیره شده در Media Library' : 'فایل موقت'}
                            </div>
                        </div>
                        <Button
                            onClick={handleDownload}
                            variant="outline"
                            size="icon"
                            className="flex-shrink-0"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    {generatedMedia ? (
                        <>
                            <Button
                                onClick={onSelect}
                                className="flex-1"
                                variant="default"
                            >
                                انتخاب این فایل صوتی
                            </Button>
                            <Button
                                onClick={onReset}
                                variant="outline"
                            >
                                تولید جدید
                            </Button>
                        </>
                    ) : generatedAudioUrl ? (
                        <>
                            <Button
                                onClick={onSaveToDb}
                                className="flex-1"
                                variant="default"
                            >
                                <Save className="h-4 w-4" />
                                ذخیره در دیتابیس
                            </Button>
                            <Button
                                onClick={onSelect}
                                className="flex-1"
                                variant="outline"
                                disabled
                            >
                                انتخاب (ابتدا ذخیره کنید)
                            </Button>
                            <Button
                                onClick={onReset}
                                variant="outline"
                            >
                                تولید جدید
                            </Button>
                        </>
                    ) : null}
                </div>
            </div>
        </CardWithIcon>
    );
}

