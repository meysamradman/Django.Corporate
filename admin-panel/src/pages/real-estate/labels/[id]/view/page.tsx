import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { Tag, Edit2, List, Calendar } from "lucide-react";
import { formatDate } from "@/core/utils/format";

export default function PropertyLabelViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const labelId = params?.id as string;

  const { data: label, isLoading, error } = useQuery({
    queryKey: ["property-label", labelId],
    queryFn: () => realEstateApi.getLabelById(Number(labelId)),
    staleTime: 0,
    enabled: !!labelId,
  });

  if (!labelId) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش برچسب ملک" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه برچسب ملک یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="اطلاعات برچسب ملک">
          <Button disabled>
            <Edit2 />
            ویرایش برچسب ملک
          </Button>
        </PageHeader>
        <CardWithIcon
          icon={Tag}
          title="اطلاعات برچسب ملک"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
        >
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
          </div>
        </CardWithIcon>
      </div>
    );
  }

  if (error || !label) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش برچسب ملک" />
        <div className="rounded-lg border p-6">
          <div className="text-center py-8">
            <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات برچسب ملک</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات برچسب ملک">
        <>
          <Button
            variant="outline"
            onClick={() => navigate("/real-estate/labels")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
          <Button
            onClick={() => navigate(`/real-estate/labels/${label.id}/edit`)}
          >
            <Edit2 className="h-4 w-4" />
            ویرایش برچسب ملک
          </Button>
        </>
      </PageHeader>

      <CardWithIcon
        icon={Tag}
        title="اطلاعات برچسب ملک"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">عنوان</label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {label.title}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">وضعیت</label>
              <div>
                <Badge variant={label.is_active ? "green" : "red"}>
                  {label.is_active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-font-s flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              تاریخ ایجاد
            </label>
            <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
              {formatDate(label.created_at)}
            </div>
          </div>
        </div>
      </CardWithIcon>
    </div>
  );
}

