'use client';

import { useState, useEffect } from 'react';
import { emailsApi } from '@/api/emails/route';
import { formFieldsApi, type FormField } from '@/api/form-fields/route';

export default function EmailsPage() {
  const [formData, setFormData] = useState<Record<string, any>>({
    source: 'website',
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<any>(null);

  // دریافت فیلدهای فرم از پنل ادمین
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await formFieldsApi.getFieldsForPlatform('website');
        if (response.success && response.data) {
          const sortedFields = response.data.sort((a, b) => a.order - b.order);
          setFields(sortedFields);
          
          // مقداردهی اولیه formData براساس فیلدهای پنل ادمین
          const initialData: Record<string, any> = {
            source: 'website',
          };
          sortedFields.forEach(field => {
            initialData[field.field_key] = '';
          });
          setFormData(initialData);
        }
      } catch (err) {
        console.error('Error fetching form fields:', err);
        setError('خطا در دریافت فیلدهای فرم');
      } finally {
        setFieldsLoading(false);
      }
    };

    fetchFields();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // ارسال تمام داده‌های فرم به بک‌اند
      const response = await emailsApi.createEmail(formData);

      if (response.success) {
        setSuccess('پیام شما با موفقیت ارسال شد!');
        setCreatedEmail(response.data);
        // Reset form - پاک کردن همه فیلدها
        const resetData: Record<string, any> = {
          source: 'website',
        };
        fields.forEach(field => {
          resetData[field.field_key] = '';
        });
        setFormData(resetData);
      }
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال پیام');
      console.error('Error creating email:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // رندر فیلد براساس نوع
  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.field_key,
      name: field.field_key,
      value: formData[field.field_key] || '',
      onChange: handleChange,
      required: field.required,
      className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      placeholder: field.placeholder || '',
    };

    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={6}
          />
        );
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">انتخاب کنید</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'email':
        return <input {...commonProps} type="email" />;
      case 'tel':
        return <input {...commonProps} type="tel" />;
      case 'number':
        return <input {...commonProps} type="number" />;
      case 'date':
        return <input {...commonProps} type="date" />;
      default:
        return <input {...commonProps} type="text" />;
    }
  };

  if (fieldsLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">در حال بارگذاری فرم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">فرم تماس</h1>
        <p className="text-gray-600">لطفاً فرم زیر را پر کنید تا با شما تماس بگیریم</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{success}</p>
          {createdEmail && (
            <div className="mt-4 p-4 bg-white rounded border border-green-200">
              <p className="text-sm text-gray-700 mb-2">
                <strong>شناسه پیام:</strong> {createdEmail.public_id}
              </p>
              <p className="text-sm text-gray-700">
                <strong>موضوع:</strong> {createdEmail.subject}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                پیام شما دریافت شد و در اسرع وقت پاسخ داده می‌شود.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* همه فیلدها از پنل ادمین */}
          {fields.map((field) => (
            <div key={field.id}>
              <label 
                htmlFor={field.field_key} 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال ارسال...' : 'ارسال پیام'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">نکات مهم:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>پیام شما در پنل ادمین بررسی می‌شود</li>
          <li>پاسخ شما از طریق ایمیل یا تلفن اطلاع‌رسانی می‌شود</li>
          <li>لطفاً اطلاعات تماس خود را به درستی وارد کنید</li>
        </ul>
      </div>
    </div>
  );
}
