'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ticketsApi } from '@/api/tickets/route';

export default function TicketDetailPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (token) {
      loadTicket();
    }
  }, [token]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await ticketsApi.getTicketByToken(token);
      
      if (response.success && response.data) {
        setTicket(response.data);
        setMessages(response.data.messages || []);
      } else {
        setError('تیکت یافت نشد');
      }
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت تیکت');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) return;
    
    try {
      setSending(true);
      const response = await ticketsApi.replyToTicket(token, replyMessage);
      
      if (response.success) {
        setReplyMessage('');
        await loadTicket();
      }
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پاسخ');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>وضعیت: {ticket.status}</span>
          <span>اولویت: {ticket.priority}</span>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="font-bold mb-4">توضیحات تیکت:</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="font-bold mb-4">پیام‌ها ({messages.length})</h2>
        
        <div className="space-y-4 mb-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-lg ${
                msg.sender_type === 'admin'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium">
                  {msg.sender_type === 'admin' ? 'پشتیبانی' : 'شما'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(msg.created_at).toLocaleString('fa-IR')}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>

        {ticket.status !== 'closed' && (
          <form onSubmit={handleSendReply}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              پاسخ شما:
            </label>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              placeholder="پیام خود را بنویسید..."
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {sending ? 'در حال ارسال...' : 'ارسال پاسخ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
