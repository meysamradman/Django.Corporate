"use client";

import React from "react";

type CopyRightProps = {
  text?: string | null;
  link?: string | null;
};

export default function CopyRight({ text, link }: CopyRightProps) {
  const year = new Date().getFullYear();
  const fallbackText = `© ${year} تمامی حقوق محفوظ است.`;
  const finalText = (text ?? "").trim() || fallbackText;
  const finalLink = (link ?? "").trim();

  return (
    <div className="bg-cprt h-20 flex items-center">
      <div className="container mr-auto ml-auto">
        <p className="text-wt text-center text-sm">
          {finalLink ? (
            <a
              href={finalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-wt hover:underline underline-offset-4"
            >
              {finalText}
            </a>
          ) : (
            finalText
          )}
        </p>
      </div>
    </div>
  );
}