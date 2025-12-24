import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/elements/Button";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { Skeleton } from "@/components/elements/Skeleton";
import { realEstateApi } from "@/api/real-estate";
import { Hash, Edit2, List, Calendar } from "lucide-react";
import { formatDate } from "@/core/utils/format";

export default function PropertyTagViewPage() {
  const params = useParams();
  const navigate = useNavigate();
  const tagId = params?.id as string;

  const { data: tag, isLoading, error } = useQuery({
    queryKey: ["property-tag", tagId],
    queryFn: () => realEstateApi.getTagById(Number(tagId)),
    staleTime: 0,
    enabled: !!tagId,
  });

  if (!tagId) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش تگ ملک" />
        <div className="text-center py-8">
          <p className="text-destructive">شناسه تگ ملک یافت نشد</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="اطلاعات تگ ملک">
          <Button disabled>
            <Edit2 />
            ویرایش تگ ملک
          </Button>
        </PageHeader>
        <CardWithIcon
          icon={Hash}
          title="اطلاعات تگ ملک"
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

  if (error || !tag) {
    return (
      <div className="space-y-6">
        <PageHeader title="نمایش تگ ملک" />
        <div className="rounded-lg border p-6">
          <div className="text-center py-8">
            <p className="text-red-1 mb-4">خطا در بارگذاری اطلاعات تگ ملک</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="اطلاعات تگ ملک">
        <>
          <Button
            variant="outline"
            onClick={() => navigate("/real-estate/tags")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
          <Button
            onClick={() => navigate(`/real-estate/tags/${tag.id}/edit`)}
          >
            <Edit2 className="h-4 w-4" />
            ویرایش تگ ملک
          </Button>
        </>
      </PageHeader>

      <CardWithIcon
        icon={Hash}
        title="اطلاعات تگ ملک"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">عنوان</label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {tag.title}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">نامک</label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {tag.slug}
              </div>
            </div>
          </div>

          {tag.description && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">توضیحات</label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {tag.description}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">وضعیت</label>
              <div>
                <Badge variant={tag.is_active ? "green" : "red"}>
                  {tag.is_active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s">عمومی</label>
              <div>
                <Badge variant={tag.is_public ? "blue" : "gray"}>
                  {tag.is_public ? "عمومی" : "خصوصی"}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-font-s flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تاریخ ایجاد
              </label>
              <div className="px-3 py-2 rounded-md border border-br bg-bg/50 text-font-p">
                {formatDate(tag.created_at)}
              </div>
            </div>
          </div>
        </div>
      </CardWithIcon>
    </div>
  );
}

