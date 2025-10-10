"use client";

import { useState } from "react";
import { Button } from "@/components/elements/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Label } from "@/components/elements/Label";
import { Textarea } from "@/components/elements/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/elements/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/Select";
import { Switch } from "@/components/elements/Switch";
import { 
  FileText, Edit2, Image, 
  Loader2, Save,
  Plus, Tag, FolderOpen,
  X, Play, Video, Music
} from "lucide-react";
import { MediaSelector } from "@/components/media/selectors/MediaSelector";
import { Media } from "@/types/shared/media";
import { TipTapEditor } from "@/components/forms/TipTapEditor";
import { PortfolioMediaGallery } from "@/components/portfolio";

// Add this interface for managing multiple media selections
interface PortfolioMedia {
  featuredImage: Media | null;
  imageGallery: Media[];
  videoGallery: Media[]; // This will contain at most 1 video with cover
  audioGallery: Media[]; // This will contain at most 1 audio with cover
  pdfDocuments: Media[]; // This will contain at most 1 PDF with cover
}

const staticAdminData = {
  id: 2,
  username: "admin_user",
  email: "admin@example.com",
  mobile: "09123456789",
  full_name: "نام کامل ادمین",
  is_active: true,
  is_staff: true,
  is_superuser: false,
  last_login: "2023-10-15T10:30:00Z",
  date_joined: "2023-01-15T08:00:00Z",
  profile: {
    first_name: "نام",
    last_name: "نام خانوادگی",
    phone: "02112345678",
    address: "آدرس کامل ادمین",
    province: { id: 1, name: "تهران" },
    city: { id: 1, name: "تهران" },
    bio: "بیوگرافی ادمین",
    national_id: "1234567890",
    department: "بخش ادمین",
    position: "سمت ادمین",
    notes: "یادداشت‌های داخلی",
    profile_picture: null
  },
  role: {
    id: 1,
    name: "content_manager",
    display_name: "مدیر محتوا"
  },
  created_at: "2023-01-15T08:00:00Z",
  updated_at: "2023-10-15T10:30:00Z"
};

const roles = [
  { id: 1, name: "content_manager", display_name: "مدیر محتوا" },
  { id: 2, name: "support_manager", display_name: "مدیر پشتیبانی" },
  { id: 3, name: "user_manager", display_name: "مدیر کاربران" }
];

export default function CreatePortfolioPage() {
  const [activeTab, setActiveTab] = useState<string>("account");
  const [editMode, setEditMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Replace single selectedMedia with portfolioMedia
  const [portfolioMedia, setPortfolioMedia] = useState<PortfolioMedia>({
    featuredImage: null,
    imageGallery: [],
    videoGallery: [],
    audioGallery: [],
    pdfDocuments: []
  });
  const [formData, setFormData] = useState({
    name: "نمونه‌کار جدید",
    slug: "new-portfolio-item",
    short_description: "توضیحات کوتاه نمونه‌کار",
    description: "<p>توضیحات کامل نمونه‌کار</p>",
    username: staticAdminData.username,
    email: staticAdminData.email,
    mobile: staticAdminData.mobile,
    full_name: staticAdminData.full_name,
    is_active: staticAdminData.is_active,
    is_superuser: staticAdminData.is_superuser,
    role_id: staticAdminData.role.id.toString(),
    profile_first_name: staticAdminData.profile.first_name,
    profile_last_name: staticAdminData.profile.last_name,
    profile_phone: staticAdminData.profile.phone,
    profile_address: staticAdminData.profile.address,
    profile_bio: staticAdminData.profile.bio,
    profile_national_id: staticAdminData.profile.national_id,
    profile_department: staticAdminData.profile.department,
    profile_position: staticAdminData.profile.position,
    profile_notes: staticAdminData.profile.notes
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    alert("تغییرات با موفقیت ذخیره شد!");
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("پیش‌نویس با موفقیت ذخیره شد!");
  };

  // Helper functions for managing portfolio media
  const handleFeaturedImageSelect = (media: Media | null) => {
    setPortfolioMedia(prev => ({
      ...prev,
      featuredImage: media
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ایجاد نمونه‌کار جدید</h1>
          <p className="text-muted-foreground">مدیریت اطلاعات نمونه‌کار</p>
        </div>
        <div className="flex gap-2">
          {!editMode && (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 className="w-4 h-4 me-2" />
              ویرایش
            </Button>
          )}
          {editMode && (
            <>
              <Button onClick={handleSaveDraft} variant="outline" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 me-2" />
                    ذخیره پیش‌نویس
                  </>
                )}
              </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 me-2" />
                  ذخیره
                </>
              )}
            </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="account">
            <FileText className="w-4 h-4 me-2" />
            اطلاعات پایه
          </TabsTrigger>
          <TabsTrigger value="security">
            <Image className="w-4 h-4 me-2" />
            مدیا
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>اطلاعات پایه</CardTitle>
                    <CardDescription>اطلاعات اصلی نمونه‌کار</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">نام *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          disabled={!editMode}
                          placeholder="نام نمونه‌کار"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">لینک (اسلاگ) *</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => handleInputChange("slug", e.target.value)}
                          disabled={!editMode}
                          placeholder="my-portfolio-item"
                        />
                      </div>
                      </div>
                      
                      <div className="space-y-2">
                      <Label htmlFor="short_description">توضیحات کوتاه *</Label>
                        <Textarea
                          id="short_description"
                          value={formData.short_description}
                          onChange={(e) => handleInputChange("short_description", e.target.value)}
                          disabled={!editMode}
                        placeholder="یک توضیح کوتاه درباره نمونه‌کار..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                      <Label htmlFor="description">توضیحات بلند *</Label>
                      <TipTapEditor
                        content={formData.description}
                        onChange={(content: string) => handleInputChange("description", content)}
                        placeholder="توضیحات کامل نمونه‌کار را وارد کنید..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="w-full lg:w-[420px] lg:flex-shrink-0">
              <Card className="lg:sticky lg:top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">تنظیمات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-blue-500" />
                      دسته‌بندی *
                    </Label>
                    <div className="flex gap-4 w-full">
                      <div className="flex-1">
                        <Select disabled={!editMode}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="web">طراحی وب</SelectItem>
                            <SelectItem value="mobile">اپلیکیشن موبایل</SelectItem>
                            <SelectItem value="desktop">نرم‌افزار دسکتاپ</SelectItem>
                            <SelectItem value="ui-ux">طراحی UI/UX</SelectItem>
                            <SelectItem value="branding">برندینگ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="p-0 bg-blue-50 hover:bg-blue-100 border-blue-200 flex-shrink-0"
                        style={{ height: '34px', width: '34px' }}
                        disabled={!editMode}
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="tags" className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-500" />
                      تگ‌ها *
                    </Label>
                    <div className="flex gap-4 w-full">
                      <div className="flex-1">
                        <Select disabled={!editMode}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="تگ‌ها را انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="react">React</SelectItem>
                            <SelectItem value="nextjs">Next.js</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                            <SelectItem value="nodejs">Node.js</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                            <SelectItem value="mongodb">MongoDB</SelectItem>
                            <SelectItem value="postgresql">PostgreSQL</SelectItem>
                            <SelectItem value="docker">Docker</SelectItem>
                            <SelectItem value="aws">AWS</SelectItem>
                            <SelectItem value="figma">Figma</SelectItem>
                            <SelectItem value="photoshop">Photoshop</SelectItem>
                            <SelectItem value="ui-ux">UI/UX</SelectItem>
                            <SelectItem value="responsive">Responsive</SelectItem>
                            <SelectItem value="pwa">PWA</SelectItem>
                            <SelectItem value="api">API</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="p-0 bg-green-50 hover:bg-green-100 border-green-200 flex-shrink-0"
                        style={{ height: '34px', width: '34px' }}
                        disabled={!editMode}
                      >
                        <Plus className="w-3 h-3 text-green-600" />
                      </Button>
                    </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>مدیا</CardTitle>
                    <CardDescription>مدیریت تصاویر و فایل‌های رسانه‌ای</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Featured Image Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">تصویر شاخص</h3>
                    <MediaSelector
                      selectedMedia={portfolioMedia.featuredImage}
                      onMediaSelect={handleFeaturedImageSelect}
                      label="تصویر شاخص"
                      size="lg"
                    />
                  </div>

                  {/* Image Gallery Section */}
                  <PortfolioMediaGallery
                    mediaItems={portfolioMedia.imageGallery}
                    onMediaSelect={(media) => setPortfolioMedia(prev => ({ ...prev, imageGallery: media }))}
                    mediaType="image"
                    title="گالری تصاویر"
                    isGallery={true} // This is a gallery (multiple images)
                  />

                  {/* Video Gallery Section - Single video with cover */}
                  <PortfolioMediaGallery
                    mediaItems={portfolioMedia.videoGallery}
                    onMediaSelect={(media) => setPortfolioMedia(prev => ({ ...prev, videoGallery: media }))}
                    mediaType="video"
                    title="ویدئو"
                    isGallery={false} // This is a single item with cover
                    maxSelection={1}
                  />

                  {/* Audio Gallery Section - Single audio with cover */}
                  <PortfolioMediaGallery
                    mediaItems={portfolioMedia.audioGallery}
                    onMediaSelect={(media) => setPortfolioMedia(prev => ({ ...prev, audioGallery: media }))}
                    mediaType="audio"
                    title="فایل صوتی"
                    isGallery={false} // This is a single item with cover
                    maxSelection={1}
                  />

                  {/* PDF Documents Section - Single PDF with cover */}
                  <PortfolioMediaGallery
                    mediaItems={portfolioMedia.pdfDocuments}
                    onMediaSelect={(media) => setPortfolioMedia(prev => ({ ...prev, pdfDocuments: media }))}
                    mediaType="pdf"
                    title="مستندات PDF"
                    isGallery={false} // This is a single item with cover
                    maxSelection={1}
                  />
                </CardContent>
              </Card>
              </div>
            </div>

            <div className="w-full lg:w-[420px] lg:flex-shrink-0">
              <Card className="lg:sticky lg:top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">تنظیمات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-blue-500" />
                      دسته‌بندی *
                    </Label>
                    <div className="flex gap-4 w-full">
                      <div className="flex-1">
                        <Select disabled={!editMode}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="web">طراحی وب</SelectItem>
                            <SelectItem value="mobile">اپلیکیشن موبایل</SelectItem>
                            <SelectItem value="desktop">نرم‌افزار دسکتاپ</SelectItem>
                            <SelectItem value="ui-ux">طراحی UI/UX</SelectItem>
                            <SelectItem value="branding">برندینگ</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="p-0 bg-blue-50 hover:bg-blue-100 border-blue-200 flex-shrink-0"
                        style={{ height: '34px', width: '34px' }}
                        disabled={!editMode}
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="tags" className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-500" />
                      تگ‌ها *
                    </Label>
                    <div className="flex gap-4 w-full">
                      <div className="flex-1">
                        <Select disabled={!editMode}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="تگ‌ها را انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="react">React</SelectItem>
                            <SelectItem value="nextjs">Next.js</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                            <SelectItem value="nodejs">Node.js</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                            <SelectItem value="mongodb">MongoDB</SelectItem>
                            <SelectItem value="postgresql">PostgreSQL</SelectItem>
                            <SelectItem value="docker">Docker</SelectItem>
                            <SelectItem value="aws">AWS</SelectItem>
                            <SelectItem value="figma">Figma</SelectItem>
                            <SelectItem value="photoshop">Photoshop</SelectItem>
                            <SelectItem value="ui-ux">UI/UX</SelectItem>
                            <SelectItem value="responsive">Responsive</SelectItem>
                            <SelectItem value="pwa">PWA</SelectItem>
                            <SelectItem value="api">API</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="p-0 bg-green-50 hover:bg-green-100 border-green-200 flex-shrink-0"
                        style={{ height: '34px', width: '34px' }}
                        disabled={!editMode}
                      >
                        <Plus className="w-3 h-3 text-green-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            </TabsContent>

      </Tabs>
    </div>
  );
}
