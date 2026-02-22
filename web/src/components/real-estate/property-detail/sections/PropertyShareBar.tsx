import ShareButtons from "@/components/shared/share/ShareButtons";

type PropertyShareBarProps = {
  id: number;
  slug?: string | null;
  title?: string | null;
};

export default function PropertyShareBar({ id, slug, title }: PropertyShareBarProps) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const detailPath = slug ? `/properties/${id}/${encodeURIComponent(slug)}` : `/properties/id/${id}`;
  const shareUrl = `${baseUrl}${detailPath}`;

  return (
    <section className="bg-wt border border-br/50 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-black text-font-p">اشتراک‌گذاری ملک</div>
        <ShareButtons
          url={shareUrl}
          title={title || "ملک"}
          text="مشاهده جزئیات این ملک"
        />
      </div>
    </section>
  );
}
