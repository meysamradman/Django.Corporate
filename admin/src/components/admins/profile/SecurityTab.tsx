"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Alert, AlertDescription } from "@/components/elements/Alert";
import { Label } from "@/components/elements/Label";
import { TabsContent } from "@/components/elements/Tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/elements/Table";
import { Eye, EyeOff, AlertCircle, Lock } from "lucide-react";
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
        <TabsContent value="security">
            {/* Change Password */}
            <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-red-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-100 rounded-xl shadow-sm">
                            <Lock className="w-5 h-5 stroke-red-600" />
                        </div>
                        امنیت
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-6">
                        {newPassword && passwordStrength < 100 && (
                            <Alert variant="default" className="bg-amber-50 border-amber-200">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-amber-800">
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
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${passwordStrength < 40
                                                        ? "bg-destructive"
                                                        : passwordStrength < 70
                                                            ? "bg-amber-600"
                                                            : "bg-green-600"
                                                    }`}
                                                style={{ width: `${passwordStrength}%` }}
                                            />
                                        </div>
                                        <p className="text-muted-foreground">
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
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    );
}
