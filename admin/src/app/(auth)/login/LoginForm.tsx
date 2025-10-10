"use client";

import { z } from 'zod';
import React, { useState, useEffect } from 'react';
import { authApi } from '@/api/auth/route';
import { Button } from "@/components/elements/Button";
import { Input} from '@/components/elements/Input';
import { showSuccessToast, showErrorToast } from '@/core/config/errorHandler';
import { Label} from '@/components/elements/Label';
import { RadioGroup, RadioGroupItem } from '@/components/elements/RadioGroup';
import { useAuth } from '@/core/auth/AuthContext';
import { RotateCw, Loader2 } from 'lucide-react';
import { ApiError } from '@/types/api/apiError';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Validation schemas
const passwordLoginSchema = z.object({
  mobile: z.string()
    .min(1, 'شماره موبایل الزامی است')
    .regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر نیست'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
  captchaAnswer: z.string().min(1, 'کپچا الزامی است'),
});

const otpLoginSchema = z.object({
  mobile: z.string().regex(/^09[0-9]{9}$/, 'شماره موبایل معتبر نیست'),
  otp: z.string().min(1, 'کد یکبار مصرف الزامی است'),
  captchaAnswer: z.string().min(1, 'کپچا الزامی است'),
});

type PasswordLoginForm = z.infer<typeof passwordLoginSchema>;
type OtpLoginForm = z.infer<typeof otpLoginSchema>;

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
            showSuccessToast("ورود موفقیت‌آمیز");
            // Navigation is handled by AuthContext after successful login
        } catch (error) {
            showErrorToast(error, "خطا در ورود");
            if (error instanceof ApiError && error.response.AppStatusCode === 400 && error.message.includes('CAPTCHA')) {
                fetchCaptchaChallenge();
                passwordForm.setValue('captchaAnswer', '');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendOTP = async () => {
        const mobile = otpForm.getValues('mobile');
        
        if (!mobile) {
            showErrorToast(new Error('شماره موبایل الزامی است'));
            return;
        }

        if (!/^09[0-9]{9}$/.test(mobile)) {
            showErrorToast(new Error('شماره موبایل معتبر نیست'));
            return;
        }

        setIsLoading(true);

        try {
            await authApi.sendOTP(mobile);
            setOtpSent(true);
            setResendTimer(60);
            showSuccessToast("کد یکبار مصرف ارسال شد");
        } catch (error) {
            showErrorToast(error, "خطا در ورود");
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
            showSuccessToast("ورود موفقیت‌آمیز");
            // Navigation is handled by AuthContext after successful login
        } catch (error) {
            showErrorToast(error, "خطا در ورود");
            if (error instanceof ApiError && error.response.AppStatusCode === 400 && error.message.includes('CAPTCHA')) {
                fetchCaptchaChallenge();
                otpForm.setValue('captchaAnswer', '');
            }
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
                    <div className="space-y-2">
                        <Label htmlFor="mobile">شماره موبایل</Label>
                        <Input
                            id="mobile"
                            type="tel"
                            placeholder="شماره موبایل خود را وارد کنید"
                            {...passwordForm.register("mobile")}
                            className={passwordForm.formState.errors.mobile ? "border-red-500" : ""}
                        />
                        {passwordForm.formState.errors.mobile && (
                            <p className="text-sm text-red-500">{passwordForm.formState.errors.mobile.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">رمز عبور</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="رمز عبور خود را وارد کنید"
                            {...passwordForm.register("password")}
                            className={passwordForm.formState.errors.password ? "border-red-500" : ""}
                        />
                        {passwordForm.formState.errors.password && (
                            <p className="text-sm text-red-500">{passwordForm.formState.errors.password.message}</p>
                        )}
                    </div>

                    {/* CAPTCHA */}
                    {captchaId && (
                        <div className="space-y-2">
                            <Label htmlFor="captchaAnswer">کپچا</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Input
                                        id="captchaAnswer"
                                        type="text"
                                        placeholder="کد کپچا را وارد کنید"
                                        {...passwordForm.register("captchaAnswer")}
                                        className={passwordForm.formState.errors.captchaAnswer ? "border-red-500" : ""}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchCaptchaChallenge}
                                    disabled={captchaLoading}
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
                                <div className="flex items-center gap-2">
                                    <div className="h-10 px-4 bg-gray-100 border rounded flex items-center justify-center font-mono text-lg font-bold text-gray-800 tracking-wider min-w-32">
                                        {captchaDigits}
                                    </div>
                                </div>
                            )}
                            {passwordForm.formState.errors.captchaAnswer && (
                                <p className="text-sm text-red-500">{passwordForm.formState.errors.captchaAnswer.message}</p>
                            )}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "در حال بارگذاری..." : "ورود"}
                    </Button>
                </form>
            ) : (
                <form onSubmit={otpForm.handleSubmit(handleOTPLogin)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="mobile">شماره موبایل</Label>
                        <Input
                            id="mobile"
                            type="tel"
                            placeholder="شماره موبایل خود را وارد کنید (مثال: 09123456789)"
                            {...otpForm.register("mobile")}
                            className={otpForm.formState.errors.mobile ? "border-red-500" : ""}
                        />
                        {otpForm.formState.errors.mobile && (
                            <p className="text-sm text-red-500">{otpForm.formState.errors.mobile.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="otp">کد یکبار مصرف</Label>
                        <Input
                            id="otp"
                            type="text"
                            placeholder="کد یکبار مصرف را وارد کنید"
                            {...otpForm.register("otp")}
                            className={`text-center tracking-widest ${otpForm.formState.errors.otp ? "border-red-500" : ""}`}
                        />
                        {otpForm.formState.errors.otp && (
                            <p className="text-sm text-red-500">{otpForm.formState.errors.otp.message}</p>
                        )}
                    </div>

                    {/* CAPTCHA */}
                    {captchaId && (
                        <div className="space-y-2">
                            <Label htmlFor="captchaAnswer">کپچا</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <Input
                                        id="captchaAnswer"
                                        type="text"
                                        placeholder="کد کپچا را وارد کنید"
                                        {...otpForm.register("captchaAnswer")}
                                        className={otpForm.formState.errors.captchaAnswer ? "border-red-500" : ""}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchCaptchaChallenge}
                                    disabled={captchaLoading}
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
                                <div className="flex items-center gap-2">
                                    <div className="h-10 px-4 bg-gray-100 border rounded flex items-center justify-center font-mono text-lg font-bold text-gray-800 tracking-wider min-w-32">
                                        {captchaDigits}
                                    </div>
                                </div>
                            )}
                            {otpForm.formState.errors.captchaAnswer && (
                                <p className="text-sm text-red-500">{otpForm.formState.errors.captchaAnswer.message}</p>
                            )}
                        </div>
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