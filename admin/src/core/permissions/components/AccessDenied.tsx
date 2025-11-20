"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert, ArrowRight, Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { getPermissionTranslation } from "@/core/messages/permissions";

interface AccessDeniedProps {
  /**
   * پیام عدم دسترسی (اختیاری - اگر نباشد از permission استفاده می‌شود)
   */
  message?: string;
  /**
   * نام پرمیژن مورد نیاز (مثلاً 'statistics.users.read')
   * برای نمایش نام فارسی پرمیژن استفاده می‌شود
   */
  permission?: string;
  /**
   * نام ماژول (مثلاً 'statistics')
   * برای نمایش نام فارسی ماژول استفاده می‌شود
   */
  module?: string;
  /**
   * نام action (مثلاً 'read')
   * برای نمایش نام فارسی action استفاده می‌شود
   */
  action?: string;
  /**
   * توضیحات اضافی
   */
  description?: string;
  /**
   * آیا دکمه بازگشت نمایش داده شود؟
   */
  showBackButton?: boolean;
  /**
   * آیا دکمه داشبورد نمایش داده شود؟
   */
  showDashboardButton?: boolean;
  /**
   * مسیر بازگشت (پیش‌فرض: صفحه قبل)
   */
  backPath?: string;
  /**
   * کلاس‌های اضافی برای container
   */
  className?: string;
}

/**
 * کامپوننت AccessDenied
 * برای نمایش صفحه عدم دسترسی در جاهایی که نیاز به نمایش پیام عدم دسترسی است
 * (نه برای دکمه‌ها - برای دکمه‌ها از ProtectedButton استفاده کنید)
 * 
 * @example
 * // استفاده ساده با پیام
 * <AccessDenied message="شما دسترسی به این بخش را ندارید" />
 * 
 * @example
 * // استفاده با permission
 * <AccessDenied permission="statistics.users.read" />
 * 
 * @example
 * // استفاده با module و action
 * <AccessDenied module="statistics" action="read" />
 */
export function AccessDenied({
  message,
  permission,
  module,
  action,
  description,
  showBackButton = true,
  showDashboardButton = true,
  backPath,
  className = "",
}: AccessDeniedProps) {
  const router = useRouter();

  // ساخت پیام بر اساس permission یا module/action
  const displayMessage = useMemo(() => {
    if (message) return message;
    
    if (permission) {
      const permTranslation = getPermissionTranslation(permission, 'description');
      if (permTranslation && permTranslation !== permission) {
        return `برای دسترسی به "${permTranslation}" نیاز به مجوز ${permission} دارید.`;
      }
      return `برای دسترسی به این بخش نیاز به مجوز ${permission} دارید.`;
    }
    
    if (module && action) {
      const moduleName = getPermissionTranslation(module, 'resource') || module;
      const actionName = getPermissionTranslation(action, 'action') || action;
      return `برای ${actionName} "${moduleName}" نیاز به مجوز ${module}.${action} دارید.`;
    }
    
    return "شما دسترسی لازم برای مشاهده این بخش را ندارید.";
  }, [message, permission, module, action]);

  const handleBack = () => {
    if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  return (
    <div className={`min-h-screen w-full bg-bg relative overflow-hidden flex items-center justify-center ${className}`}>
      
      {/* Background Pattern & Gradients */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-red-50/40 via-red-25/30 to-transparent dark:from-red-900/10 dark:via-red-800/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-primary/10 via-blue-50/20 to-transparent dark:from-primary/5 dark:via-blue-900/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Illustration */}
          <div className="relative order-2 lg:order-1">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              
              {/* Animated Background Circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-25 dark:from-red-900/20 dark:to-red-800/10 rounded-full blur-2xl animate-pulse" />
              
              {/* Main Lock Illustration */}
              <div className="relative w-full h-full flex items-center justify-center">
                
                {/* Outer Ring */}
                <div className="absolute inset-0 border-2 border-divi/30 rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-8 border-2 border-divi/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                
                {/* Center Lock Container */}
                <div className="relative w-64 h-64 bg-card border-2 border-br rounded-3xl shadow-2xl flex items-center justify-center group hover:scale-105 transition-transform duration-500">
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-transparent to-primary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Lock Icon */}
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-red-50 to-red-25 dark:from-red-900/30 dark:to-red-800/20 rounded-2xl flex items-center justify-center shadow-xl">
                      <Lock className="w-16 h-16 text-red-200 dark:text-red-400" strokeWidth={1.5} />
                    </div>
                    
                    {/* Floating Alert Badge */}
                    <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full shadow-lg flex items-center justify-center animate-bounce border-4 border-card">
                      <ShieldAlert className="w-6 h-6 text-white dark:text-red-200" strokeWidth={2} />
                    </div>
                  </div>
                </div>

                {/* Floating Particles */}
                <div className="absolute top-20 left-10 w-3 h-3 bg-red-100 dark:bg-red-900/50 rounded-full animate-ping" />
                <div className="absolute bottom-32 right-16 w-2 h-2 bg-primary/30 rounded-full animate-pulse" />
                <div className="absolute top-40 right-20 w-2 h-2 bg-red-100 dark:bg-red-900/50 rounded-full animate-ping delay-300" />
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="order-1 lg:order-2 space-y-8">
            
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-full text-sm font-medium text-red-200 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>دسترسی محدود شده</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-font-p leading-tight tracking-tight">
                این محتوا
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 via-red-100 to-red-200 dark:from-red-400 dark:via-red-500 dark:to-red-400">
                  برای شما قفل است
                </span>
              </h1>
              
              <p className="text-xl text-font-s leading-relaxed max-w-xl">
                {description || displayMessage}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-card border border-br rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-font-p flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-primary" />
                </div>
                چه کاری می‌توانید انجام دهید؟
              </h3>
              
              <ul className="space-y-3 text-font-s">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>با مدیر سیستم تماس بگیرید و درخواست دسترسی کنید</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>به بخش‌های دیگری از پنل که دسترسی دارید مراجعه کنید</span>
                </li>
                {showDashboardButton && (
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>از دکمه زیر به داشبورد اصلی بازگردید</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {showDashboardButton && (
                <Button 
                  asChild 
                  size="xl"
                  className="bg-primary text-static-w hover:bg-primary/90 shadow-xl shadow-primary/20 text-base"
                >
                  <Link href="/">
                    <Home className="w-5 h-5" />
                    <span>بازگشت به داشبورد</span>
                  </Link>
                </Button>
              )}
              
              {showBackButton && (
                <Button 
                  variant="outline"
                  size="xl"
                  className="border-br hover:bg-bg text-base"
                  onClick={handleBack}
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>صفحه قبل</span>
                </Button>
              )}
            </div>

            {/* Error Code */}
            <div className="pt-6 border-t border-br">
              <p className="text-xs font-mono text-font-s/60 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-200 dark:bg-red-400 rounded-full animate-pulse" />
                ERROR_CODE: 403 • PERMISSION_DENIED
                {permission && ` • ${permission}`}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <p className="text-xs text-font-s/50 text-center">
          نیاز به کمک دارید؟ با{" "}
          <button className="text-primary hover:underline font-medium transition-all">
            پشتیبانی
          </button>
          {" "}تماس بگیرید
        </p>
      </div>
    </div>
  );
}

