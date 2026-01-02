import { Card } from "@/components/elements/Card";
import { PageHeader } from "@/components/layout/PageHeader";

export default function RealEstateStaticPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="صفحات استاتیک املاک"
        description="مدیریت صفحات استاتیک بخش املاک"
      />
      
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">صفحات استاتیک املاک</h2>
          <p className="text-muted-foreground">
            این بخش برای مدیریت صفحات استاتیک بخش املاک طراحی شده است.
            در آینده این صفحات به صورت داینامیک قابل مدیریت خواهند بود.
          </p>
          
          <div className="mt-6 space-y-3">
            <div className="p-4 border">
              <h3 className="font-medium mb-2">صفحه اصلی املاک</h3>
              <p className="text-sm text-muted-foreground">
                صفحه اصلی نمایش املاک
              </p>
            </div>
            
            <div className="p-4 border">
              <h3 className="font-medium mb-2">صفحه جزئیات ملک</h3>
              <p className="text-sm text-muted-foreground">
                صفحه نمایش جزئیات یک ملک خاص
              </p>
            </div>
            
            <div className="p-4 border">
              <h3 className="font-medium mb-2">صفحه جستجوی املاک</h3>
              <p className="text-sm text-muted-foreground">
                صفحه جستجو و فیلتر املاک
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

