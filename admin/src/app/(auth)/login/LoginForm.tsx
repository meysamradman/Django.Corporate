"use client";

import { z } from 'zod';
import React, { useState, useEffect } from 'react';
import { authApi } from '@/api/auth/route';
import { Button } from "@/components/elements/Button";
import { Input} from '@/components/elements/Input';
import { showSuccessToast, showErrorToast } from '@/core/config/errorHandler';
import { Label} from '@/components/elements/Label';
import { RadioGroup, RadioGroupItem } from '@/components/elements/RadioGroup';
import { FormField, FormFieldInput } from "@/components/forms/FormField";
import { useAuth } from '@/core/auth/AuthContext';
import { RotateCw, Loader2, Eye, EyeOff } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { filterNumericOnly } from '@/core/utils/validations';
import { 
  passwordLoginSchema, 
  otpLoginSchema, 
  type PasswordLoginForm, 
  type OtpLoginForm 
} from '@/core/validations/loginSchema';
import { msg } from '@/core/messages/message';
import { usePathname } from 'next/navigation';
import { Spinner } from '@/components/elements/Spinner';

export function LoginForm() {
    const { login, loginWithOTP, isLoading: authLoading } = useAuth();
    const pathname = usePathname();
  
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [loginType, setLoginType] = useState('password');
    const [otpLength, setOtpLength] = useState(5);
    const [resendTimer, setResendTimer] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    // --- CAPTCHA State ---
    const [captchaId, setCaptchaId] = useState<string>('');
    const [captchaDigits, setCaptchaDigits] = useState<string>('');
    const [captchaLoading, setCaptchaLoading] = useState<boolean>(true);
    const [captchaError, setCaptchaError] = useState<string | null>(null);
    // --- End CAPTCHA State ---

    // React Hook Form setup
    const passwordForm = useForm<PasswordLoginForm>({
        resolver: zodResolver(passwordLoginSchema),
        defaultValues: {
            mobile: '',
            password: '',
            captchaAnswer: '',
        },
    });

    const otpForm = useForm<OtpLoginForm>({
        resolver: zodResolver(otpLoginSchema),
        defaultValues: {
            mobile: '',
            otp: '',
            captchaAnswer: '',
        },
    });

    // --- Function to fetch CAPTCHA ---
    const fetchCaptchaChallenge = async () => {
        setCaptchaLoading(true);
        setCaptchaError(null);
        try {
            const { captcha_id, digits } = await authApi.getCaptchaChallenge();
            setCaptchaId(captcha_id);
            setCaptchaDigits(digits);
        } catch (error) {
            setCaptchaError(msg.error("network"));
            showErrorToast(error, msg.error("network"));
        } finally {
            setCaptchaLoading(false);
        }
    };
    // --- End Function to fetch CAPTCHA ---

    useEffect(() => {
        const fetchOTPSettings = async () => {
            try {
                const settings = await authApi.getOTPSettings();
                if (settings?.otp_length) {
                    setOtpLength(settings.otp_length);
            
                }
            } catch (error) {
                setOtpLength(5);
            }
        };

        fetchOTPSettings();
        fetchCaptchaChallenge();
    }, []);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (resendTimer > 0) {
            intervalId = setInterval(() => {
                setResendTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [resendTimer, otpSent]);

    // Reset isRedirecting when pathname changes (redirect completed)
    useEffect(() => {
        if (isRedirecting && pathname !== '/login') {
            setIsRedirecting(false);
        }
    }, [pathname, isRedirecting]);

    const handlePasswordLogin = async (data: PasswordLoginForm) => {
        if (!captchaId) {
            showErrorToast(new Error(msg.validation("captchaRequired")));
            return;
        }

        setIsLoading(true);

        try {
            await login(data.mobile, data.password, captchaId, data.captchaAnswer);
            showSuccessToast(msg.auth("loginSuccess"));
            // Show redirecting overlay while navigating
            setIsRedirecting(true);
            // Navigation is handled by AuthContext after successful login
        } catch (error) {
            // Handle specific error types
            let errorMessage = msg.auth("invalidCredentials");
            
            if (error instanceof ApiError) {
                const backendMessage = error.response?.message || '';
                
                // Check for captcha errors
                if (backendMessage.toLowerCase().includes('captcha') || backendMessage.toLowerCase().includes('کپتچا')) {
                    errorMessage = backendMessage || msg.validation("captchaRequired");
                    fetchCaptchaChallenge();
                    passwordForm.setValue('captchaAnswer', '');
                } else {
                    errorMessage = backendMessage || msg.auth("invalidCredentials");
                }
            } else if (error instanceof Error) {
                errorMessage = error.message || msg.auth("invalidCredentials");
            }
            
            // Show error toast only once
            showErrorToast(new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOTP = async () => {
        const mobile = otpForm.getValues('mobile');
        
        if (!mobile) {
            showErrorToast(new Error(msg.validation("mobileRequired")));
            return;
        }

        if (!/^09[0-9]{9}$/.test(mobile)) {
            showErrorToast(new Error(msg.validation("mobileInvalid")));
            return;
        }

        setIsLoading(true);

        try {
            await authApi.sendOTP(mobile);
            setOtpSent(true);
            setResendTimer(60);
            showSuccessToast(msg.auth("otpSent"));
        } catch (error) {
            // Handle specific error types
            let errorMessage = msg.auth("otpSendFailed");
            
            if (error instanceof ApiError) {
                errorMessage = error.response?.message || msg.auth("otpSendFailed");
            } else if (error instanceof Error) {
                errorMessage = error.message || msg.auth("otpSendFailed");
            }
            
            // Show error toast only once
            showErrorToast(new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPLogin = async (data: OtpLoginForm) => {
        if (!otpSent) {
            showErrorToast(new Error(msg.validation("otpRequired")));
            return;
        }

        setIsLoading(true);

        try {
            await loginWithOTP(data.mobile, data.otp, captchaId, data.captchaAnswer);
            showSuccessToast(msg.auth("loginSuccess"));
            // Show redirecting overlay while navigating
            setIsRedirecting(true);
            // Navigation is handled by AuthContext after successful login
        } catch (error) {
            // Handle specific error types
            let errorMessage = msg.auth("invalidCredentials");
            
            if (error instanceof ApiError) {
                const backendMessage = error.response?.message || '';
                
                // Check for captcha errors
                if (backendMessage.toLowerCase().includes('captcha') || backendMessage.toLowerCase().includes('کپتچا')) {
                    errorMessage = backendMessage || msg.validation("captchaRequired");
                    fetchCaptchaChallenge();
                    otpForm.setValue('captchaAnswer', '');
                } else {
                    errorMessage = backendMessage || msg.auth("invalidCredentials");
                }
            } else if (error instanceof Error) {
                errorMessage = error.message || msg.auth("invalidCredentials");
            }
            
            // Show error toast only once
            showErrorToast(new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    // Format the resend timer to MM:SS format
    const formatResendTimer = () => {
        const minutes = Math.floor(resendTimer / 60);
        const seconds = resendTimer % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // وضعیت بارگذاری کلی (از AuthContext یا state محلی)
    const loading = isLoading || authLoading || captchaLoading;

    return (
        <>
            {/* Full-screen loading overlay when redirecting after successful login */}
            {isRedirecting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <Spinner className="size-8 text-primary" />
                        <p className="text-sm text-font-s">در حال انتقال به داشبورد...</p>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <RadioGroup
                    defaultValue="password"
                    value={loginType}
                    onValueChange={setLoginType}
                    className="flex gap-6 bg-bg/50 p-1 rounded-lg"
                >
                    <div className="flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-md transition-all cursor-pointer hover:bg-bg/80 data-[state=checked]:bg-card data-[state=checked]:shadow-sm">
                        <RadioGroupItem value="password" id="password" className="data-[state=checked]:border-primary"/>
                        <Label htmlFor="password" className="cursor-pointer font-medium text-sm">رمز عبور</Label>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-center px-4 py-2 rounded-md transition-all cursor-pointer hover:bg-bg/80 data-[state=checked]:bg-card data-[state=checked]:shadow-sm">
                        <RadioGroupItem value="otp" id="otp" className="data-[state=checked]:border-primary"/>
                        <Label htmlFor="otp" className="cursor-pointer font-medium text-sm">کد یکبار مصرف</Label>
                    </div>
                </RadioGroup>
            </div>

            {loginType === 'password' ? (
                <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-5">
                    <FormFieldInput
                        id="mobile"
                        label="شماره موبایل"
                        type="tel"
                        placeholder="09123456789"
                        maxLength={11}
                        {...passwordForm.register("mobile", {
                            onChange: (e) => {
                                // فقط عدد بپذیر
                                const filteredValue = filterNumericOnly(e.target.value);
                                e.target.value = filteredValue;
                                passwordForm.setValue("mobile", filteredValue);
                            }
                        })}
                        error={passwordForm.formState.errors.mobile?.message}
                        required
                        disabled={loading}
                    />

                    <FormField
                        label="رمز عبور"
                        error={passwordForm.formState.errors.password?.message}
                        required
                        htmlFor="password"
                    >
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="رمز عبور خود را وارد کنید"
                                {...passwordForm.register("password")}
                                disabled={loading}
                                className={passwordForm.formState.errors.password ? "border-red-1 focus-visible:ring-red-1 pl-10" : "pl-10"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-font-s hover:text-font-p transition-colors"
                                tabIndex={-1}
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </FormField>

                    {/* CAPTCHA */}
                    {captchaId && (
                        <FormField
                            label="کپچا"
                            error={passwordForm.formState.errors.captchaAnswer?.message}
                            required
                        >
                            <div className="flex items-center gap-3">
                                {captchaDigits && (
                                    <div className="flex items-center justify-center h-11 min-w-[100px] px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-bg border-2 border-primary/20 rounded-lg font-mono text-2xl font-bold text-primary select-none shadow-sm">
                                        {captchaDigits}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        id="captchaAnswer"
                                        type="text"
                                        placeholder="کد کپچا را وارد کنید"
                                        {...passwordForm.register("captchaAnswer")}
                                        className={passwordForm.formState.errors.captchaAnswer ? "border-red-1" : ""}
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchCaptchaChallenge}
                                    disabled={captchaLoading || loading}
                                    className="shrink-0 h-11 w-11 hover:bg-primary/10 hover:border-primary/30 transition-all"
                                >
                                    {captchaLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    ) : (
                                        <RotateCw className="h-5 w-5 text-font-p hover:text-primary transition-colors" />
                                    )}
                                </Button>
                            </div>
                        </FormField>
                    )}

                    <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                در حال بارگذاری...
                            </>
                        ) : (
                            "ورود"
                        )}
                    </Button>
                </form>
            ) : (
                <form onSubmit={otpForm.handleSubmit(handleOTPLogin)} className="space-y-5">
                    <FormFieldInput
                        id="mobile"
                        label="شماره موبایل"
                        type="tel"
                        placeholder="09123456789"
                        maxLength={11}
                        {...otpForm.register("mobile", {
                            onChange: (e) => {
                                // فقط عدد بپذیر
                                const filteredValue = filterNumericOnly(e.target.value);
                                e.target.value = filteredValue;
                                otpForm.setValue("mobile", filteredValue);
                            }
                        })}
                        error={otpForm.formState.errors.mobile?.message}
                        required
                        disabled={loading}
                    />

                    <FormFieldInput
                        id="otp"
                        label="کد یکبار مصرف"
                        type="text"
                        placeholder="کد یکبار مصرف را وارد کنید"
                        maxLength={otpLength}
                        {...otpForm.register("otp", {
                            onChange: (e) => {
                                // فقط عدد بپذیر
                                const filteredValue = filterNumericOnly(e.target.value);
                                e.target.value = filteredValue;
                                otpForm.setValue("otp", filteredValue);
                            }
                        })}
                        className={`text-center tracking-[0.5em] text-xl font-semibold font-mono ${otpForm.formState.errors.otp ? "border-red-1" : ""}`}
                        error={otpForm.formState.errors.otp?.message}
                        required
                        disabled={loading}
                    />

                    {/* CAPTCHA */}
                    {captchaId && (
                        <FormField
                            label="کپچا"
                            error={otpForm.formState.errors.captchaAnswer?.message}
                            required
                        >
                            <div className="flex items-center gap-3">
                                {captchaDigits && (
                                    <div className="flex items-center justify-center h-11 min-w-[100px] px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-bg border-2 border-primary/20 rounded-lg font-mono text-2xl font-bold text-primary select-none shadow-sm">
                                        {captchaDigits}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        id="captchaAnswer"
                                        type="text"
                                        placeholder="کد کپچا را وارد کنید"
                                        {...otpForm.register("captchaAnswer")}
                                        className={otpForm.formState.errors.captchaAnswer ? "border-red-1" : ""}
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchCaptchaChallenge}
                                    disabled={captchaLoading || loading}
                                    className="shrink-0 h-11 w-11 hover:bg-primary/10 hover:border-primary/30 transition-all"
                                >
                                    {captchaLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    ) : (
                                        <RotateCw className="h-5 w-5 text-font-p hover:text-primary transition-colors" />
                                    )}
                                </Button>
                            </div>
                        </FormField>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendOTP}
                            disabled={loading || resendTimer > 0}
                            className="flex-1 h-11 font-semibold hover:bg-bg transition-all"
                        >
                            {resendTimer > 0 ? `ارسال مجدد (${formatResendTimer()})` : "ارسال کد"}
                        </Button>
                        <Button 
                            type="submit" 
                            className="flex-1 h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                                    در حال بارگذاری...
                                </>
                            ) : (
                                'تأیید کد'
                            )}
                        </Button>
                    </div>
                </form>
            )}
        </>
    );
}