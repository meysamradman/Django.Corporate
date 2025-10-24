"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { Label } from "@/components/elements/Label";
import { TabsContent } from "@/components/elements/Tabs";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function SecurityTab() {
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            toast.error("رمز عبور و تکرار آن یکسان نیستند");
            return;
        }
        toast.success("رمز عبور با موفقیت تغییر کرد");
        setNewPassword("");
        setConfirmPassword("");
    };

    const passwordStrength = newPassword.length > 0 ? (
        newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
            ? 100
            : newPassword.length >= 6 ? 60 : 30
    ) : 0;

    return (
        <TabsContent value="security" className="mt-6 space-y-6">
            {/* Change Password */}
            <Card>
                <CardHeader>
                    <CardTitle>تغییر رمز عبور</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {newPassword && passwordStrength < 100 && (
                        <Alert variant="default" className="bg-orange-50 border-orange-200">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                                <div className="font-semibold mb-1">
                                    مطمئن شوید که این الزامات رعایت شده است:
                                </div>
                                <div className="text-sm">
                                    حداقل 8 کاراکتر، شامل حروف بزرگ و کاراکتر خاص
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">رمز عبور جدید</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="رمز عبور جدید را وارد کنید"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">تکرار رمز عبور</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="رمز عبور را مجدداً وارد کنید"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {newPassword && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>قدرت رمز عبور:</span>
                                <span>{passwordStrength}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        passwordStrength >= 80 ? 'bg-green-500' :
                                        passwordStrength >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${passwordStrength}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <Button onClick={handleChangePassword} disabled={!newPassword || !confirmPassword}>
                        تغییر رمز عبور
                    </Button>
                </CardContent>
            </Card>

        </TabsContent>
    );
}
