import { FooterAboutSection } from "./FooterAboutSection";
import { FooterSections } from "./FooterSections";
import { FooterLinks } from "./FooterLinks";

export function FooterSettingsSection() {
    return (
        <div className="space-y-6">
            <FooterAboutSection />
            <FooterSections />
            <FooterLinks />
        </div>
    );
}
