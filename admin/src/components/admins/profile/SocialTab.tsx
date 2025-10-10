"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { TabsContent } from "@/components/elements/Tabs";
import { Linkedin, Twitter, Instagram, Youtube, Send, Phone } from "lucide-react";

interface SocialTabProps {
    formData: any; // Consider creating a specific type for this
    editMode: boolean;
    handleInputChange: (field: string, value: string) => void;
    handleSaveProfile: () => void;
}

export function SocialTab({
    formData,
    editMode,
    handleInputChange,
    handleSaveProfile,
}: SocialTabProps) {
    return (
        <TabsContent value="social" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>شبکه‌های اجتماعی</CardTitle>
                    <CardDescription>
                        لینک پروفایل‌های اجتماعی خود را وارد کنید.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="linkedin">لینکداین</Label>
                        <div className="relative flex items-center">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="linkedin"
                                value={formData.linkedin}
                                onChange={(e) => handleInputChange("linkedin", e.target.value)}
                                disabled={!editMode}
                                placeholder="https://linkedin.com/in/..."
                                className="ps-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="twitter">توییتر (X)</Label>
                        <div className="relative flex items-center">
                            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="twitter"
                                value={formData.twitter}
                                onChange={(e) => handleInputChange("twitter", e.target.value)}
                                disabled={!editMode}
                                placeholder="https://x.com/..."
                                className="ps-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="instagram">اینستاگرام</Label>
                        <div className="relative flex items-center">
                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="instagram"
                                value={formData.instagram}
                                onChange={(e) => handleInputChange("instagram", e.target.value)}
                                disabled={!editMode}
                                placeholder="https://instagram.com/..."
                                className="ps-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">واتساپ</Label>
                        <div className="relative flex items-center">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="whatsapp"
                                value={formData.whatsapp}
                                onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                                disabled={!editMode}
                                placeholder="شماره واتساپ..."
                                className="ps-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="telegram">تلگرام</Label>
                        <div className="relative flex items-center">
                            <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="telegram"
                                value={formData.telegram}
                                onChange={(e) => handleInputChange("telegram", e.target.value)}
                                disabled={!editMode}
                                placeholder="آیدی تلگرام..."
                                className="ps-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="youtube">یوتیوب</Label>
                        <div className="relative flex items-center">
                            <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="youtube"
                                value={formData.youtube}
                                onChange={(e) => handleInputChange("youtube", e.target.value)}
                                disabled={!editMode}
                                placeholder="https://youtube.com/c/..."
                                className="ps-10"
                            />
                        </div>
                    </div>
                    {editMode && (
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => (handleInputChange as any)("cancel", "")}>لغو</Button>
                            <Button onClick={handleSaveProfile}>
                                ذخیره تغییرات
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    );
}
