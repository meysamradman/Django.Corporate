"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { TabsContent } from "@/components/elements/Tabs";
import { Linkedin, Twitter, Instagram, Youtube, Send, Phone, Share2 } from "lucide-react";

const preventNonNumeric = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if ([46, 8, 9, 27, 13].includes(e.keyCode) ||
    (e.keyCode === 65 && e.ctrlKey === true) ||
    (e.keyCode === 67 && e.ctrlKey === true) ||
    (e.keyCode === 86 && e.ctrlKey === true) ||
    (e.keyCode === 88 && e.ctrlKey === true) ||
    (e.keyCode >= 35 && e.keyCode <= 39)) {
    return;
  }
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
};

const preventNonNumericPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  const paste = e.clipboardData.getData('text');
  if (!/^\d*$/.test(paste)) {
    e.preventDefault();
  }
};

interface SocialTabProps {
    formData: any;
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
        <TabsContent value="social">
            <CardWithIcon
                icon={Share2}
                title="شبکه‌های اجتماعی"
                iconBgColor="bg-pink"
                iconColor="stroke-pink-2"
                borderColor="border-b-pink-1"
                className="hover:shadow-lg transition-all duration-300"
            >
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="linkedin">لینکداین</Label>
                            <div className="relative flex items-center">
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
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
                                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
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
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
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
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
                                <Input
                                    id="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                                    disabled={!editMode}
                                    placeholder="شماره واتساپ..."
                                    className="ps-10"
                                    inputMode="tel"
                                    onKeyDown={preventNonNumeric}
                                    onPaste={preventNonNumericPaste}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telegram">تلگرام</Label>
                            <div className="relative flex items-center">
                                <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
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
                                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-font-s" />
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
                    </div>
            </CardWithIcon>
        </TabsContent>
    );
}