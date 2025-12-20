import type { ReactNode } from 'react';

interface HelpGuideContentProps {
    content: string | ReactNode;
}

export function HelpGuideContent({ content }: HelpGuideContentProps) {
    if (typeof content === 'string') {
        const lines = content.split('\n');
        return (
            <div className="text-sm text-font-s leading-relaxed space-y-2 text-right" dir="rtl">
                {lines.map((line, idx) => {
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                        <p key={idx} className="text-right">
                            {parts.map((part, partIdx) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                        <strong key={partIdx} className="text-font-p font-semibold">
                                            {part.slice(2, -2)}
                                        </strong>
                                    );
                                }
                                return <span key={partIdx}>{part}</span>;
                            })}
                        </p>
                    );
                })}
            </div>
        );
    }

    return <div className="text-sm text-font-s leading-relaxed text-right" dir="rtl">{content}</div>;
}

