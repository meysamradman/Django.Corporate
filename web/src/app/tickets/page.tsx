'use client';

import { useState } from 'react';
import { ticketsApi } from '@/api/tickets/route';

export default function TicketsPage() {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = {
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        ...(formData.message && { message: formData.message }),
      };

      console.log('Sending ticket data:', data);
      const response = await ticketsApi.createTicket(data);
      console.log('Received response:', response);

      if (response.success && response.data) {
        setSuccess('تیکت با موفقیت ایجاد شد!');
        setCreatedTicket(response.data);
        console.log('Created ticket:', response.data);
        setFormData({
          subject: '',
          description: '',
          priority: 'medium',
          message: '',
        });
      } else {
        setError('خطا در ایجاد تیکت: پاسخ نامعتبر از سرور');
      }
    } catch (err: any) {
      let errorMessage = err.message || 'خطا در ایجاد تیکت';
      
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('ticket_ticket')) {
        errorMessage = 'جدول تیکت در دیتابیس وجود ندارد. لطفاً migration ها را اجرا کنید:\n\ncd Backend\npython manage.py migrate';
      }
      
      setError(errorMessage);
      console.error('Error creating ticket:', err);
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ثبت تیکت جدید - تست</h1>
        <p className="text-gray-600">این صفحه برای تست ایجاد تیکت است</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">{success}</p>
          {createdTicket && createdTicket.public_id && (
            <div className="mt-4 p-4 bg-white rounded border border-green-200">
              <p className="text-sm text-gray-700 mb-2">
                <strong>شناسه تیکت:</strong> {createdTicket.public_id}
              </p>
              <p className="text-sm text-gray-700 mb-4">
                <strong>موضوع:</strong> {createdTicket.subject}
              </p>
              <a
                href={`/tickets/${createdTicket.public_id}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                مشاهده تیکت و ارسال پاسخ
              </a>
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
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              موضوع تیکت <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: مشکل در ورود به حساب کاربری"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              توضیحات <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="لطفاً مشکل یا درخواست خود را به طور کامل توضیح دهید..."
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              اولویت
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">کم</option>
              <option value="medium">متوسط</option>
              <option value="high">زیاد</option>
              <option value="urgent">فوری</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              پیام اولیه (اختیاری)
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="اگر پیام اضافی دارید، اینجا بنویسید..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال ارسال...' : 'ارسال تیکت'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
