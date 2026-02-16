import type { Property, PropertyAgent } from "@/types/real-estate/property";

type PropertyAgentStickyProps = {
  property: Pick<Property, "title" | "agent">;
  className?: string;
};

function getInitials(agent: PropertyAgent) {
  const first = (agent.first_name || "").trim();
  const last = (agent.last_name || "").trim();

  const a = first ? first[0] : "";
  const b = last ? last[0] : "";
  const initials = `${a}${b}`.trim();

  if (initials) return initials;

  const full = (agent.full_name || "").trim();
  if (full) return full[0];
  return "A";
}

function normalizePhone(phone?: string | null) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^0-9+]/g, "");
  return digits || null;
}

export default function PropertyAgentSticky({
  property,
  className,
}: PropertyAgentStickyProps) {
  const agent = property.agent;
  if (!agent) return null;

  const name = (agent.full_name || "").trim() || "مشاور";
  const phone = normalizePhone(agent.phone);
  const email = (agent.email || "").trim() || null;

  const message = `سلام، برای «${property.title || "این ملک"}» پیام می‌دهم.`;
  const mailto = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
        `درخواست اطلاعات ملک: ${property.title || "ملک"}`
      )}&body=${encodeURIComponent(message)}`
    : null;

  const whatsapp = phone
    ? `https://wa.me/${encodeURIComponent(phone.replace(/^\+/, ""))}?text=${encodeURIComponent(
        message
      )}`
    : null;

  return (
    <aside
      className={
        className ||
        "w-full space-y-6 lg:sticky lg:top-24 transition-all self-start"
      }
    >
      <div className="bg-wt border border-br/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-br/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-br/50 bg-bg flex items-center justify-center">
                {agent.profile_picture_url ? (
                  <img
                    src={agent.profile_picture_url}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="text-sm font-black text-font-p">
                    {getInitials(agent)}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-sm font-black text-font-p truncate">
                  {name}
                </div>
                <a
                  href="/real-estate"
                  className="text-xs font-black text-blue-1 hover:underline"
                >
                  مشاهده آگهی‌ها
                </a>
              </div>
            </div>

            {phone ? (
              <a
                href={`tel:${phone}`}
                className="text-xs font-black text-font-p border border-br/50 rounded-xl px-3 py-2 bg-bg hover:bg-bg/70 transition-colors"
              >
                تماس
              </a>
            ) : null}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-3">
            <input
              className="w-full h-10 px-4 rounded-xl border border-br/50 bg-wt text-sm font-black text-font-p outline-none"
              placeholder="نام"
              name="name"
              autoComplete="name"
            />
            <input
              className="w-full h-10 px-4 rounded-xl border border-br/50 bg-wt text-sm font-black text-font-p outline-none"
              placeholder="شماره تماس"
              name="phone"
              autoComplete="tel"
            />
            <input
              className="w-full h-10 px-4 rounded-xl border border-br/50 bg-wt text-sm font-black text-font-p outline-none"
              placeholder="ایمیل"
              name="email"
              autoComplete="email"
            />
            <textarea
              className="w-full min-h-28 px-4 py-3 rounded-xl border border-br/50 bg-wt text-sm font-black text-font-p outline-none resize-none"
              name="message"
              defaultValue={message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {mailto ? (
              <a
                href={mailto}
                className="h-11 rounded-xl bg-static-b text-wt text-xs font-black flex items-center justify-center"
              >
                ارسال ایمیل
              </a>
            ) : (
              <div className="h-11 rounded-xl bg-br/30 text-font-s text-xs font-black flex items-center justify-center">
                ارسال ایمیل
              </div>
            )}

            {phone ? (
              <a
                href={`tel:${phone}`}
                className="h-11 rounded-xl border border-static-b text-static-b text-xs font-black flex items-center justify-center bg-wt"
              >
                تماس
              </a>
            ) : (
              <div className="h-11 rounded-xl border border-br/50 text-font-s text-xs font-black flex items-center justify-center bg-wt">
                تماس
              </div>
            )}
          </div>

          {whatsapp ? (
            <a
              href={whatsapp}
              className="h-11 rounded-xl border border-br/50 text-font-p text-xs font-black flex items-center justify-center bg-wt"
              target="_blank"
              rel="noreferrer"
            >
              واتساپ
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
