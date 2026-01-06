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

interface AgencyItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  license_number: string;
  established_year: number;
  status: "active" | "inactive";
  created_at: string;
  is_featured: boolean;
  is_active: boolean;
  description?: string;
}

const getStaticAgencyData = (id: string): AgencyItem | null => {
  const staticData: AgencyItem[] = [
    {
      id: 1,
      name: "آژانس املاک پایتخت",
      phone: "021-12345678",
      email: "info@paitakht-agency.com",
      address: "تهران، میدان ونک، خیابان ولیعصر",
      license_number: "AG-12345",
      established_year: 2015,
      status: "active",
      created_at: "2024-01-15T10:30:00Z",
      is_featured: true,
      is_active: true,
      description: "آژانس املاک پایتخت با بیش از 8 سال سابقه در زمینه خرید و فروش و اجاره املاک مسکونی و تجاری.",
    },
    {
      id: 2,
      name: "آژانس املاک زعفرانیه",
      phone: "021-87654321",
      email: "info@zaferanieh-agency.com",
      address: "تهران، زعفرانیه، خیابان ولیعصر",
      license_number: "AG-12346",
      established_year: 2010,
      status: "active",
      created_at: "2024-01-20T14:20:00Z",
      is_featured: true,
      is_active: true,
      description: "آژانس تخصصی در املاک لوکس و ویلاهای شمال تهران.",
    },
    {
      id: 3,
      name: "آژانس املاک پاسداران",
      phone: "021-11223344",
      email: "info@pasdaran-agency.com",
      address: "تهران، پاسداران، خیابان فرمانیه",
      license_number: "AG-12347",
      established_year: 2018,
      status: "inactive",
      created_at: "2024-01-10T09:15:00Z",
      is_featured: false,
      is_active: false,
      description: "آژانس املاک در منطقه پاسداران.",
    },
    {
      id: 4,
      name: "آژانس املاک کرج",
      phone: "026-44556677",
      email: "info@karaj-agency.com",
      address: "کرج، میدان آزادی، خیابان شهید بهشتی",
      license_number: "AG-12348",
      established_year: 2012,
      status: "active",
      created_at: "2024-01-25T11:45:00Z",
      is_featured: false,
      is_active: true,
      description: "آژانس املاک در کرج با سابقه در املاک مسکونی و تجاری.",
    },
  ];

  const item = staticData.find(item => item.id === Number(id));
  return item || null;
};

const BaseInfoTab = ({ formData, handleInputChange, editMode }: {
  formData: AgencyItem;
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
              <Label htmlFor="name">نام آژانس</Label>
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
              <Label htmlFor="established_year">سال تاسیس</Label>
              <Input
                id="established_year"
                type="number"
                value={formData.established_year}
                onChange={(e) => handleInputChange("established_year", parseInt(e.target.value) || 0)}
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
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
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

export default function AgencyEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const agencyId = id ? Number(id) : undefined;
  const [activeTab, setActiveTab] = useState<string>("base-info");
  const [editMode, setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AgencyItem | null>(null);

  useEffect(() => {
    if (agencyId !== undefined) {
      const item = getStaticAgencyData(String(agencyId));
      if (item) {
        setFormData(item);
      }
    }
  }, [agencyId]);

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      } as AgencyItem;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate("/staticstyle/realstate/agencies/list");
    }, 1500);
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate("/staticstyle/realstate/agencies/list");
    }, 1500);
  };

  if (!formData) {
    return (
      <div className="space-y-6">
        <PageHeader title="ویرایش آژانس" />
        <div className="text-center py-8">
          <p className="text-destructive">آژانس مورد نظر یافت نشد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 relative">
      <PageHeader title="ویرایش آژانس">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/staticstyle/realstate/agencies/list")}
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

