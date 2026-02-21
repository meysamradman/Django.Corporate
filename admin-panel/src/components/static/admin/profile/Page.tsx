import { useMemo, useState } from "react";
import { adminProfileDefault, adminProperties } from "./mock";
import { HeadCard } from "./HeadCard";
import { PropList } from "./PropList";

export function AdminProfilePage() {
  const [form] = useState(adminProfileDefault);

  const fullName = useMemo(() => `${form.firstName} ${form.lastName}`.trim(), [form.firstName, form.lastName]);

  return (
    <section className="space-y-6 pb-8 min-h-[calc(100dvh-100px)]">
      <HeadCard
        fullName={fullName}
        roleTitle={form.roleTitle}
        firstName={form.firstName}
        lastName={form.lastName}
        birthDate={form.birthDate}
        mobile={form.mobile}
        phone={form.phone}
        email={form.email}
        province={form.province}
        city={form.city}
        address={form.address}
        bio={form.bio}
        nationalId={form.nationalId}
        createdAt={form.createdAt}
        active={form.active}
        avatarUrl={form.avatarUrl}
        coverUrl={form.coverUrl}
        profileViews={form.profileViews}
        propertyCount={form.propertyCount}
        ticketCount={form.ticketCount}
      />

      <PropList items={adminProperties} />
    </section>
  );
}
