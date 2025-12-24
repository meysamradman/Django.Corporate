import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { showError } from '@/core/toast';
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { Building, Edit2, List, Calendar } from "lucide-react";
import { formatDate } from "@/core/utils/format";

export default function PropertyTypeViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const typeId = params?.id as string;

  const { data: type, isLoading, error } = useQuery({
    queryKey: ["property-type", typeId],
    queryFn: () => realEstateApi.getTypeById(Number(typeId)),
    staleTime: 0,
    enabled: !!typeId,
  });

  if (!typeId) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش نوع ملک" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه نوع ملک یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="اطلاعات نوع ملک">
          <Button disabled>
            <Edit2 />
            ویرایش نوع ملک
          </Button>
        </PageHeader>
        <CardWithIcon
          icon={Building}
          title="اطلاعات نوع ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </CardWithIcon>
      </div>
    );
  }

  if (error || !type) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش نوع ملک" />
        <div className="rounded-lg border p-6">
          <div className="text-center py-8">
            <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات نوع ملک</p>
            <p className="text-font-s">
              لطفاً دوباره تلاش کنید یا با مدیر سیستم تماس بگیرید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات نوع ملک">
        <>
          <Button
            variant="outline"
            onClick={() => navigate("/real-estate/types")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
          <Button
            onClick={() => navigate(`/real-estate/types/${type.id}/edit`)}
          >
            <Edit2 className="h-4 w-4" />
            ویرایش نوع ملک
          </Button>
        </>
      </PageHeader>

      <CardWithIcon
        icon={Building}
        title="اطلاعات نوع ملک"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">عنوان</label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {type.title}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">ترتیب نمایش</label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {type.display_order}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">وضعیت</label>
              <div>
                <Badge variant={type.is_active ? "green" : "red"}>
                  {type.is_active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تاریخ ایجاد
              </label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {formatDate(type.created_at)}
              </div>
            </div>
          </div>
        </div>
      </CardWithIcon>
    </div>
  );
}

