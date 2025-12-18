import { Link } from 'react-router-dom';

/**
 * 🧪 صفحه تست - برای بررسی عملکرد Layout و TopLoader
 */

export default function Test() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--font-p)' }}>
          صفحه تست
        </h1>
      </div>

      {/* Content Card */}
      <div 
        className="rounded-lg border p-6 space-y-4"
        style={{ 
          backgroundColor: 'var(--card)',
          borderColor: 'var(--br)'
        }}
      >
        <h2 className="text-xl font-semibold" style={{ color: 'var(--font-p)' }}>
          خوش آمدید به صفحه تست! 🎉
        </h2>
        
        <p style={{ color: 'var(--font-s)' }}>
          این صفحه برای تست عملکرد Layout و TopLoader ساخته شده است.
        </p>

        <div className="space-y-2">
          <p style={{ color: 'var(--font-s)' }}>
            ✅ اگر این صفحه رو می‌بینید، یعنی AdminLayout درست کار می‌کنه
          </p>
          <p style={{ color: 'var(--font-s)' }}>
            ✅ اگر Sidebar و Header رو می‌بینید، یعنی Layout ثابت هست
          </p>
          <p style={{ color: 'var(--font-s)' }}>
            ✅ اگر وقتی اومدید اینجا نوار بالا رو دیدید، یعنی TopLoader کار می‌کنه
          </p>
        </div>
      </div>

      {/* Test Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="rounded-lg border p-4"
            style={{ 
              backgroundColor: 'var(--card)',
              borderColor: 'var(--br)'
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--font-p)' }}>
              کارت تست {item}
            </h3>
            <p className="text-sm" style={{ color: 'var(--font-s)' }}>
              این یک کارت نمونه برای تست Layout است
            </p>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div 
        className="rounded-lg border p-4"
        style={{ 
          backgroundColor: 'var(--blue)',
          borderColor: 'var(--blue-1)'
        }}
      >
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--blue-2)' }}>
          💡 نکته: برای تست TopLoader، به صفحه Dashboard برگردید و دوباره به اینجا بیایید
        </p>
        
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ 
            backgroundColor: 'var(--primary)',
            color: 'var(--static-w)'
          }}
        >
          🏠 برگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
