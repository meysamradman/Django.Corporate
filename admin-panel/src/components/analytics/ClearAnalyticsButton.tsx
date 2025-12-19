import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/elements/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/elements/AlertDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select";
import { analyticsApi } from "@/api/analytics/analytics";
import { toast } from "@/components/elements/Sonner";
import { useQueryClient } from "@tanstack/react-query";

export function ClearAnalyticsButton() {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<'all' | '6months' | 'custom'>('6months');
  const [isClearing, setIsClearing] = useState(false);
  const queryClient = useQueryClient();

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const result = await analyticsApi.clearAnalytics(period);
      
      toast.success(
        `با موفقیت ${result.deleted_page_views.toLocaleString('fa-IR')} بازدید و ${result.deleted_daily_stats.toLocaleString('fa-IR')} آمار روزانه پاک شد`
      );
      
      // Invalidate و refetch همه queries مربوط به analytics
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics", "monthly-stats"] });
      
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "خطا در پاک کردن بازدیدها");
    } finally {
      setIsClearing(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'all':
        return 'همه بازدیدها';
      case '6months':
        return 'بازدیدهای 6 ماه گذشته';
      case 'custom':
        return 'بازدیدهای سفارشی';
      default:
        return '';
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          پاک کردن بازدیدها
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>پاک کردن بازدیدها</AlertDialogTitle>
          <AlertDialogDescription>
            آیا از پاک کردن بازدیدها اطمینان دارید؟ این عمل غیرقابل بازگشت است.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-font-p">
              انتخاب بازه زمانی:
            </label>
            <Select value={period} onValueChange={(value: 'all' | '6months' | 'custom') => setPeriod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">بازدیدهای 6 ماه گذشته</SelectItem>
                <SelectItem value="all">همه بازدیدها</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs text-font-s">
            شما در حال پاک کردن: <strong>{getPeriodLabel()}</strong>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            disabled={isClearing}
            className="bg-red-1 hover:bg-red-1/90"
          >
            {isClearing ? "در حال پاک کردن..." : "پاک کردن"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

