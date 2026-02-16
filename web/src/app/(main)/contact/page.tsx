import React from "react";
import ContactInfo from "@/components/contact/ContactInfo";
import ContactMap from "@/components/contact/ContactMap";
import ContactFormClient from "@/components/contact/ContactFormClient";
import { contactSettingsApi } from "@/api/settings/contact";
import type { PublicContactSettings } from "@/types/settings/contact";

export default async function ContactPage() {
  let settings: PublicContactSettings | null = null;

  try {
    settings = await contactSettingsApi.getPublic();
  } catch {
    settings = null;
  }

  return (
    <div className="container mr-auto ml-auto py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black">تماس با ما</h1>
        <p className="mt-2 text-sm text-font-s">
          از طریق اطلاعات تماس یا فرم زیر با ما در ارتباط باشید.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        <div className="col-span-12 lg:col-span-6 space-y-5">
          <ContactInfo settings={settings} />
          <ContactFormClient />
        </div>

        <div className="col-span-12 lg:col-span-6">
          <ContactMap mapSettings={settings?.map_settings ?? null} />
        </div>
      </div>
    </div>
  );
}
