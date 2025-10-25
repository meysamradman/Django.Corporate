"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { Label } from "@/components/elements/Label";
import { TabsContent } from "@/components/elements/Tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
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
                    <CardTitle>امنیت</CardTitle>
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
                            <Label htmlFor="newPassword">رمز عبور جدید</Label>
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
                                    variant="ghost"
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
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${passwordStrength < 40
                                                    ? "bg-red-500"
                                                    : passwordStrength < 70
                                                        ? "bg-orange-500"
                                                        : "bg-green-500"
                                                }`}
                                            style={{ width: `${passwordStrength}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        قدرت رمز: {passwordStrength < 40 ? "ضعیف" : passwordStrength < 70 ? "متوسط" : "قوی"}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
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
                                    variant="ghost"
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
                        </div>
                    </div>

                    <Button onClick={handleChangePassword}>
                        تغییر رمز عبور
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
    );
}
