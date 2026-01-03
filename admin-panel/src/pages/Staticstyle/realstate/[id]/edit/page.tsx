import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/elements/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/elements/Tabs";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { 
  FileText, Edit2, Image, Search,
  Loader2, Save, List,
} from "lucide-react";

// نوع داده استاتیک برای املاک
interface RealEstateItem {
  id: number;
  title: string;
  address: string;
  price: number;
  area: number;
  rooms: number;
  status: "available" | "sold" | "rented";
  type: "apartment" | "villa" | "office" | "land";
  created_at: string;
  is_featured: boolean;
  is_active: boolean;
  description?: string;
  short_description?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  canonical_url?: string;
  robots_meta?: string;
}

// داده استاتیک نمونه
const getStaticRealEstateData = (id: string): RealEstateItem | null => {
  const staticData: RealEstateItem[] = [
    {
      id: 1,
      title: "آپارتمان 120 متری در زعفرانیه",
      address: "تهران، زعفرانیه، خیابان ولیعصر",
      price: 8500000000,
      area: 120,
      rooms: 3,
      status: "available",
      type: "apartment",
      created_at: "2024-01-15T10:30:00Z",
      is_featured: true,
      is_active: true,
      description: "آپارتمان زیبا و مدرن در یکی از بهترین مناطق تهران.",
      short_description: "آپارتمان 120 متری در زعفرانیه",
      meta_title: "آپارتمان 120 متری در زعفرانیه",
      meta_description: "آپارتمان زیبا و مدرن در زعفرانیه",
    },
    {
      id: 2,
      title: "ویلا 250 متری در لواسان",
      address: "لواسان، جاده کندوان",
      price: 12000000000,
      area: 250,
      rooms: 4,
      status: "available",
      type: "villa",
      created_at: "2024-01-20T14:20:00Z",
      is_featured: true,
      is_active: true,
      description: "ویلای لوکس و مجلل در لواسان با فضای سبز وسیع.",
      short_description: "ویلا 250 متری در لواسان",
    },
    {
      id: 3,
      title: "دفتر کار 80 متری در ونک",
      address: "تهران، ونک، خیابان ملاصدرا",
      price: 4500000000,
      area: 80,
      rooms: 0,
      status: "rented",
      type: "office",
      created_at: "2024-01-10T09:15:00Z",
      is_featured: false,
      is_active: true,
      description: "دفتر کار مناسب برای کسب و کارهای کوچک و متوسط.",
      short_description: "دفتر کار 80 متری در ونک",
    },
  ];

  const item = staticData.find(item => item.id === Number(id));
  return item || null;
};

export default function RealEstateEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("account");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [realEstate, setRealEstate] = useState<RealEstateItem | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    price: "",
    area: "",
    rooms: "",
    type: "apartment" as "apartment" | "villa" | "office" | "land",
    status: "available" as "available" | "sold" | "rented",
    description: "",
    short_description: "",
    meta_title: "",
    meta_description: "",
    og_title: "",
    og_description: "",
    canonical_url: "",
    robots_meta: "",
    is_public: true,
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    if (id) {
      const data = getStaticRealEstateData(id);
      if (data) {
        setRealEstate(data);
        setFormData({
          title: data.title || "",
          address: data.address || "",
          price: data.price.toString() || "",
          area: data.area.toString() || "",
          rooms: data.rooms.toString() || "",
          type: data.type,
          status: data.status,
          description: data.description || "",
          short_description: data.short_description || "",
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
          og_title: data.og_title || "",
          og_description: data.og_description || "",
          canonical_url: data.canonical_url || "",
          robots_meta: data.robots_meta || "",
          is_public: true,
          is_active: data.is_active ?? true,
          is_featured: data.is_featured ?? false,
        });
      }
      setIsLoading(false);
    }
  }, [id]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // در آینده می‌تواند به API ارسال شود
      console.log("ذخیره داده‌ها:", formData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // شبیه‌سازی API
      navigate("/staticstyle/realstate/list");
    } catch (error) {
      console.error("خطا در ذخیره:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // در آینده می‌تواند به API ارسال شود
      console.log("ذخیره پیش‌نویس:", formData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // شبیه‌سازی API
      navigate("/staticstyle/realstate/list");
    } catch (error) {
      console.error("خطا در ذخیره پیش‌نویس:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-28 relative">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">ویرایش ملک</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <List className="h-4 w-4" />
              نمایش لیست
            </Button>
            <Button disabled>
              <Edit2 />
              ویرایش
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!realEstate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">ویرایش ملک</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-destructive">ملک مورد نظر یافت نشد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">ویرایش ملک</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate("/staticstyle/realstate/list")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="account">
            <FileText className="h-4 w-4" />
            اطلاعات پایه
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="h-4 w-4" />
            مدیا
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="h-4 w-4" />
            سئو
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-0">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <CardWithIcon
                icon={FileText}
                title="اطلاعات پایه"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                borderColor="border-b-blue-1"
                contentClassName="space-y-6 pt-6"
              >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">عنوان *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          placeholder="عنوان ملک"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">آدرس *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="آدرس ملک"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="price">قیمت (تومان) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          placeholder="قیمت"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">متراژ (متر) *</Label>
                        <Input
                          id="area"
                          type="number"
                          value={formData.area}
                          onChange={(e) => handleInputChange("area", e.target.value)}
                          placeholder="متراژ"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rooms">تعداد اتاق</Label>
                        <Input
                          id="rooms"
                          type="number"
                          value={formData.rooms}
                          onChange={(e) => handleInputChange("rooms", e.target.value)}
                          placeholder="تعداد اتاق"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="type">نوع ملک *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => handleInputChange("type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="نوع ملک" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apartment">آپارتمان</SelectItem>
                            <SelectItem value="villa">ویلا</SelectItem>
                            <SelectItem value="office">دفتر کار</SelectItem>
                            <SelectItem value="land">زمین</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">وضعیت *</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleInputChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="وضعیت" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">موجود</SelectItem>
                            <SelectItem value="sold">فروخته شده</SelectItem>
                            <SelectItem value="rented">اجاره داده شده</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="short_description">توضیحات کوتاه</Label>
                      <Textarea
                        id="short_description"
                        value={formData.short_description}
                        onChange={(e) => handleInputChange("short_description", e.target.value)}
                        placeholder="توضیحات کوتاه"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">توضیحات کامل</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="توضیحات کامل"
                        rows={6}
                      />
                    </div>
                  </div>
              </CardWithIcon>
            </div>

            <div className="w-full lg:w-[420px] lg:flex-shrink-0">
              <CardWithIcon
                icon={FileText}
                title="تنظیمات"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                borderColor="border-b-purple-1"
                className="lg:sticky lg:top-20"
                contentClassName="space-y-4 pt-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">فعال</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_featured">ویژه</Label>
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_public">عمومی</Label>
                    <Switch
                      id="is_public"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => handleInputChange("is_public", checked)}
                    />
                  </div>
                </div>
              </CardWithIcon>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <CardWithIcon
            icon={Image}
            title="مدیا"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            contentClassName="pt-6"
          >
            <p className="text-font-s mb-4">
              در این بخش می‌توانید تصاویر و ویدیوهای مربوط به ملک را مدیریت کنید.
            </p>
            <div className="p-8 border-2 border-dashed text-center">
              <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">هیچ مدیایی اضافه نشده است</p>
            </div>
          </CardWithIcon>
        </TabsContent>

        <TabsContent value="seo" className="mt-0">
          <CardWithIcon
            icon={Search}
            title="اطلاعات سئو"
            iconBgColor="bg-emerald"
            iconColor="stroke-emerald-2"
            borderColor="border-b-emerald-1"
            contentClassName="space-y-6 pt-6"
          >
            <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange("meta_title", e.target.value)}
                    placeholder="Meta Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange("meta_description", e.target.value)}
                    placeholder="Meta Description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_title">OG Title</Label>
                  <Input
                    id="og_title"
                    value={formData.og_title}
                    onChange={(e) => handleInputChange("og_title", e.target.value)}
                    placeholder="OG Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_description">OG Description</Label>
                  <Textarea
                    id="og_description"
                    value={formData.og_description}
                    onChange={(e) => handleInputChange("og_description", e.target.value)}
                    placeholder="OG Description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canonical_url">Canonical URL</Label>
                  <Input
                    id="canonical_url"
                    value={formData.canonical_url}
                    onChange={(e) => handleInputChange("canonical_url", e.target.value)}
                    placeholder="Canonical URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="robots_meta">Robots Meta</Label>
                  <Input
                    id="robots_meta"
                    value={formData.robots_meta}
                    onChange={(e) => handleInputChange("robots_meta", e.target.value)}
                    placeholder="Robots Meta"
                  />
                </div>
              </div>
          </CardWithIcon>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 lg:right-[20rem] z-50 border-t border-br bg-card shadow-lg transition-all duration-300 flex items-center justify-end gap-3 py-4 px-8">
        <Button 
          onClick={handleSaveDraft} 
          variant="outline" 
          size="lg"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ذخیره پیش‌نویس
            </>
          )}
        </Button>
        <Button 
          onClick={handleSave} 
          size="lg"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              ذخیره
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

