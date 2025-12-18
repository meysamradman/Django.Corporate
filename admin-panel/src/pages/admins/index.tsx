/**
 * 👥 Admins List Page
 * مسیر: /admins
 */

export default function AdminsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--font-p)' }}>
          لیست ادمین‌ها
        </h1>
      </div>

      <div 
        className="rounded-lg border p-6"
        style={{ 
          backgroundColor: 'var(--card)',
          borderColor: 'var(--br)'
        }}
      >
        <p style={{ color: 'var(--font-s)' }}>
          صفحه لیست ادمین‌ها
        </p>
      </div>
    </div>
  );
}
