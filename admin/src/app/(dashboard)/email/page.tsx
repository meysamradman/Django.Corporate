"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { EmailSidebar, EmailList, EmailSearch, EmailToolbar, ComposeEmail, EmailDetailView, type ComposeEmailData } from "@/components/email";
import { Checkbox } from "@/components/elements/Checkbox";
import { emailApi, EmailMessage } from "@/api/email/route";
import { MailboxType } from "@/components/email/types";
import { toast } from "@/components/elements/Sonner";

// Dynamic imports for better performance
const ComposeEmailDialog = dynamic(() => import("@/components/email/ComposeEmail").then(mod => ({ default: mod.ComposeEmail })), {
  ssr: false,
});

export default function EmailPage() {
  const [selectedMailbox, setSelectedMailbox] = useState<MailboxType>("inbox");
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [replyToEmail, setReplyToEmail] = useState<EmailMessage | null>(null);

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      let statusFilter: string | undefined;
      if (selectedMailbox === "inbox") {
        statusFilter = "new";
      } else if (selectedMailbox === "draft") {
        statusFilter = "draft";
      } else if (selectedMailbox === "starred") {
        statusFilter = "replied";
      } else if (selectedMailbox === "spam") {
        statusFilter = "archived";
      }
      
      const response = await emailApi.getList({
        page: 1,
        size: 50,
        search: searchQuery || undefined,
        status: statusFilter,
      });
      setEmails(response.data);
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast.error("خطا در دریافت ایمیل‌ها");
    } finally {
      setLoading(false);
    }
  }, [selectedMailbox, searchQuery]);

  useEffect(() => {
    // برای تست و دیدن دیزاین، داده‌های تستی اضافه می‌کنیم
    if (true) { // تغییر این به false برای استفاده از API واقعی
      const mockEmails: EmailMessage[] = [
      {
        id: 1,
        public_id: "test-1",
        name: "علی احمدی",
        email: "ali@example.com",
        phone: "09123456789",
        subject: "پیام تستی برای Inbox",
        message: "این یک پیام تستی است برای دیدن دیزاین inbox. می‌خواهیم ببینیم چطور نمایش داده می‌شود.\n\nاین پیام شامل چند خط متن است تا بتوانیم دیزاین را بهتر ببینیم. می‌توانیم ببینیم که چطور متن‌های طولانی نمایش داده می‌شوند.\n\nاین یک متن طولانی است که برای تست اسکرول استفاده می‌شود. ما می‌خواهیم ببینیم که آیا صفحه به درستی اسکرول می‌شود یا نه. این متن باید به اندازه کافی طولانی باشد تا بتوانیم اسکرول را به راحتی مشاهده کنیم.\n\nلورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.\n\nکتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی و فرهنگ پیشرو در زبان فارسی ایجاد کرد. در این صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها و شرایط سخت تایپ به پایان رسد.\n\nاین یک متن طولانی دیگر است که برای تست اسکرول استفاده می‌شود. ما می‌خواهیم ببینیم که آیا صفحه به درستی اسکرول می‌شود یا نه. این متن باید به اندازه کافی طولانی باشد تا بتوانیم اسکرول را به راحتی مشاهده کنیم.\n\nلورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.\n\nکتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی و فرهنگ پیشرو در زبان فارسی ایجاد کرد. در این صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها و شرایط سخت تایپ به پایان رسد.\n\nاین یک متن طولانی دیگر است که برای تست اسکرول استفاده می‌شود. ما می‌خواهیم ببینیم که آیا صفحه به درستی اسکرول می‌شود یا نه. این متن باید به اندازه کافی طولانی باشد تا بتوانیم اسکرول را به راحتی مشاهده کنیم.",
        status: "new",
        status_display: "جدید",
        source: "website",
        source_display: "وبسایت",
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        has_attachments: true,
        is_new: true,
        is_replied: false,
        attachments: [
          {
            id: 1,
            filename: "document.pdf",
            file: "/uploads/document.pdf",
            file_size: 1024000,
            file_size_formatted: "1.0 MB",
            content_type: "application/pdf",
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            filename: "image.jpg",
            file: "/uploads/image.jpg",
            file_size: 512000,
            file_size_formatted: "500 KB",
            content_type: "image/jpeg",
            created_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        public_id: "test-2",
        name: "محمد رضایی",
        email: "mohammad@example.com",
        phone: "09123456790",
        subject: "پیش‌نویس ایمیل",
        message: "این یک پیش‌نویس است که هنوز ارسال نشده است. می‌توانید آن را ویرایش کنید.\n\nاین پیام می‌تواند شامل اطلاعات مهمی باشد که باید قبل از ارسال بررسی شود.\n\nاین یک متن طولانی است که برای تست اسکرول استفاده می‌شود. ما می‌خواهیم ببینیم که آیا صفحه به درستی اسکرول می‌شود یا نه. این متن باید به اندازه کافی طولانی باشد تا بتوانیم اسکرول را به راحتی مشاهده کنیم.\n\nلورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.\n\nکتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی و فرهنگ پیشرو در زبان فارسی ایجاد کرد. در این صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها و شرایط سخت تایپ به پایان رسد.",
        status: "read",
        status_display: "خوانده شده",
        source: "email",
        source_display: "ایمیل",
        ip_address: "192.168.1.101",
        has_attachments: false,
        is_new: false,
        is_replied: false,
        attachments: [],
        read_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 3,
        public_id: "test-3",
        name: "سارا کریمی",
        email: "sara@example.com",
        phone: "09123456791",
        subject: "پاسخ به ایمیل قبلی",
        message: "با تشکر از ایمیل قبلی شما. این پاسخ به پیام شماست.\n\nما از همکاری با شما خوشحال هستیم و منتظر پاسخ شما هستیم.\n\nاین یک متن طولانی است که برای تست اسکرول استفاده می‌شود. ما می‌خواهیم ببینیم که آیا صفحه به درستی اسکرول می‌شود یا نه. این متن باید به اندازه کافی طولانی باشد تا بتوانیم اسکرول را به راحتی مشاهده کنیم.\n\nلورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.\n\nکتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی و فرهنگ پیشرو در زبان فارسی ایجاد کرد. در این صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها و شرایط سخت تایپ به پایان رسد.",
        status: "replied",
        status_display: "پاسخ داده شده",
        source: "website",
        source_display: "وبسایت",
        ip_address: "192.168.1.102",
        reply_message: "با تشکر از تماس شما. ما در اسرع وقت با شما تماس خواهیم گرفت.\n\nاین یک پاسخ طولانی است که برای تست اسکرول استفاده می‌شود. ما می‌خواهیم ببینیم که آیا صفحه به درستی اسکرول می‌شود یا نه. این متن باید به اندازه کافی طولانی باشد تا بتوانیم اسکرول را به راحتی مشاهده کنیم.\n\nلورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.\n\nکتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی و فرهنگ پیشرو در زبان فارسی ایجاد کرد.",
        replied_at: new Date(Date.now() - 172800000).toISOString(),
        replied_by: 1,
        has_attachments: false,
        is_new: false,
        is_replied: true,
        attachments: [],
        read_at: new Date(Date.now() - 172800000).toISOString(),
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 4,
        public_id: "test-4",
        name: "رضا محمودی",
        email: "reza@example.com",
        phone: "09123456792",
        subject: "پیام مهم برای بررسی",
        message: "این یک پیام مهم است که نیاز به بررسی فوری دارد.\n\nلطفاً در اسرع وقت این پیام را بررسی کنید و پاسخ دهید.\n\nاین یک متن طولانی است که برای تست اسکرول استفاده می‌شود. ما می‌خواهیم ببینیم که آیا صفحه به درستی اسکرول می‌شود یا نه. این متن باید به اندازه کافی طولانی باشد تا بتوانیم اسکرول را به راحتی مشاهده کنیم.\n\nلورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.\n\nکتابهای زیادی در شصت و سه درصد گذشته، حال و آینده شناخت فراوان جامعه و متخصصان را می طلبد تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی و فرهنگ پیشرو در زبان فارسی ایجاد کرد. در این صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها و شرایط سخت تایپ به پایان رسد.",
        status: "new",
        status_display: "جدید",
        source: "mobile_app",
        source_display: "اپلیکیشن موبایل",
        ip_address: "192.168.1.103",
        has_attachments: true,
        is_new: true,
        is_replied: false,
        attachments: [
          {
            id: 3,
            filename: "report.xlsx",
            file: "/uploads/report.xlsx",
            file_size: 2048000,
            file_size_formatted: "2.0 MB",
            content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            created_at: new Date().toISOString(),
          },
        ],
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 5,
        public_id: "test-5",
        name: "فاطمه نوری",
        email: "fateme@example.com",
        phone: "09123456793",
        subject: "درخواست اطلاعات بیشتر",
        message: "لطفاً اطلاعات بیشتری در مورد محصولات خود ارسال کنید.\n\nما علاقه‌مند به همکاری با شما هستیم و نیاز به اطلاعات بیشتری داریم.",
        status: "read",
        status_display: "خوانده شده",
        source: "website",
        source_display: "وبسایت",
        ip_address: "192.168.1.104",
        has_attachments: false,
        is_new: false,
        is_replied: false,
        attachments: [],
        read_at: new Date(Date.now() - 259200000).toISOString(),
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: 6,
        public_id: "test-6",
        name: "حسن علوی",
        email: "hasan@example.com",
        phone: "09123456794",
        subject: "پیام خوانده شده",
        message: "این پیامی است که قبلاً خوانده شده است.\n\nاین پیام برای تست نمایش پیام‌های خوانده شده است.",
        status: "read",
        status_display: "خوانده شده",
        source: "email",
        source_display: "ایمیل",
        ip_address: "192.168.1.105",
        has_attachments: false,
        is_new: false,
        is_replied: false,
        attachments: [],
        read_at: new Date(Date.now() - 345600000).toISOString(),
        created_at: new Date(Date.now() - 345600000).toISOString(),
        updated_at: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        id: 7,
        public_id: "test-7",
        name: "زهرا احمدی",
        email: "zahra@example.com",
        phone: "09123456795",
        subject: "پیام جدید با پیوست",
        message: "این پیامی است که شامل فایل پیوست می‌باشد.\n\nلطفاً فایل‌های پیوست را بررسی کنید.",
        status: "new",
        status_display: "جدید",
        source: "website",
        source_display: "وبسایت",
        ip_address: "192.168.1.106",
        has_attachments: true,
        is_new: true,
        is_replied: false,
        attachments: [
          {
            id: 4,
            filename: "presentation.pptx",
            file: "/uploads/presentation.pptx",
            file_size: 5120000,
            file_size_formatted: "5.0 MB",
            content_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            created_at: new Date().toISOString(),
          },
          {
            id: 5,
            filename: "video.mp4",
            file: "/uploads/video.mp4",
            file_size: 10485760,
            file_size_formatted: "10.0 MB",
            content_type: "video/mp4",
            created_at: new Date().toISOString(),
          },
        ],
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 8,
        public_id: "test-8",
        name: "امیر حسینی",
        email: "amir@example.com",
        phone: "09123456796",
        subject: "درخواست همکاری",
        message: "ما می‌خواهیم با شما همکاری کنیم. لطفاً با ما تماس بگیرید.\n\nما یک شرکت معتبر هستیم و می‌خواهیم با شما در زمینه‌های مختلف همکاری کنیم.",
        status: "read",
        status_display: "خوانده شده",
        source: "api",
        source_display: "API",
        ip_address: "192.168.1.107",
        has_attachments: false,
        is_new: false,
        is_replied: false,
        attachments: [],
        read_at: new Date(Date.now() - 432000000).toISOString(),
        created_at: new Date(Date.now() - 432000000).toISOString(),
        updated_at: new Date(Date.now() - 432000000).toISOString(),
      },
      {
        id: 9,
        public_id: "test-9",
        name: "مریم صادقی",
        email: "maryam@example.com",
        phone: "09123456797",
        subject: "سوال در مورد محصولات",
        message: "سلام، من می‌خواهم در مورد محصولات شما اطلاعات بیشتری بدانم.\n\nلطفاً کاتالوگ محصولات را برای من ارسال کنید.",
        status: "new",
        status_display: "جدید",
        source: "website",
        source_display: "وبسایت",
        ip_address: "192.168.1.108",
        has_attachments: false,
        is_new: true,
        is_replied: false,
        attachments: [],
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 10,
        public_id: "test-10",
        name: "حسین محمدی",
        email: "hossein@example.com",
        phone: "09123456798",
        subject: "پیام با پاسخ ادمین",
        message: "این پیامی است که ادمین به آن پاسخ داده است.\n\nما منتظر پاسخ شما هستیم.",
        status: "replied",
        status_display: "پاسخ داده شده",
        source: "mobile_app",
        source_display: "اپلیکیشن موبایل",
        ip_address: "192.168.1.109",
        reply_message: "با تشکر از تماس شما. ما در اسرع وقت با شما تماس خواهیم گرفت و اطلاعات مورد نیاز را ارسال خواهیم کرد.",
        replied_at: new Date(Date.now() - 518400000).toISOString(),
        replied_by: 1,
        has_attachments: true,
        is_new: false,
        is_replied: true,
        attachments: [
          {
            id: 6,
            filename: "catalog.pdf",
            file: "/uploads/catalog.pdf",
            file_size: 3072000,
            file_size_formatted: "3.0 MB",
            content_type: "application/pdf",
            created_at: new Date().toISOString(),
          },
        ],
        read_at: new Date(Date.now() - 518400000).toISOString(),
        created_at: new Date(Date.now() - 518400000).toISOString(),
        updated_at: new Date(Date.now() - 518400000).toISOString(),
      },
      {
        id: 11,
        public_id: "test-11",
        name: "پیش‌نویس تستی",
        email: "draft@example.com",
        phone: "09123456799",
        subject: "پیش‌نویس بدون موضوع",
        message: "این یک پیش‌نویس است که هنوز کامل نشده است.\n\nمی‌توانم بعداً آن را تکمیل کنم و ارسال کنم.",
        status: "draft",
        status_display: "پیش‌نویس",
        source: "email",
        source_display: "ایمیل",
        ip_address: "192.168.1.110",
        has_attachments: false,
        is_new: false,
        is_replied: false,
        is_draft: true,
        attachments: [],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      ];

      // برای تست، از داده‌های mock استفاده می‌کنیم
      setEmails(mockEmails);
      setLoading(false);
    } else {
      // در حالت production از API استفاده کنید:
      fetchEmails();
    }
  }, []);

  const handleMailboxChange = useCallback((mailbox: MailboxType) => {
    setSelectedMailbox(mailbox);
    setSelectedEmails(new Set());
    setSelectedEmail(null);
  }, []);

  const handleSelectEmail = useCallback((emailId: number) => {
    setSelectedEmails(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(emailId)) {
        newSelected.delete(emailId);
      } else {
        newSelected.add(emailId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedEmails(prev => {
      if (prev.size === emails.length) {
        return new Set();
      }
      return new Set(emails.map((e) => e.id));
    });
  }, [emails]);

  const handleEmailClick = useCallback((email: EmailMessage) => {
    setSelectedEmail(email);
  }, []);

  const handleReplyEmail = useCallback((email: EmailMessage) => {
    setReplyToEmail(email);
    setComposeOpen(true);
  }, []);

  const handleDeleteEmail = useCallback(async (email: EmailMessage) => {
    try {
      setEmails(prev => prev.filter(e => e.id !== email.id));
      setSelectedEmail(null);
      toast.success("ایمیل با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting email:", error);
      toast.error("خطا در حذف ایمیل");
    }
  }, []);

  const handleMarkAsRead = useCallback(async () => {
    if (selectedEmails.size === 0) {
      toast.error("لطفا ابتدا ایمیل‌هایی را انتخاب کنید");
      return;
    }
    try {
      toast.success("ایمیل‌ها به عنوان خوانده شده علامت‌گذاری شدند");
      fetchEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      console.error("Error marking emails as read:", error);
      toast.error("خطا در علامت‌گذاری ایمیل‌ها");
    }
  }, [selectedEmails.size, fetchEmails]);

  const handleMarkAsUnread = useCallback(async () => {
    if (selectedEmails.size === 0) {
      toast.error("لطفا ابتدا ایمیل‌هایی را انتخاب کنید");
      return;
    }
    try {
      toast.success("ایمیل‌ها به عنوان نخوانده علامت‌گذاری شدند");
      fetchEmails();
      setSelectedEmails(new Set());
    } catch (error) {
      console.error("Error marking emails as unread:", error);
      toast.error("خطا در علامت‌گذاری ایمیل‌ها");
    }
  }, [selectedEmails.size, fetchEmails]);

  const handleSendEmail = useCallback(async (data: ComposeEmailData) => {
    try {
      await emailApi.create({
        name: data.to.split("@")[0],
        email: data.to,
        subject: data.subject,
        message: data.message,
        source: "email",
        status: "new",
      });
      toast.success("ایمیل با موفقیت ارسال شد");
      setReplyToEmail(null);
      fetchEmails();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("خطا در ارسال ایمیل");
    }
  }, [fetchEmails]);

  const handleSaveDraft = useCallback(async (data: ComposeEmailData) => {
    try {
      await emailApi.saveDraft({
        name: data.to.split("@")[0] || "بدون نام",
        email: data.to || "draft@example.com",
        subject: data.subject || "پیش‌نویس بدون موضوع",
        message: data.message || "",
        source: "email",
      });
      toast.success("پیش‌نویس با موفقیت ذخیره شد");
      fetchEmails();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("خطا در ذخیره پیش‌نویس");
    }
  }, [fetchEmails]);

  const mailboxCounts = useMemo(() => {
    return {
      inbox: emails.filter(e => e.status === 'new').length,
      sent: 0,
      draft: emails.filter(e => e.subject.includes('پیش‌نویس') || e.subject.includes('درفت')).length,
      starred: emails.filter(e => e.status === 'replied').length,
      spam: emails.filter(e => e.status === 'archived').length,
      trash: 0,
    };
  }, [emails]);

  return (
    <div className="flex h-[calc(100vh-4rem-4rem)] bg-card overflow-hidden rounded-lg border border-border shadow-[rgb(0_0_0/2%)_0px_6px_24px_0px,rgb(0_0_0/2%)_0px_0px_0px_1px]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 h-full overflow-hidden bg-card">
        <EmailSidebar
          selectedMailbox={selectedMailbox}
          onMailboxChange={handleMailboxChange}
          onComposeClick={() => setComposeOpen(true)}
          mailboxCounts={mailboxCounts}
        />
      </div>

      {/* Divider */}
      <div className="w-px bg-border flex-shrink-0"></div>

      {/* Main Content - List or Detail */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedEmail ? (
          <EmailDetailView
            email={selectedEmail}
            onReply={handleReplyEmail}
            onDelete={handleDeleteEmail}
            onBack={() => setSelectedEmail(null)}
          />
        ) : (
          <>
            {/* Header with Toolbar and Search */}
            <div className="border-b border-border p-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                {/* Search and Select All - Left side */}
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={
                      selectedEmails.size === emails.length && emails.length > 0
                        ? true
                        : selectedEmails.size > 0
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="انتخاب همه"
                  />
                  <EmailSearch value={searchQuery} onChange={setSearchQuery} />
                </div>

                {/* Toolbar Icons - Right side */}
                <div className="flex items-center gap-2">
                  <EmailToolbar
                    selectedCount={selectedEmails.size}
                    totalCount={emails.length}
                    onSelectAll={handleSelectAll}
                    onRefresh={fetchEmails}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAsUnread={handleMarkAsUnread}
                  />
                </div>
              </div>
            </div>

            {/* Email List */}
            <EmailList
              emails={emails}
              selectedEmails={selectedEmails}
              onSelectEmail={handleSelectEmail}
              onEmailClick={handleEmailClick}
              loading={loading}
            />
          </>
        )}
      </div>

      {/* Compose Email Dialog */}
      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) {
            setReplyToEmail(null);
          }
        }}
        onSend={handleSendEmail}
        onSaveDraft={handleSaveDraft}
        replyTo={replyToEmail}
      />
    </div>
  );
}
