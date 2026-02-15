import { useState } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { TabsContent } from "@/components/elements/Tabs";
import { FormField } from "@/components/shared/FormField";
import { Eye, EyeOff, AlertCircle, Lock } from "lucide-react";
import { showError, showSuccess } from '@/core/toast';
import { validatePassword } from '@/core/validation';

export function UserSecurity() {
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            showError("رمز عبور و تکرار آن یکسان نیستند");
            return;
        }
        showSuccess("رمز عبور با موفقیت تغییر کرد");
        setNewPassword("");
        setConfirmPassword("");
    };

    const passwordStrength = newPassword.length > 0 ? (
        validatePassword(newPassword).isValid
            ? 100
            : newPassword.length >= 6 ? 60 : 30
    ) : 0;

    return (
        <TabsContent value="security">
            <CardWithIcon
                icon={Lock}
                title="گذرواژه"
                iconBgColor="bg-amber"
                iconColor="stroke-amber-2"
                cardBorderColor="border-b-amber-1"
                className="hover:shadow-lg transition-all duration-300"
            >
                {newPassword && passwordStrength < 100 && (
                    <Alert variant="default" className="bg-amber border-amber-1">
                        <AlertCircle className="h-4 w-4 text-amber-1" />
                        <AlertDescription className="text-amber-2">
                            <div className="mb-1">
                                مطمئن شوید که این الزامات رعایت شده است:
                            </div>
                            <div>
                                حداقل 8 کاراکتر، شامل حروف بزرگ و کاراکتر خاص
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        label="رمز عبور جدید"
                        htmlFor="newPassword"
                    >
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="············"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {newPassword && (
                            <div className="space-y-1">
                                <div className="h-2 bg-bg rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${passwordStrength < 40
                                            ? "bg-destructive"
                                            : passwordStrength < 70
                                                ? "bg-amber-1"
                                                : "bg-green-1"
                                            }`}
                                        style={{ width: `${passwordStrength}%` }}
                                    />
                                </div>
                                <p className="text-font-s">
                                    قدرت رمز: {passwordStrength < 40 ? "ضعیف" : passwordStrength < 70 ? "متوسط" : "قوی"}
                                </p>
                            </div>
                        )}
                    </FormField>

                    <FormField
                        label="تکرار رمز عبور"
                        htmlFor="confirmPassword"
                    >
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="············"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </FormField>
                </div>

                <Button onClick={handleChangePassword}>
                    تغییر رمز عبور
                </Button>
            </CardWithIcon>
        </TabsContent>
    );
}
