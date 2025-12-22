import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/elements/Button";
import { Badge } from "@/components/elements/Badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/elements/AlertDialog";
import { Power, PowerOff, AlertCircle, CheckCircle2, XCircle, FolderOpen, FileText, Bot, MessageSquare, Ticket, Mail, File, FormInput, type LucideIcon } from "lucide-react";
import { showSuccess, showError } from "@/core/toast";
import { Skeleton } from "@/components/elements/Skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/elements/Alert";
import { cn } from "@/core/utils/cn";
import { FEATURE_FLAGS_CONFIG } from "@/core/feature-flags/featureFlags";
import type { FeatureFlag } from "@/types/shared/featureFlags";

const SUGGESTED_FEATURE_FLAGS = FEATURE_FLAGS_CONFIG;

const getFeatureIcon = (key: string): LucideIcon => {
  switch (key) {
    case "portfolio":
      return FolderOpen;
    case "blog":
      return FileText;
    case "ai":
      return Bot;
    case "chatbot":
      return MessageSquare;
    case "ticket":
      return Ticket;
    case "email":
      return Mail;
    case "page":
      return File;
    case "form":
      return FormInput;
    default:
      return FileText;
  }
};

export function FeatureFlagsManagement() {
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    flag: FeatureFlag | null;
  }>({ open: false, flag: null });

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: async () => {
      const { api } = await import("@/core/config/api");
      const response = await api.get<FeatureFlag[]>("/core/admin/feature-flags/");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const existingKeys = flags.map((f: FeatureFlag) => f.key);
  const missingFlags = SUGGESTED_FEATURE_FLAGS.filter(
    (s) => !existingKeys.includes(s.key)
  );

  const createMutation = useMutation({
    mutationFn: async (data: Partial<FeatureFlag>) => {
      const { api } = await import("@/core/config/api");
      const response = await api.post<FeatureFlag>("/core/admin/feature-flags/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
    },
    onError: () => {
    },
  });

  useEffect(() => {
    if (!isLoading && missingFlags.length > 0) {
      missingFlags.forEach((suggested) => {
        createMutation.mutate({
          key: suggested.key,
          is_active: true,
          description: suggested.description,
        });
      });
    }
  }, [isLoading, missingFlags.length]);

  const toggleMutation = useMutation({
    mutationFn: async (key: string) => {
      const { api } = await import("@/core/config/api");
      const response = await api.patch<FeatureFlag>(`/core/admin/feature-flags/${key}/toggle/`, {});
      return response.data;
    },
    onMutate: async (key: string) => {
      await queryClient.cancelQueries({ queryKey: ["admin-feature-flags"] });
      
      const previousFlags = queryClient.getQueryData<FeatureFlag[]>(["admin-feature-flags"]);
      
      if (previousFlags) {
        queryClient.setQueryData<FeatureFlag[]>(["admin-feature-flags"], (old) => {
          if (!old) return old;
          return old.map((flag) =>
            flag.key === key ? { ...flag, is_active: !flag.is_active } : flag
          );
        });
      }
      
      return { previousFlags };
    },
    onError: (err, _key, context) => {
      if (context?.previousFlags) {
        queryClient.setQueryData(["admin-feature-flags"], context.previousFlags);
      }
      const message = (err as any)?.response?.metaData?.message || "خطا در تغییر وضعیت Feature Flag";
      showError(message);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      await queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      await queryClient.refetchQueries({ queryKey: ["feature-flags"] });
      showSuccess(
        `Feature Flag "${data.key}" ${data.is_active ? "فعال" : "غیرفعال"} شد.`
      );
    },
  });

  const handleToggleClick = (flag: FeatureFlag) => {
    if (flag.is_active) {
      setConfirmDialog({ open: true, flag });
    } else {
      toggleMutation.mutate(flag.key);
    }
  };

  const handleConfirmToggle = () => {
    if (confirmDialog.flag) {
      toggleMutation.mutate(confirmDialog.flag.key);
      setConfirmDialog({ open: false, flag: null });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="rounded-xl border p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>توجه مهم</AlertTitle>
        <AlertDescription>
          با تغییر وضعیت Feature Flag، دسترسی به APIها به صورت خودکار کنترل می‌شود.
          <br />
          <strong>نکته:</strong> داده‌های دیتابیس پاک نمی‌شوند، فقط دسترسی به APIها کنترل می‌شود.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-font-p">
          ویژگی‌های سیستم ({flags.length})
        </h2>
      </div>

      {flags.length === 0 ? (
        <Card className="border-br bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-font-s mb-4">
              در حال بارگذاری Feature Flagها...
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {flags.map((flag: FeatureFlag) => {
            const Icon = getFeatureIcon(flag.key);
            
            const getColorClasses = (featureKey: string, isActive: boolean) => {
              if (!isActive) {
                return {
                  border: "border-red-1/40 hover:border-red-1/60",
                  iconBg: "bg-red-0",
                  iconText: "text-red-2",
                };
              }
              
              switch (featureKey) {
                case "portfolio":
                  return {
                    border: "border-purple-1/40 hover:border-purple-1/60",
                    iconBg: "bg-purple-0",
                    iconText: "text-purple-2",
                  };
                case "ai":
                  return {
                    border: "border-pink-1/40 hover:border-pink-1/60",
                    iconBg: "bg-pink-0",
                    iconText: "text-pink-2",
                  };
                case "ticket":
                  return {
                    border: "border-orange-1/40 hover:border-orange-1/60",
                    iconBg: "bg-orange-0",
                    iconText: "text-orange-2",
                  };
                default:
                  return {
                    border: "border-blue-1/40 hover:border-blue-1/60",
                    iconBg: "bg-blue-0",
                    iconText: "text-blue-2",
                  };
              }
            };
            
            const colorClasses = getColorClasses(flag.key, flag.is_active);
            
            return (
              <Card
                key={flag.key}
                className={cn(
                  "transition-all duration-200 border-2 bg-card hover:shadow-md",
                  colorClasses.border,
                  !flag.is_active && "opacity-90"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", colorClasses.iconBg)}>
                        <Icon className={cn("h-5 w-5", colorClasses.iconText)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold text-font-p truncate">
                          {flag.key}
                        </CardTitle>
                        {flag.description && (
                          <CardDescription className="mt-1.5 text-xs text-font-s line-clamp-2">
                            {flag.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={flag.is_active ? "green" : "red"}
                      className="flex-shrink-0"
                    >
                      {flag.is_active ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span className="mr-1">
                        {flag.is_active ? "فعال" : "غیرفعال"}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant={flag.is_active ? "outline" : "default"}
                    size="default"
                    className={cn(
                      "w-full font-medium transition-all duration-200",
                      flag.is_active 
                        ? "border-red-1 text-red-2 hover:bg-red-0 hover:border-red-1 hover:text-red-2" 
                        : "bg-green-1 text-static-w hover:bg-green-1/90 shadow-sm"
                    )}
                    onClick={() => handleToggleClick(flag)}
                    disabled={toggleMutation.isPending}
                  >
                    {flag.is_active ? (
                      <>
                        <PowerOff className="h-4 w-4" />
                        <span>غیرفعال کردن</span>
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4" />
                        <span>فعال کردن</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => {
        if (!open) {
          setConfirmDialog({ open: false, flag: null });
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-0 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-2" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold text-font-p">
                غیرفعال کردن Feature Flag
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-font-s text-sm leading-relaxed pt-2">
              آیا از غیرفعال کردن <strong className="text-font-p">"{confirmDialog.flag?.key}"</strong> اطمینان دارید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="text-font-s text-sm leading-relaxed pt-2 px-6">
            <p className="mb-2">با غیرفعال کردن این Feature Flag:</p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-font-s pr-4">
              <li>دسترسی به APIهای مربوطه مسدود می‌شود</li>
              <li>منوی مربوطه در پنل مدیریت پنهان می‌شود</li>
              <li>داده‌های موجود در دیتابیس حفظ می‌شوند</li>
            </ul>
          </div>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="border-br text-font-s hover:bg-bg">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              className="bg-red-1 text-static-w hover:bg-red-1/90"
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? (
                <>
                  <PowerOff className="h-4 w-4 animate-spin" />
                  <span>در حال انجام...</span>
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4" />
                  <span>غیرفعال کردن</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
