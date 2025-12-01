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
    <div className={`min-h-[calc(100vh-8rem)] w-full bg-bg relative overflow-hidden flex items-center justify-center py-4 sm:py-6 lg:py-8 ${className}`}>
      
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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-0/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-12 items-center">
          
          {/* Left Side - Illustration */}
          <div className="relative order-2 lg:order-1">
            <div className="relative w-full aspect-square max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-lg mx-auto">
              
              {/* Animated Background Circle */}
              <div className="absolute inset-0 bg-red-0/30 rounded-full blur-2xl animate-pulse" />
              
              {/* Main Lock Illustration */}
              <div className="relative w-full h-full flex items-center justify-center">
                
                {/* Outer Ring */}
                <div className="absolute inset-0 border-2 border-divi rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-2 sm:inset-4 lg:inset-8 border-2 border-divi rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                
                {/* Center Lock Container */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 bg-card border-2 border-br rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl flex items-center justify-center group hover:scale-105 transition-transform duration-500">
                  
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-red-0/20 rounded-xl sm:rounded-2xl lg:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Lock Icon */}
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-red-0 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl">
                      <Lock className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-red-1" strokeWidth={1.5} />
                    </div>
                    
                    {/* Floating Alert Badge */}
                    <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 md:-top-3 md:-right-3 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-red-1 rounded-full shadow-lg flex items-center justify-center animate-bounce border-2 sm:border-4 border-card">
                      <ShieldAlert className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-static-w" strokeWidth={2} />
                    </div>
                  </div>
                </div>

                {/* Floating Particles */}
                <div className="absolute top-10 left-4 sm:top-12 sm:left-6 md:top-20 md:left-10 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-red-1 rounded-full animate-ping" />
                <div className="absolute bottom-16 right-8 sm:bottom-20 sm:right-10 md:bottom-32 md:right-16 w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-primary/30 rounded-full animate-pulse" />
                <div className="absolute top-20 right-10 sm:top-24 sm:right-12 md:top-40 md:right-20 w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-red-1 rounded-full animate-ping delay-300" />
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="order-1 lg:order-2 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 flex flex-col">
            
            {/* Status Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-red-0 border border-red-1 rounded-full text-xs sm:text-sm font-medium text-red-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>دسترسی محدود شده</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-1.5 sm:space-y-2 md:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-font-p leading-tight tracking-tight">
                این محتوا
                <br />
                <span className="text-red-1">
                  برای شما قفل است
                </span>
              </h1>
              
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-font-s leading-relaxed max-w-xl">
                {description || displayMessage}
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-card border border-br rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-3 md:space-y-4">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-font-p flex items-center gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-primary" />
                </div>
                چه کاری می‌توانید انجام دهید؟
              </h3>
              
              <ul className="space-y-1.5 sm:space-y-2 md:space-y-3 text-xs sm:text-sm md:text-base text-font-s">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                  <span>با مدیر سیستم تماس بگیرید و درخواست دسترسی کنید</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                  <span>به بخش‌های دیگری از پنل که دسترسی دارید مراجعه کنید</span>
                </li>
                {showDashboardButton && (
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                    <span>از دکمه زیر به داشبورد اصلی بازگردید</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 pt-2 sm:pt-3 md:pt-4">
              {showDashboardButton && (
                <Button 
                  asChild 
                  size="default"
                  className="bg-primary text-static-w hover:bg-primary/90 shadow-xl shadow-primary/20 text-xs sm:text-sm md:text-base w-full sm:w-auto"
                >
                  <Link href="/" className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    <span>بازگشت به داشبورد</span>
                  </Link>
                </Button>
              )}
              
              {showBackButton && (
                <Button 
                  variant="outline"
                  size="default"
                  className="border-br hover:bg-bg text-xs sm:text-sm md:text-base w-full sm:w-auto"
                  onClick={handleBack}
                >
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <span>صفحه قبل</span>
                </Button>
              )}
            </div>

            {/* Error Code */}
            <div className="pt-3 sm:pt-4 md:pt-6 border-t border-br">
              <p className="text-xs font-mono text-font-s/60 flex items-center gap-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-1 rounded-full animate-pulse" />
                ERROR_CODE: 403 • PERMISSION_DENIED
                {permission && ` • ${permission}`}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

