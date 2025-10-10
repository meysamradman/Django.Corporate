"use client"

import React from 'react';

export function TableLoadingCompact() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="flex gap-1">
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-duration:0.6s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s] [animation-duration:0.6s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.5s] [animation-duration:0.6s]" />
      </div>
    </div>
  );
}