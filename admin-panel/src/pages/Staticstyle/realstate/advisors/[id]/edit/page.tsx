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
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";
import {
  FileText, Edit2,
  Loader2, Save, List, Settings,
} from "lucide-react";

interface AdvisorItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  license_number: string;
  experience_years: number;
  status: "active" | "inactive";
  created_at: string;
  is_featured: boolean;
  is_active: boolean;
  bio?: string;
  address?: string;
}

const getStaticAdvisorData = (id: string): AdvisorItem | null => {
  const staticData: AdvisorItem[] = [
    {
      id: 1,
      name: "علی احمدی",
      phone: "09123456789",
      email: "ali.ahmadi@example.com",
      license_number: "RE-12345",
      experience_years: 5,
      status: "active",
      created_at: "2024-01-15T10:30:00Z",
      is_featured: true,
      is_active: true,
      bio: "مشاور املاک با بیش از 5 سال سابقه در زمینه خرید و فروش و اجاره املاک مسکونی و تجاری.",
      address: "تهران، زعفرانیه، خیابان ولیعصر",
    },
    {
      id: 2,
      name: "مریم رضایی",
      phone: "09129876543",
      email: "maryam.rezaei@example.com",
      license_number: "RE-12346",
      experience_years: 8,
      status: "active",
      created_at: "2024-01-20T14:20:00Z",
      is_featured: true,
      is_active: true,
      bio: "مشاور حرفه‌ای املاک با 8 سال تجربه. متخصص در املاک لوکس و ویلاهای شمال.",
      address: "تهران، پاسداران، خیابان فرمانیه",
    },
    {
      id: 3,
      name: "حسین کریمی",
      phone: "09121112233",
      email: "hossein.karimi@example.com",
      license_number: "RE-12347",
      experience_years: 3,
      status: "inactive",
      created_at: "2024-01-10T09:15:00Z",
      is_featured: false,
      is_active: false,
      bio: "مشاور املاک تازه کار با علاقه به یادگیری و پیشرفت.",
      address: "تهران، ونک، خیابان ملاصدرا",
    },
    {
      id: 4,
      name: "فاطمه محمدی",
      phone: "09124445566",
      email: "fateme.mohammadi@example.com",
      license_number: "RE-12348",
      experience_years: 10,
      status: "active",
      created_at: "2024-01-25T11:45:00Z",
      is_featured: false,
      is_active: true,
      bio: "مشاور با سابقه در زمینه املاک تجاری و اداری.",
      address: "تهران، میدان ونک، خیابان ولیعصر",
    },
  ];

  const item = staticData.find(item => item.id === Number(id));
  return item || null;
};

const BaseInfoTab = ({ formData, handleInputChange, editMode }: {
  formData: AdvisorItem;
  handleInputChange: (field: string, value: string | boolean | number) => void;
  editMode: boolean;
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <CardWithIcon
          icon={FileText}
          title="اطلاعات پایه"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          contentClassName="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">نام</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!editMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">شماره تماس</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!editMode}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!editMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license_number">شماره پروانه</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleInputChange("license_number", e.target.value)}
                disabled={!editMode}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="experience_years">سابقه کار (سال)</Label>
              <Input
                id="experience_years"
                type="number"
                value={formData.experience_years}
                onChange={(e) => handleInputChange("experience_years", parseInt(e.target.value) || 0)}
                disabled={!editMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">وضعیت</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                disabled={!editMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">آدرس</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">بیوگرافی</Label>
            <Textarea
              id="bio"
              value={formData.bio || ""}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              disabled={!editMode}
              rows={6}
            />
          </div>
        </CardWithIcon>
      </div>
      <div className="w-full lg:w-[420px] lg:flex-shrink-0">
        <CardWithIcon
          icon={Settings}
          title="تنظیمات"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          contentClassName="space-y-8"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">فعال</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              disabled={!editMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="is_featured">ویژه</Label>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
              disabled={!editMode}
            />
          </div>
        </CardWithIcon>
      </div>
    </div>
  );
};

export default function AdvisorEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const advisorId = id ? Number(id) : undefined;
  const [activeTab, setActiveTab] = useState<string>("base-info");
  const [editMode, setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AdvisorItem | null>(null);

  useEffect(() => {
    if (advisorId !== undefined) {
      const item = getStaticAdvisorData(String(advisorId));
      if (item) {
        setFormData(item);
      }
    }
  }, [advisorId]);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      } as AdvisorItem;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate("/staticstyle/realstate/advisors/list");
    }, 1500);
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate("/staticstyle/realstate/advisors/list");
    }, 1500);
  };

  if (!formData) {
    return (
      <div className="space-y-6">
        <PageHeader title="ویرایش مشاور" />
        <div className="text-center py-8">
          <p className="text-destructive">مشاور مورد نظر یافت نشد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <PageHeader title="ویرایش مشاور">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/staticstyle/realstate/advisors/list")}
          >
            <List className="h-4 w-4" />
            نمایش لیست
          </Button>
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 />
              ویرایش
            </Button>
          )}
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="base-info">
            <FileText className="h-4 w-4" />
            اطلاعات پایه
          </TabsTrigger>
        </TabsList>

        <TabsContent value="base-info">
          <BaseInfoTab
            formData={formData}
            handleInputChange={handleInputChange}
            editMode={editMode}
          />
        </TabsContent>
      </Tabs>

      {editMode && (
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
      )}
    </div>
  );
}

