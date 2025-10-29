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
import { RotateCw, Loader2 } from 'lucide-react';
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

export function LoginForm() {
    const { login, loginWithOTP, isLoading: authLoading } = useAuth();
  
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [loginType, setLoginType] = useState('password');
    const [otpLength, setOtpLength] = useState(5);
    const [resendTimer, setResendTimer] = useState(0);

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
            console.error("CAPTCHA fetch error:", error);
            setCaptchaError("خطا در اتصال به شبکه");
            showErrorToast(error, "خطا در اتصال به شبکه");
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
                console.error('Failed to fetch OTP settings, using default value:', error);
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
        } else if (otpSent && resendTimer === 0) {}

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [resendTimer, otpSent]);

    const handlePasswordLogin = async (data: PasswordLoginForm) => {
        if (!captchaId) {
            showErrorToast(new Error('کپچا بارگذاری نشده'));
            return;
        }

        setIsLoading(true);

        try {
            await login(data.mobile, data.password, captchaId, data.captchaAnswer);
            showSuccessToast(msg.auth("loginSuccess"));
            // Navigation is handled by AuthContext after successful login
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific error types
            let errorMessage = msg.auth("loginFailed");
            
            if (error instanceof ApiError) {
                errorMessage = error.response?.message || error.message || msg.auth("loginFailed");
                
                // Refresh CAPTCHA if it's invalid
                if (error.response?.AppStatusCode === 400 && errorMessage.includes('CAPTCHA')) {
                    fetchCaptchaChallenge();
                    passwordForm.setValue('captchaAnswer', '');
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
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
            console.error('Send OTP error:', error);
            
            // Handle specific error types
            let errorMessage = msg.auth("otpSendFailed");
            
            if (error instanceof ApiError) {
                errorMessage = error.response?.message || error.message || msg.auth("otpSendFailed");
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            // Show error toast only once
            showErrorToast(new Error(errorMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOTPLogin = async (data: OtpLoginForm) => {
        if (!otpSent) {
            showErrorToast(new Error('ابتدا کد یکبار مصرف را درخواست کنید'));
            return;
        }

        setIsLoading(true);

        try {
            await loginWithOTP(data.mobile, data.otp, captchaId, data.captchaAnswer);
            showSuccessToast(msg.auth("loginSuccess"));
            // Navigation is handled by AuthContext after successful login
        } catch (error) {
            console.error('OTP Login error:', error);
            
            // Handle specific error types
            let errorMessage = msg.auth("loginFailed");
            
            if (error instanceof ApiError) {
                errorMessage = error.response?.message || error.message || msg.auth("loginFailed");
                
                // Refresh CAPTCHA if it's invalid
                if (error.response?.AppStatusCode === 400 && errorMessage.includes('CAPTCHA')) {
                    fetchCaptchaChallenge();
                    otpForm.setValue('captchaAnswer', '');
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
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
            <div className="mb-6">
                <RadioGroup
                    defaultValue="password"
                    value={loginType}
                    onValueChange={setLoginType}
                    className="flex gap-4"
                >
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="password" id="password"/>
                        <Label htmlFor="password">رمز عبور</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <RadioGroupItem value="otp" id="otp"/>
                        <Label htmlFor="otp">کد یکبار مصرف</Label>
                    </div>
                </RadioGroup>
            </div>

            {loginType === 'password' ? (
                <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
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

                    <FormFieldInput
                        id="password"
                        label="رمز عبور"
                        type="password"
                        placeholder="رمز عبور خود را وارد کنید"
                        {...passwordForm.register("password")}
                        error={passwordForm.formState.errors.password?.message}
                        required
                        disabled={loading}
                    />

                    {/* CAPTCHA */}
                    {captchaId && (
                        <FormField
                            label="کپچا"
                            error={passwordForm.formState.errors.captchaAnswer?.message}
                            required
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Input
                                        id="captchaAnswer"
                                        type="text"
                                        placeholder="کد کپچا را وارد کنید"
                                        {...passwordForm.register("captchaAnswer")}
                                        className={passwordForm.formState.errors.captchaAnswer ? "border-red-500" : ""}
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchCaptchaChallenge}
                                    disabled={captchaLoading || loading}
                                    className="shrink-0"
                                >
                                    {captchaLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCw className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {captchaDigits && (
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-10 px-4 bg-gray-100 border rounded flex items-center justify-center font-mono text-lg font-bold text-gray-800 tracking-wider min-w-32">
                                        {captchaDigits}
                                    </div>
                                </div>
                            )}
                        </FormField>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "در حال بارگذاری..." : "ورود"}
                    </Button>
                </form>
            ) : (
                <form onSubmit={otpForm.handleSubmit(handleOTPLogin)} className="space-y-4">
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
                        className={`text-center tracking-widest ${otpForm.formState.errors.otp ? "border-red-500" : ""}`}
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
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Input
                                        id="captchaAnswer"
                                        type="text"
                                        placeholder="کد کپچا را وارد کنید"
                                        {...otpForm.register("captchaAnswer")}
                                        className={otpForm.formState.errors.captchaAnswer ? "border-red-500" : ""}
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchCaptchaChallenge}
                                    disabled={captchaLoading || loading}
                                    className="shrink-0"
                                >
                                    {captchaLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCw className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {captchaDigits && (
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-10 px-4 bg-gray-100 border rounded flex items-center justify-center font-mono text-lg font-bold text-gray-800 tracking-wider min-w-32">
                                        {captchaDigits}
                                    </div>
                                </div>
                            )}
                        </FormField>
                    )}

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSendOTP}
                            disabled={loading || resendTimer > 0}
                            className="flex-1"
                        >
                            {resendTimer > 0 ? `ارسال مجدد (${formatResendTimer()})` : "ارسال کد"}
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? "در حال بارگذاری..." : 'تأیید کد'}
                        </Button>
                    </div>
                </form>
            )}
        </>
    );
}