import { useParams } from 'react-router-dom';

/**
 * ✏️ Edit Admin Page
 * مسیر: /admins/:id/edit
 */

export default function AdminsEditPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--font-p)' }}>
          ویرایش ادمین #{id}
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
          فرم ویرایش ادمین
        </p>
      </div>
    </div>
  );
}
