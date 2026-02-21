import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { UserCircle } from "lucide-react";

interface AdminStaticProfileTabProps {
  isEditMode: boolean;
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  bio: string;
  onChange: (field: string, value: string) => void;
}

export function AdminStaticProfileTab(props: AdminStaticProfileTabProps) {
  const {
    isEditMode,
    firstName,
    lastName,
    birthDate,
    nationalId,
    phone,
    province,
    city,
    address,
    bio,
    onChange,
  } = props;

  return (
    <CardWithIcon
      icon={UserCircle}
      title="اطلاعات پروفایل"
      iconBgColor="bg-purple"
      iconColor="stroke-purple-2"
      cardBorderColor="border-b-purple-1"
      className="gap-0"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="static-first-name">نام</Label>
            <Input id="static-first-name" value={firstName} disabled={!isEditMode} onChange={(e) => onChange("firstName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="static-last-name">نام خانوادگی</Label>
            <Input id="static-last-name" value={lastName} disabled={!isEditMode} onChange={(e) => onChange("lastName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="static-birth-date">تاریخ تولد</Label>
            <Input id="static-birth-date" value={birthDate} disabled={!isEditMode} onChange={(e) => onChange("birthDate", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="static-national-id">کد ملی</Label>
            <Input id="static-national-id" value={nationalId} disabled={!isEditMode} onChange={(e) => onChange("nationalId", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="static-phone">تلفن</Label>
            <Input id="static-phone" value={phone} disabled={!isEditMode} onChange={(e) => onChange("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="static-province">استان</Label>
            <Input id="static-province" value={province} disabled={!isEditMode} onChange={(e) => onChange("province", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="static-city">شهر</Label>
            <Input id="static-city" value={city} disabled={!isEditMode} onChange={(e) => onChange("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="static-address">آدرس</Label>
            <Input id="static-address" value={address} disabled={!isEditMode} onChange={(e) => onChange("address", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="static-bio">بیوگرافی</Label>
          <Textarea id="static-bio" value={bio} rows={4} disabled={!isEditMode} onChange={(e) => onChange("bio", e.target.value)} />
        </div>
      </div>
    </CardWithIcon>
  );
}
