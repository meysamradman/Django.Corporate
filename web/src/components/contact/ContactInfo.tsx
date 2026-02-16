import React from "react";
import type { PublicContactSettings } from "@/types/settings/contact";
import { Mail, Phone, Smartphone } from "lucide-react";

type ContactInfoProps = {
  settings: PublicContactSettings | null;
};

export default function ContactInfo({ settings }: ContactInfoProps) {
  const phones = settings?.phones ?? [];
  const mobiles = settings?.mobiles ?? [];
  const emails = settings?.emails ?? [];
  const socials = (settings?.social_media ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <section className="bg-wt border border-br/50 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-br/50">
        <h2 className="text-base font-black">راه‌های ارتباطی</h2>
        <p className="mt-1 text-sm text-font-s">برای ارتباط با ما از روش‌های زیر استفاده کنید.</p>
      </div>

      <div className="p-6 space-y-6">
        {(phones.length + mobiles.length + emails.length) === 0 ? (
          <div className="rounded-xl border border-br/50 bg-bg p-4 text-sm text-font-s">
            اطلاعات تماس هنوز ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-4">
            {phones.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-black">تلفن</div>
                <ul className="space-y-2">
                  {phones
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((item) => (
                      <li key={`phone-${item.phone_number}-${item.order}`} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-font-p">
                          <Phone className="w-4 h-4 text-font-s" />
                          <span className="font-black">{item.label || "تلفن"}</span>
                        </div>
                        <a href={`tel:${item.phone_number}`} className="text-sm text-blue-1 font-black hover:underline" dir="ltr">
                          {item.phone_number}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {mobiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-black">موبایل</div>
                <ul className="space-y-2">
                  {mobiles
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((item) => (
                      <li key={`mobile-${item.mobile_number}-${item.order}`} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-font-p">
                          <Smartphone className="w-4 h-4 text-font-s" />
                          <span className="font-black">{item.label || "موبایل"}</span>
                        </div>
                        <a href={`tel:${item.mobile_number}`} className="text-sm text-blue-1 font-black hover:underline" dir="ltr">
                          {item.mobile_number}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {emails.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-black">ایمیل</div>
                <ul className="space-y-2">
                  {emails
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((item) => (
                      <li key={`email-${item.email}-${item.order}`} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-font-p">
                          <Mail className="w-4 h-4 text-font-s" />
                          <span className="font-black">{item.label || "ایمیل"}</span>
                        </div>
                        <a href={`mailto:${item.email}`} className="text-sm text-blue-1 font-black hover:underline" dir="ltr">
                          {item.email}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {socials.length > 0 && (
          <div className="pt-4 border-t border-br/40">
            <div className="text-sm font-black mb-3">شبکه‌های اجتماعی</div>
            <div className="flex flex-wrap gap-3">
              {socials.map((s) => (
                <a
                  key={`${s.name}-${s.order}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-br/50 bg-bg px-3 py-2 hover:bg-bg/70 transition-colors"
                >
                  {s.icon_url ? (
                    // Use native img to avoid Next Image domain configuration.
                    <img src={s.icon_url} alt={s.name} className="w-5 h-5" loading="lazy" />
                  ) : (
                    <span className="w-5 h-5 rounded-md border border-br/50 bg-wt flex items-center justify-center text-[10px] font-black">
                      {(s.name || "").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm font-black">{s.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
