import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { Circle, Edit2, Calendar } from "lucide-react";
import { FloatingActions } from "@/components/elements/FloatingActions";
import { formatDate } from "@/core/utils/format";

export default function PropertyStateViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const stateId = params?.id as string;

  const { data: state, isLoading, error } = useQuery({
    queryKey: ["property-state", stateId],
    queryFn: () => realEstateApi.getStateById(Number(stateId)),
    staleTime: 0,
    enabled: !!stateId,
  });

  if (!stateId) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">شناسه وضعیت ملک یافت نشد</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardWithIcon
          icon={Circle}
          title="اطلاعات وضعیت ملک"
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

  if (error || !state) {
    return (
      <div className="rounded-lg border p-6">
        <div className="text-center py-8">
          <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات وضعیت ملک</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <FloatingActions
        actions={[
          {
            icon: Edit2,
            label: "ویرایش وضعیت ملک",
            variant: "default",
            permission: "real_estate.state.update",
            onClick: () => navigate(`/real-estate/states/${state.id}/edit`),
          },
        ]}
        position="left"
      />

      <CardWithIcon
        icon={Circle}
        title="اطلاعات وضعیت ملک"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">عنوان</label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {state.title}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">وضعیت</label>
              <div>
                <Badge variant={state.is_active ? "green" : "red"}>
                  {state.is_active ? "فعال" : "غیرفعال"}
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
              {formatDate(state.created_at)}
            </div>
          </div>
        </div>
      </CardWithIcon>
    </div>
  );
}

