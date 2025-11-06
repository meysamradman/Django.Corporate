"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/elements/Button';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
  Quote, Undo, Redo, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Strikethrough, Code as CodeIcon, Code2, Minus,
  Highlighter, Type, Image as ImageIcon
} from 'lucide-react';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { mediaApi } from '@/api/media/route';
import { toast } from '@/components/elements/Sonner';
import { mediaService } from '@/components/media/services';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function TipTapEditor({ 
  content, 
  onChange, 
  placeholder,
  className 
}: TipTapEditorProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize extensions array to prevent recreation on every render
  const extensions = useMemo(() => [
    StarterKit,
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Strike,
    Code,
    CodeBlock,
    HorizontalRule,
    Image.configure({
      inline: true,
      allowBase64: false,
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-md',
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline cursor-pointer',
      },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'image'],
    }),
  ], []);

  // Memoize placeholder to prevent unnecessary re-renders
  const placeholderText = useMemo(() => placeholder || 'توضیحات را وارد کنید...', [placeholder]);

  // Memoize editor props to prevent recreation
  const editorProps = useMemo(() => ({
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-3 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-4',
      dir: 'rtl' as const,
      'data-placeholder': placeholderText,
    },
  }), [placeholderText]);

  // Memoize onUpdate handler
  const handleUpdate = useCallback(({ editor }: { editor: any }) => {
    onChange(editor.getHTML());
  }, [onChange]);

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: handleUpdate,
    editorProps,
  });

  // Sync content when it changes externally (only if different to prevent infinite loops)
  useEffect(() => {
    if (editor) {
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  // Optimized image upload handler with useCallback
  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    
    // Validate file type early
    if (!file.type.startsWith('image/')) {
      toast.error('فقط فایل‌های تصویری مجاز هستند');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('حجم فایل نباید از 5 مگابایت بیشتر باشد');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.substring(0, 100));
      formData.append('alt_text', file.name.substring(0, 200));

      const response = await mediaApi.uploadMedia(formData);
      
      if (response.metaData.status === 'success' && response.data) {
        const imageUrl = mediaService.getMediaUrlFromObject(response.data);
        
        if (imageUrl) {
          editor.chain().focus().setImage({ src: imageUrl, alt: response.data.alt_text || '' }).run();
          toast.success('عکس با موفقیت اضافه شد');
        }
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('خطا در آپلود عکس: ' + (error.message || 'خطای نامشخص'));
    } finally {
      setIsUploadingImage(false);
    }
  }, [editor]);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUpload]);

  if (!editor) {
    return (
      <div className="min-h-[200px] border rounded-md flex items-center justify-center">
        <div className="text-muted-foreground">در حال بارگذاری ویرایشگر...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 border rounded-md p-2 bg-gray-50">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="ضخیم"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="ایتالیک"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('underline') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="زیرخط"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label="خط خورده"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('code') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          aria-label="کد"
        >
          <CodeIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="عنوان 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="عنوان 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="عنوان 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 4 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          aria-label="عنوان 4"
        >
          <Heading4 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 5 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
          aria-label="عنوان 5"
        >
          <Heading5 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 6 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
          aria-label="عنوان 6"
        >
          <Heading6 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('paragraph') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          aria-label="پاراگراف"
        >
          <Type className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="لیست نقطه‌ای"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="لیست شماره‌دار"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="نقل قول"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="بلوک کد"
        >
          <Code2 className="h-4 w-4" />
        </Button>


        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          aria-label="خط افقی"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Highlight */}
        <Button
          type="button"
          variant={editor.isActive('highlight') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          aria-label="هایلایت"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        {/* Link */}
        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            if (editor.isActive('link')) {
              // اگر لینک فعال است، آن را حذف کن
              editor.chain().focus().unsetLink().run();
            } else {
              // اگر لینک فعال نیست، لینک جدید اضافه کن
              const url = window.prompt('لینک را وارد کنید:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }
          }}
          aria-label={editor.isActive('link') ? 'حذف لینک' : 'افزودن لینک'}
        >
          <LinkIcon className={`h-4 w-4 ${editor.isActive('link') ? 'text-red-500' : ''}`} />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('image') ? 'default' : 'ghost'}
          size="sm"
          onClick={handleImageButtonClick}
          disabled={isUploadingImage}
          aria-label="افزودن عکس"
        >
          {isUploadingImage ? (
            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Colors */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('textStyle', { color: '#000000' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setColor('#000000').run()}
            aria-label="مشکی"
            className="w-6 h-6 p-0"
            style={{ backgroundColor: '#000000' }}
          />
          <Button
            type="button"
            variant={editor.isActive('textStyle', { color: '#ef4444' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setColor('#ef4444').run()}
            aria-label="قرمز"
            className="w-6 h-6 p-0"
            style={{ backgroundColor: '#ef4444' }}
          />
          <Button
            type="button"
            variant={editor.isActive('textStyle', { color: '#f97316' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setColor('#f97316').run()}
            aria-label="نارنجی"
            className="w-6 h-6 p-0"
            style={{ backgroundColor: '#f97316' }}
          />
          <Button
            type="button"
            variant={editor.isActive('textStyle', { color: '#eab308' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setColor('#eab308').run()}
            aria-label="زرد"
            className="w-6 h-6 p-0"
            style={{ backgroundColor: '#eab308' }}
          />
          <Button
            type="button"
            variant={editor.isActive('textStyle', { color: '#22c55e' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setColor('#22c55e').run()}
            aria-label="سبز"
            className="w-6 h-6 p-0"
            style={{ backgroundColor: '#22c55e' }}
          />
          <Button
            type="button"
            variant={editor.isActive('textStyle', { color: '#06b6d4' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setColor('#06b6d4').run()}
            aria-label="آبی"
            className="w-6 h-6 p-0"
            style={{ backgroundColor: '#06b6d4' }}
          />
          <Button
            type="button"
            variant={editor.isActive('textStyle', { color: '#8b5cf6' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setColor('#8b5cf6').run()}
            aria-label="بنفش"
            className="w-6 h-6 p-0"
            style={{ backgroundColor: '#8b5cf6' }}
          />
          <Button
            type="button"
            variant={editor.isActive('textStyle', { color: '#ec4899' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setColor('#ec4899').run()}
            aria-label="صورتی"
            className="w-6 h-6 p-0"
            style={{ backgroundColor: '#ec4899' }}
          />
          
          {/* Custom Color Picker */}
          <input
            type="color"
            className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            title="انتخاب رنگ کاستوم"
          />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Alignment */}
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          aria-label="تراز راست"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          aria-label="تراز وسط"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          aria-label="تراز چپ"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          aria-label="تراز دو طرفه"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label="برگشت"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label="تکرار"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="border rounded-md min-h-[200px] bg-white">
        <EditorContent 
          editor={editor} 
          className="[&_.ProseMirror[data-placeholder]:empty::before]:content-[attr(data-placeholder)] [&_.ProseMirror[data-placeholder]:empty::before]:float-right [&_.ProseMirror[data-placeholder]:empty::before]:text-gray-400 [&_.ProseMirror[data-placeholder]:empty::before]:pointer-events-none [&_.ProseMirror[data-placeholder]:empty::before]:h-0 [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:rounded-md [&_.ProseMirror_img]:my-4 [&_.ProseMirror_img]:block [&_.ProseMirror_img]:mx-auto"
        />
      </div>
    </div>
  );
}
