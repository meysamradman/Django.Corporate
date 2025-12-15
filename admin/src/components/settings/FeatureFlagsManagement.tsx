"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { featureFlagsApi, type FeatureFlags } from "@/api/feature-flags/route";
import { Button } from "@/components/elements/Button";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { Label } from "@/components/elements/Label";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/elements/Dialog";
import { Plus, Edit, Trash2, Power, PowerOff, Info, AlertCircle } from "lucide-react";
import { toast } from "@/components/elements/Sonner";
import { Loader } from "@/components/elements/Loader";
import { ProtectedButton } from "@/core/permissions";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/elements/Alert";
import { cn } from "@/core/utils/cn";

interface FeatureFlag {
  id?: number;
  public_id?: string;
  key: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// لیست Feature Flagهای پیشنهادی برای اپ‌های موجود
const SUGGESTED_FEATURE_FLAGS = [
  { key: "portfolio", description: "مدیریت پورتفولیو و نمونه کارها", icon: "📁" },
  { key: "blog", description: "سیستم بلاگ و مقالات", icon: "📝" },
  { key: "ai", description: "قابلیت‌های هوش مصنوعی", icon: "🤖" },
  { key: "chatbot", description: "چت‌بات و پشتیبانی", icon: "💬" },
  { key: "ticket", description: "سیستم تیکت و پشتیبانی", icon: "🎫" },
  { key: "email", description: "مدیریت ایمیل", icon: "📧" },
  { key: "page", description: "صفحات استاتیک (درباره ما، قوانین)", icon: "📄" },
  { key: "form", description: "سازنده فرم", icon: "📋" },
];

export function FeatureFlagsManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState<Partial<FeatureFlag>>({
    key: "",
    is_active: true,
    description: "",
  });

  const queryClient = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async () => {
      const { fetchApi } = await import("@/core/config/fetch");
      const response = await fetchApi.get<FeatureFlag[]>("/core/admin/feature-flags/");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<FeatureFlag>) => {
      const { fetchApi } = await import("@/core/config/fetch");
      const response = await fetchApi.post<FeatureFlag>("/core/admin/feature-flags/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      setIsCreateDialogOpen(false);
      setFormData({ key: "", is_active: true, description: "" });
      toast.success("Feature Flag با موفقیت ایجاد شد");
    },
    onError: (error: any) => {
      const message = error?.response?.metaData?.message || "خطا در ایجاد Feature Flag";
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, data }: { key: string; data: Partial<FeatureFlag> }) => {
      const { fetchApi } = await import("@/core/config/fetch");
      const response = await fetchApi.patch<FeatureFlag>(`/core/admin/feature-flags/${key}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      setEditingFlag(null);
      toast.success("Feature Flag با موفقیت به‌روزرسانی شد");
    },
    onError: (error: any) => {
      const message = error?.response?.metaData?.message || "خطا در به‌روزرسانی Feature Flag";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      const { fetchApi } = await import("@/core/config/fetch");
      await fetchApi.delete(`/core/admin/feature-flags/${key}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success("Feature Flag با موفقیت حذف شد");
    },
    onError: (error: any) => {
      const message = error?.response?.metaData?.message || "خطا در حذف Feature Flag";
      toast.error(message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (key: string) => {
      const { fetchApi } = await import("@/core/config/fetch");
      const response = await fetchApi.patch<FeatureFlag>(`/core/admin/feature-flags/${key}/toggle/`, {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success(
        `Feature Flag "${data.key}" ${data.is_active ? "فعال" : "غیرفعال"} شد. برای اعمال تغییرات، سرور را restart کنید.`
      );
    },
    onError: (error: any) => {
      const message = error?.response?.metaData?.message || "خطا در تغییر وضعیت Feature Flag";
      toast.error(message);
    },
  });

  const handleCreate = () => {
    if (!formData.key || !formData.key.trim()) {
      toast.error("کلید Feature Flag الزامی است");
      return;
    }
    // Normalize key: lowercase, no spaces
    const normalizedKey = formData.key.trim().toLowerCase().replace(/\s+/g, "_");
    createMutation.mutate({ ...formData, key: normalizedKey });
  };

  const handleEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      key: flag.key,
      is_active: flag.is_active,
      description: flag.description || "",
    });
  };

  const handleUpdate = () => {
    if (!editingFlag?.key) return;
    updateMutation.mutate({
      key: editingFlag.key,
      data: formData,
    });
  };

  const handleDelete = (key: string) => {
    if (confirm(`آیا از حذف Feature Flag "${key}" اطمینان دارید؟`)) {
      deleteMutation.mutate(key);
    }
  };

  const handleSuggestedFlag = (suggested: typeof SUGGESTED_FEATURE_FLAGS[0]) => {
    setFormData({
      key: suggested.key,
      is_active: true,
      description: suggested.description,
    });
    setIsCreateDialogOpen(true);
  };

  const existingKeys = flags.map((f: FeatureFlag) => f.key);
  const availableSuggestions = SUGGESTED_FEATURE_FLAGS.filter(
    (s) => !existingKeys.includes(s.key)
  );

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>توجه مهم</AlertTitle>
        <AlertDescription>
          بعد از تغییر وضعیت Feature Flag، برای اعمال تغییرات باید سرور Django را restart کنید.
          <br />
          <strong>نکته:</strong> داده‌های دیتابیس پاک نمی‌شوند، فقط دسترسی به APIها کنترل می‌شود.
        </AlertDescription>
      </Alert>

      {availableSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ایجاد سریع Feature Flagهای پیشنهادی</CardTitle>
            <CardDescription>
              برای فعال/غیرفعال کردن اپ‌های موجود، یکی از Feature Flagهای زیر را ایجاد کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableSuggestions.map((suggested) => (
                <Button
                  key={suggested.key}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => handleSuggestedFlag(suggested)}
                >
                  <span className="text-2xl">{suggested.icon}</span>
                  <span className="font-medium">{suggested.key}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {suggested.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Feature Flag های موجود ({flags.length})
        </h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <ProtectedButton permission="settings.manage">
              <Plus className="h-4 w-4" />
              ایجاد Feature Flag جدید
            </ProtectedButton>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ایجاد Feature Flag جدید</DialogTitle>
              <DialogDescription>
                یک Feature Flag جدید برای کنترل فعال/غیرفعال کردن قابلیت‌ها ایجاد کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="key">کلید (Key) *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="مثال: portfolio, blog, ai"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  فقط حروف انگلیسی، اعداد و underscore مجاز است
                </p>
              </div>
              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات اختیاری درباره این Feature Flag"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">فعال</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                انصراف
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "در حال ایجاد..." : "ایجاد"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {flags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              هیچ Feature Flagی وجود ندارد.
            </p>
            <p className="text-sm text-muted-foreground">
              برای شروع، یکی از Feature Flagهای پیشنهادی را ایجاد کنید.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flags.map((flag: FeatureFlag) => {
            const suggested = SUGGESTED_FEATURE_FLAGS.find(s => s.key === flag.key);
            return (
              <Card
                key={flag.key}
                className={cn(
                  "transition-all hover:shadow-lg",
                  flag.is_active ? "border-green/30" : "border-red/30 opacity-75"
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {suggested && (
                        <span className="text-2xl">{suggested.icon}</span>
                      )}
                      <div>
                        <CardTitle className="text-base font-semibold">{flag.key}</CardTitle>
                        {flag.description && (
                          <CardDescription className="mt-1 text-xs">
                            {flag.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant={flag.is_active ? "green" : "red"}>
                      {flag.is_active ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={flag.is_active ? "outline" : "default"}
                      className={cn(
                        "flex-1",
                        flag.is_active ? "" : "bg-green hover:bg-green/90"
                      )}
                      onClick={() => toggleMutation.mutate(flag.key)}
                      disabled={toggleMutation.isPending}
                    >
                      {flag.is_active ? (
                        <>
                          <PowerOff className="h-4 w-4 ml-2" />
                          غیرفعال کردن
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 ml-2" />
                          فعال کردن
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(flag)}
                    >
                      <Edit className="h-4 w-4 ml-2" />
                      ویرایش
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red hover:text-red hover:bg-red/10"
                      onClick={() => handleDelete(flag.key)}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editingFlag && (
        <Dialog open={!!editingFlag} onOpenChange={() => setEditingFlag(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ویرایش Feature Flag</DialogTitle>
              <DialogDescription>
                اطلاعات Feature Flag را ویرایش کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-key">کلید (Key)</Label>
                <Input
                  id="edit-key"
                  value={formData.key}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">توضیحات</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات اختیاری درباره این Feature Flag"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active">فعال</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFlag(null)}>
                انصراف
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "در حال ذخیره..." : "ذخیره"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
