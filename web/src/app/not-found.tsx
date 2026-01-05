"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/elements/Button';
import { Card, CardContent } from '@/components/elements/Card';
import { Home, ArrowRight } from 'lucide-react';

export default function NotFound() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
            </div>

            <div className="w-full max-w-2xl relative z-10">
                <Card>
                    <CardContent className="py-8 md:py-12">
                        <div className="text-center space-y-6">
                            {/* Animated 404 Number */}
                            <div className="relative">
                                <div className="text-[120px] md:text-[180px] font-bold leading-none bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-pulse">
                                    404
                                </div>
                                <div className="absolute inset-0 text-[120px] md:text-[180px] font-bold leading-none text-primary/10 blur-2xl">
                                    404
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <h1 className="text-3xl md:text-4xl font-bold text-font-p">
                                    صفحه مورد نظر یافت نشد
                                </h1>
                                <p className="text-lg text-font-s max-w-md mx-auto">
                                    متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا حذف شده است.
                                </p>
                            </div>

                            {/* Suggestions */}
                            <div className="pt-4 space-y-3">
                                <p className="text-sm font-medium text-font-s">ممکن است بخواهید:</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Link href="/" className="w-full sm:w-auto">
                                        <Button 
                                            variant="default" 
                                            size="lg" 
                                            className="w-full sm:w-auto gap-2 group"
                                        >
                                            <Home className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            بازگشت به صفحه اصلی
                                        </Button>
                                    </Link>
                                    <Button 
                                        variant="outline" 
                                        size="lg" 
                                        onClick={() => window.history.back()}
                                        className="w-full sm:w-auto gap-2 group"
                                    >
                                        <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        بازگشت به صفحه قبل
                                    </Button>
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="pt-8 flex justify-center gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full bg-primary/30 ${
                                            mounted ? 'animate-bounce' : ''
                                        }`}
                                        style={{
                                            animationDelay: `${i * 0.2}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
