import React from "react";
import Link from "next/link";
import type { PublicGeneralSettings } from "@/types/settings/general";
import type { FooterAboutItem, FooterSectionItem } from "@/types/settings/footer";

type FooterProps = {
  generalSettings?: PublicGeneralSettings | null;
  about?: FooterAboutItem | null;
  sections?: FooterSectionItem[];
};

export default function Footer({ generalSettings, about, sections = [] }: FooterProps) {
  const aboutTitle = (about?.title ?? "درباره ما").trim() || "درباره ما";
  const aboutText = (about?.text ?? "").trim();
  const siteName = (generalSettings?.site_name ?? "").trim();

  const items = Array.isArray(sections) ? sections.slice(0, 3) : [];
  const isExternal = (href: string) => /^https?:\/\//i.test(href);

  return (
    <footer className="bg-footer">
      <div className="grid grid-cols-4 container mr-auto ml-auto pt-10 pb-10 gap-8">
        <div className="flex flex-col gap-4">
          <h4 className="text-wt">{aboutTitle}</h4>
          {siteName ? <p className="text-wt text-sm">{siteName}</p> : null}
          {aboutText ? <p className="text-wt text-sm leading-7">{aboutText}</p> : null}
        </div>

        {items.map((section) => (
          <div key={`${section.title}-${section.order}`} className="flex flex-col gap-4">
            <h4 className="text-wt">{section.title}</h4>
            <div className="flex flex-col gap-2">
              {(section.links || []).map((l) =>
                isExternal(l.href) ? (
                  <a
                    key={`${l.title}-${l.order}`}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wt text-sm"
                  >
                    {l.title}
                  </a>
                ) : (
                  <Link key={`${l.title}-${l.order}`} href={l.href} className="text-wt text-sm">
                    {l.title}
                  </Link>
                )
              )}
              {(!section.links || section.links.length === 0) ? (
                <p className="text-wt text-sm">-</p>
              ) : null}
            </div>
          </div>
        ))}

        {items.length < 3
          ? Array.from({ length: 3 - items.length }).map((_, idx) => (
              <div key={`empty-${idx}`} className="flex flex-col gap-4">
                <h4 className="text-wt">-</h4>
                <p className="text-wt text-sm">-</p>
              </div>
            ))
          : null}
      </div>
    </footer>
  );
}